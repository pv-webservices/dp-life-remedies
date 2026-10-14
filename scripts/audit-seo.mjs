// Technical SEO audit of the built site (dist/). Run `npm run build` first; `npm run audit` does both.
// Exits non-zero when any issue is found.
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'node-html-parser';
import { SITE_URL, NOINDEX_PATHS } from '../src/data/site.mjs';

const DIST = process.env.AUDIT_DIST || 'dist';
const TITLE_MAX = 65;
const DESC_MIN = 70;
const DESC_MAX = 170;
const INDEX_ROBOTS = 'index, follow, max-image-preview:large';
const NOINDEX_ROBOTS = 'noindex, follow';
const REQUIRED_ICONS = [
  '/favicon.ico',
  '/favicon.svg',
  '/favicon-96x96.png',
  '/favicon-48x48.png',
  '/apple-touch-icon.png',
  '/site.webmanifest',
];
const site = process.env.PUBLIC_SITE_URL || SITE_URL;

const issues = [];
const issue = (page, message) => issues.push(`${page}: ${message}`);

async function htmlFiles(dir) {
  const out = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory() && !['_astro', 'media'].includes(item.name))
      out.push(...(await htmlFiles(path)));
    else if (item.name.endsWith('.html')) out.push(path);
  }
  return out;
}

const routeOf = (file) => {
  const rel = file.slice(DIST.length).replaceAll('\\', '/');
  if (rel === '/404.html') return '/404/';
  return rel.replace(/index\.html$/, '');
};

const exists = async (path) => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};

/** Resolve an internal URL to a dist file; returns the file path or null. */
async function resolveInternal(url) {
  const clean = decodeURI(url.split('#')[0].split('?')[0]);
  if (!clean) return 'self';
  if (clean.endsWith('/')) {
    const file = join(DIST, clean, 'index.html');
    return (await exists(file)) ? file : null;
  }
  const file = join(DIST, clean);
  return (await exists(file)) ? file : null;
}

const files = await htmlFiles(DIST);
const pages = [];
for (const file of files) {
  const html = await readFile(file, 'utf8');
  pages.push({ route: routeOf(file), doc: parse(html) });
}

const titles = new Map();
const descriptions = new Map();
const indexable = [];
const linkChecks = new Map();

for (const { route, doc } of pages) {
  const head = doc.querySelector('head');
  const meta = (sel) => head?.querySelector(sel)?.getAttribute('content') ?? '';
  const isUtility = NOINDEX_PATHS.includes(route);

  // URL format
  if (route !== route.toLowerCase() || /[^a-z0-9/-]/.test(route))
    issue(route, 'URL is not lowercase-hyphenated');
  if (!route.endsWith('/')) issue(route, 'URL has no trailing slash');

  // Title
  const title = doc.querySelector('title')?.textContent.trim() ?? '';
  if (!title) issue(route, 'missing <title>');
  if (title.length > TITLE_MAX)
    issue(
      route,
      `title is ${title.length} chars (max ${TITLE_MAX}): "${title}"`,
    );
  titles.set(title, [...(titles.get(title) ?? []), route]);

  // Description
  const description = meta('meta[name="description"]');
  if (description.length < DESC_MIN || description.length > DESC_MAX)
    issue(
      route,
      `description is ${description.length} chars (want ${DESC_MIN}–${DESC_MAX})`,
    );
  descriptions.set(description, [
    ...(descriptions.get(description) ?? []),
    route,
  ]);

  // Robots + canonical
  const robots = meta('meta[name="robots"]');
  const canonicals = head?.querySelectorAll('link[rel="canonical"]') ?? [];
  if (isUtility) {
    if (robots !== NOINDEX_ROBOTS)
      issue(route, `robots should be "${NOINDEX_ROBOTS}", got "${robots}"`);
    if (canonicals.length)
      issue(route, 'noindex page must not have a canonical');
  } else {
    indexable.push(route);
    if (robots !== INDEX_ROBOTS)
      issue(route, `robots should be "${INDEX_ROBOTS}", got "${robots}"`);
    const expected = new URL(route, site).href;
    if (canonicals.length !== 1)
      issue(route, `expected 1 canonical, found ${canonicals.length}`);
    else if (canonicals[0].getAttribute('href') !== expected)
      issue(
        route,
        `canonical ${canonicals[0].getAttribute('href')} ≠ ${expected}`,
      );
  }

  // Headings: exactly one H1, no skipped levels
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const h1s = headings.filter((h) => h.tagName === 'H1').length;
  if (h1s !== 1) issue(route, `${h1s} <h1> elements (want exactly 1)`);
  let previous = 0;
  for (const h of headings) {
    const level = Number(h.tagName[1]);
    if (previous && level > previous + 1)
      issue(
        route,
        `heading skips from h${previous} to h${level}: "${h.textContent.trim().slice(0, 50)}"`,
      );
    previous = level;
  }

  // Images: alt present; explicit size
  for (const img of doc.querySelectorAll('img')) {
    const src = img.getAttribute('src') ?? '';
    if (!img.hasAttribute('alt')) issue(route, `img without alt: ${src}`);
    if (!img.getAttribute('width') || !img.getAttribute('height'))
      issue(route, `img without width/height: ${src}`);
  }

  // Open Graph / Twitter
  for (const prop of [
    'og:title',
    'og:description',
    'og:url',
    'og:type',
    'og:image',
    'og:image:alt',
  ])
    if (!meta(`meta[property="${prop}"]`)) issue(route, `missing ${prop}`);
  if (
    meta('meta[property="og:image:width"]') !== '1200' ||
    meta('meta[property="og:image:height"]') !== '630'
  )
    issue(route, 'og:image must declare 1200×630');
  const ogImage = meta('meta[property="og:image"]');
  if (ogImage && !(await resolveInternal(new URL(ogImage).pathname)))
    issue(route, `og:image file missing: ${ogImage}`);
  for (const name of [
    'twitter:card',
    'twitter:title',
    'twitter:description',
    'twitter:image',
  ])
    if (!meta(`meta[name="${name}"]`)) issue(route, `missing ${name}`);

  // Favicons
  for (const href of REQUIRED_ICONS) {
    if (!head?.querySelector(`link[href="${href}"]`))
      issue(route, `head does not link ${href}`);
    if (!(await resolveInternal(href)))
      issue(route, `${href} missing from build`);
  }

  // JSON-LD
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  const types = [];
  for (const s of scripts) {
    const raw = s.rawText;
    if (raw.includes('<')) issue(route, 'JSON-LD contains an unescaped "<"');
    try {
      const data = JSON.parse(raw);
      for (const node of data['@graph'] ?? [data]) types.push(node['@type']);
    } catch {
      issue(route, 'JSON-LD does not parse');
    }
  }
  const flat = types.flat();
  for (const t of ['WholesaleStore', 'WebSite'])
    if (!flat.includes(t)) issue(route, `JSON-LD missing ${t}`);
  if (route !== '/' && !isUtility && !flat.includes('BreadcrumbList'))
    issue(route, 'inner page missing BreadcrumbList JSON-LD');

  // Collect internal links and assets
  const refs = [
    ...doc.querySelectorAll('a[href]').map((a) => a.getAttribute('href')),
    ...doc
      .querySelectorAll('img[src], source[srcset], img[srcset], link[href]')
      .flatMap((el) => [
        el.getAttribute('src'),
        ...(el.getAttribute('srcset') ?? '')
          .split(',')
          .map((p) => p.trim().split(/\s+/)[0]),
        el.getAttribute('href'),
      ]),
  ];
  for (const ref of refs) {
    if (!ref || /^(https?:|mailto:|tel:|data:|javascript:)/.test(ref)) {
      if (ref?.startsWith(site)) linkChecks.set(new URL(ref).pathname, route);
      continue;
    }
    if (ref.startsWith('#')) {
      const id = ref.slice(1);
      if (id && !doc.querySelector(`[id="${id}"]`))
        issue(route, `in-page anchor not found: ${ref}`);
      continue;
    }
    linkChecks.set(new URL(ref, new URL(route, site)).pathname, route);
  }
}

// Broken internal links / missing assets
let brokenLinks = 0;
for (const [path, from] of linkChecks) {
  if (!(await resolveInternal(path))) {
    brokenLinks++;
    issue(from, `broken internal link or missing asset: ${path}`);
  }
}

// Duplicates
for (const [title, routes] of titles)
  if (routes.length > 1) issue(routes.join(', '), `duplicate title "${title}"`);
for (const [desc, routes] of descriptions)
  if (routes.length > 1)
    issue(routes.join(', '), `duplicate description "${desc.slice(0, 60)}…"`);

// robots.txt
const robotsTxt = await readFile(join(DIST, 'robots.txt'), 'utf8').catch(
  () => '',
);
if (!/^User-agent: \*$/m.test(robotsTxt) || !/^Allow: \/$/m.test(robotsTxt))
  issue('/robots.txt', 'must allow everything');
if (/^Disallow:\s*\S/m.test(robotsTxt))
  issue('/robots.txt', 'must not disallow any path');
if (!robotsTxt.includes(`Sitemap: ${new URL('/sitemap-index.xml', site).href}`))
  issue('/robots.txt', 'missing Sitemap line');

// Sitemap = indexable pages
const index = await readFile(join(DIST, 'sitemap-index.xml'), 'utf8').catch(
  () => '',
);
const childMaps = [...index.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
if (!childMaps.length) issue('/sitemap-index.xml', 'missing or empty');
const sitemapUrls = [];
for (const url of childMaps) {
  const xml = await readFile(join(DIST, new URL(url).pathname), 'utf8');
  const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
  for (const entry of entries) {
    const loc = entry.match(/<loc>(.*?)<\/loc>/)?.[1];
    if (!entry.includes('<lastmod>'))
      issue('/sitemap', `no lastmod for ${loc}`);
    sitemapUrls.push(loc);
  }
}
const expectedUrls = indexable.map((r) => new URL(r, site).href).sort();
const missingFromSitemap = expectedUrls.filter((u) => !sitemapUrls.includes(u));
const extraInSitemap = sitemapUrls.filter((u) => !expectedUrls.includes(u));
for (const u of missingFromSitemap)
  issue('/sitemap', `indexable page missing: ${u}`);
for (const u of extraInSitemap)
  issue('/sitemap', `non-indexable or unknown URL listed: ${u}`);

console.log(
  `SEO audit: ${pages.length} pages (${indexable.length} indexable, ${pages.length - indexable.length} noindex), ` +
    `${linkChecks.size} internal URLs checked, ${brokenLinks} broken, ${sitemapUrls.length} sitemap URLs.`,
);
if (issues.length) {
  console.error(`\n${issues.length} issue(s):\n- ${issues.join('\n- ')}`);
  process.exit(1);
}
console.log('No issues found.');
