// Server-side OpenAI image generation. Runs in Node only — the API key never reaches the browser.
//
//   npm run images -- --dry-run          show the routing plan without calling the API
//   npm run images                       generate assets that do not exist yet
//   npm run images -- --only=pharmacy-counter --force
//   npm run images -- --only=cta-texture --escalate   retry an asset on the premium model
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { imageConfig as config } from '../image-generation.config.mjs';
import { assets } from './images/manifest.mjs';

if (existsSync('.env')) process.loadEnvFile('.env');

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const dryRun = args.has('dry-run');
const force = args.has('force');
const escalate = args.has('escalate');
const only = args.get('only');

export function routeModel(asset, { escalated = false } = {}) {
  const { strongTraits, premiumTraits } = config.routing;
  const traits = new Set(asset.traits ?? []);
  if (asset.reference) traits.add('reference-image');
  const strong = [...traits].filter((t) => strongTraits.includes(t));
  const premium = [...traits].filter((t) => premiumTraits.includes(t));
  const usePremium =
    escalated ||
    asset.priority === 'critical' ||
    strong.length > 0 ||
    premium.length >= 2;
  const reason = escalated
    ? 'escalated after insufficient standard result'
    : asset.priority === 'critical'
      ? 'critical asset'
      : strong.length
        ? `strong trait: ${strong.join(', ')}`
        : premium.length >= 2
          ? `premium traits: ${premium.join(', ')}`
          : 'routine asset';
  return {
    tier: usePremium ? 'premium' : 'standard',
    model: usePremium ? config.models.premium : config.models.standard,
    reason,
  };
}

export function routeQuality(asset, tier) {
  const important =
    config.routing.highQualityPriorities.includes(asset.priority) ||
    tier === 'premium';
  return important ? config.quality.premium : config.quality.default;
}

async function requestImage(asset, model, quality) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is not set.');
  const size = config.sizes[asset.orientation];
  const signal = AbortSignal.timeout(config.requestTimeoutMs);
  let response;
  if (asset.reference) {
    // Reference-image generation uses the edits endpoint with the supplied image(s).
    const form = new FormData();
    form.append('model', model);
    form.append('prompt', asset.prompt);
    form.append('size', size);
    form.append('quality', quality);
    for (const file of [asset.reference].flat())
      form.append('image[]', new Blob([await readFile(file)]), file);
    response = await fetch(`${config.endpoint}/edits`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
      signal,
    });
  } else {
    response = await fetch(`${config.endpoint}/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: asset.prompt,
        size,
        quality,
        n: 1,
        output_format: config.outputFormat,
      }),
      signal,
    });
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      `OpenAI ${response.status}: ${body?.error?.message ?? 'request failed'}`,
    );
  const b64 = body?.data?.[0]?.b64_json;
  if (!b64) throw new Error('OpenAI response contained no image data.');
  return Buffer.from(b64, 'base64');
}

async function optimise(asset, png) {
  const widths = config.output.widths[asset.orientation];
  const files = [];
  for (const width of widths) {
    const file = `${config.output.dir}/${asset.id}-${width}.webp`;
    const info = await sharp(png)
      .resize(width)
      .webp({ quality: config.output.webpQuality })
      .toFile(file);
    files.push({
      src: file.replace(/^public/, ''),
      width,
      height: info.height,
    });
  }
  return files;
}

async function loadManifest() {
  try {
    return JSON.parse(await readFile(config.output.manifest, 'utf8'));
  } catch {
    return {};
  }
}

const selected = assets.filter((a) => !only || a.id === only);
if (!selected.length) {
  console.error(`No asset matches --only=${only}`);
  process.exit(1);
}

const manifest = await loadManifest();
console.log(`Image plan (${selected.length} assets):`);
for (const asset of selected) {
  const route = routeModel(asset, { escalated: escalate });
  const quality = routeQuality(asset, route.tier);
  console.log(
    `  ${asset.id.padEnd(28)} ${route.model.padEnd(24)} ${quality.padEnd(7)} ${config.sizes[asset.orientation].padEnd(10)} ${route.reason}`,
  );
}
if (dryRun) process.exit(0);
if (!process.env.OPENAI_API_KEY) {
  console.error(
    '\nOPENAI_API_KEY is not set. Add it to your environment or a local .env file (never commit it).',
  );
  process.exit(1);
}

await mkdir(config.output.dir, { recursive: true });
let failures = 0;
for (const asset of selected) {
  if (manifest[asset.id] && !force) {
    console.log(`- ${asset.id}: exists, skipped (use --force to regenerate)`);
    continue;
  }
  const route = routeModel(asset, { escalated: escalate });
  const quality = routeQuality(asset, route.tier);
  try {
    console.log(`- ${asset.id}: generating with ${route.model} (${quality})…`);
    const png = await requestImage(asset, route.model, quality);
    const files = await optimise(asset, png);
    manifest[asset.id] = {
      alt: asset.alt,
      orientation: asset.orientation,
      model: route.model,
      quality,
      files,
    };
    await writeFile(config.output.manifest, JSON.stringify(manifest, null, 2));
    console.log(`  saved ${files.map((f) => f.src).join(', ')}`);
  } catch (error) {
    failures++;
    console.error(`  failed: ${error.message}`);
  }
}
process.exit(failures ? 1 : 0);
