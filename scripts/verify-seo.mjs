import { execFileSync } from 'node:child_process';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { join } from 'node:path';
const domain = 'https://qa.example';
const output = 'output/domain-build';
execFileSync(
  process.execPath,
  ['node_modules/astro/bin/astro.mjs', 'build', '--outDir', output],
  { env: { ...process.env, PUBLIC_SITE_URL: domain }, stdio: 'inherit' },
);
async function files(dir) {
  let result = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (item.isDirectory() && item.name !== '_astro' && item.name !== 'media')
      result.push(...(await files(join(dir, item.name))));
    else if (item.name === 'index.html') result.push(join(dir, item.name));
  }
  return result;
}
const ROUTES = 21;
const pages = [];
for (const file of await files(output)) {
  // Skip the static redirect page (/products/ → /product-divisions/).
  if (!(await readFile(file, 'utf8')).includes('http-equiv="refresh"'))
    pages.push(file);
}
const canonicals = [];
for (const file of pages) {
  const html = await readFile(file, 'utf8');
  const canonical = html.match(/rel="canonical" href="([^"]+)"/);
  assert.ok(canonical, file);
  assert.ok(canonical[1].startsWith(domain));
  assert.ok(html.includes('content="index,follow"'));
  assert.ok(html.includes(`content="${domain}/media/`));
  canonicals.push(canonical[1]);
}
assert.equal(new Set(canonicals).size, ROUTES);
const robots = await readFile(`${output}/robots.txt`, 'utf8');
assert.ok(robots.includes(`Sitemap: ${domain}/sitemap.xml`));
assert.ok(robots.includes('Allow: /'));
const sitemap = await readFile(`${output}/sitemap.xml`, 'utf8');
assert.equal((sitemap.match(/<loc>/g) || []).length, ROUTES);
await mkdir('output/playwright', { recursive: true });
await writeFile(
  'output/playwright/seo-report.json',
  JSON.stringify(
    {
      testDomain: domain,
      pages: ROUTES,
      uniqueCanonicals: ROUTES,
      sitemapUrls: ROUTES,
      robots: true,
      publicDomainConfigured: false,
    },
    null,
    2,
  ),
);
console.log(
  `Configured-domain metadata verified for all ${ROUTES} content routes. The test build is isolated in output/domain-build.`,
);
