// End-to-end audit of the built site. Run `npm run build && npm run preview` first.
// Uses synthetic enquiry data and never opens a sending action.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const origin = process.env.QA_URL || 'http://127.0.0.1:4321';
const OUT = 'output/playwright';
const WIDTHS = [320, 375, 430, 768, 1024, 1280, 1440, 1920];
await mkdir(OUT, { recursive: true });

async function routesIn(dir = 'dist', prefix = '') {
  const routes = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (item.isDirectory() && !['_astro', 'media'].includes(item.name))
      routes.push(
        ...(await routesIn(join(dir, item.name), `${prefix}/${item.name}`)),
      );
    if (item.isFile() && item.name === 'index.html') {
      const html = await readFile(join(dir, item.name), 'utf8');
      if (!html.includes('http-equiv="refresh"')) routes.push(`${prefix}/`);
    }
  }
  return routes;
}

const routes = (await routesIn()).sort();
const browser = await chromium.launch();
const results = {
  routes: routes.length,
  viewportChecks: 0,
  axeChecks: 0,
  interactions: [],
  links: 0,
};
const errors = [];
const internalLinks = new Set();
const pass = (name) => results.interactions.push(name);

async function newPage(width = 1440, opts = {}) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    ...opts,
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`${page.url()}: ${e.message}`));
  page.on(
    'console',
    (m) => m.type() === 'error' && errors.push(`${page.url()}: ${m.text()}`),
  );
  return page;
}

async function loadAllImages(page) {
  await page.evaluate(async () => {
    document
      .querySelectorAll('img[loading="lazy"]')
      .forEach((img) => (img.loading = 'eager'));
    await Promise.all(
      [...document.images].map((img) =>
        img.complete
          ? null
          : new Promise(
              (r) =>
                img.addEventListener('load', r, { once: true }) ||
                setTimeout(r, 3000),
            ),
      ),
    );
  });
}

try {
  // 1. Every route at every width: status, structure, overflow, images.
  const page = await newPage(1440, { reducedMotion: 'reduce' });
  for (const route of routes) {
    const res = await page.goto(origin + route, { waitUntil: 'networkidle' });
    assert.equal(res.status(), 200, `${route} status`);
    assert.ok(
      (await page.title()).endsWith('| DP Life Remedies'),
      `${route} title`,
    );
    assert.equal(await page.locator('h1').count(), 1, `${route} single h1`);
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute('content');
    assert.ok(description && description.length > 50, `${route} description`);
    for (const json of await page
      .locator('script[type="application/ld+json"]')
      .allTextContents())
      JSON.parse(json);
    (
      await page
        .locator('a[href^="/"]')
        .evaluateAll((els) => els.map((e) => e.getAttribute('href')))
    ).forEach((h) => internalLinks.add(h.split('#')[0].split('?')[0] || '/'));
    const anchors = await page
      .locator('a[href^="#"]')
      .evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    for (const a of anchors.filter((x) => x.length > 1))
      assert.ok(
        await page.locator(a).count(),
        `${route} anchor ${a} target exists`,
      );
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      // Let media queries and layout settle after the emulated resize.
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      await page.waitForTimeout(120);
      await loadAllImages(page);
      const state = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        culprits: [...document.querySelectorAll('body *')]
          .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
          .slice(0, 5)
          .map((e) => `${e.tagName}.${e.className}`),
        broken: [...document.images]
          .filter((i) => i.complete && i.naturalWidth === 0)
          .map((i) => i.src),
      }));
      assert.ok(
        state.overflow <= 0,
        `${route} @${width} horizontal overflow ${state.overflow}px ${state.culprits.join(', ')}`,
      );
      assert.deepEqual(state.broken, [], `${route} @${width} broken images`);
      results.viewportChecks++;
    }
    await page.setViewportSize({ width: 1440, height: 900 });
  }

  // 2. Internal links resolve.
  for (const href of internalLinks) {
    const res = await page.request.get(origin + href);
    assert.ok(res.status() < 400, `link ${href} → ${res.status()}`);
  }
  results.links = internalLinks.size;
  pass('all internal links resolve');

  // 3. Accessibility (WCAG A/AA) on desktop and mobile.
  for (const width of [1440, 375]) {
    const p = await newPage(width, { reducedMotion: 'reduce' });
    for (const route of routes) {
      await p.goto(origin + route, { waitUntil: 'networkidle' });
      const axe = await new AxeBuilder({ page: p })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      assert.deepEqual(
        axe.violations.map(
          (v) =>
            `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
        ),
        [],
        `${route} @${width} axe`,
      );
      results.axeChecks++;
    }
    await p.context().close();
  }

  // 4. Product explorer filters.
  const ex = await newPage(1440);
  await ex.goto(`${origin}/product-divisions/`, { waitUntil: 'networkidle' });
  const visible = () => ex.locator('[data-product]:not([hidden])').count();
  assert.equal(await visible(), 8);
  await ex.fill('[data-filter-q]', 'zinc');
  await ex.waitForTimeout(300);
  assert.equal(await visible(), 3, 'search "zinc"');
  assert.ok(ex.url().includes('q=zinc'), 'search state in URL');
  await ex.click('[data-reset]:visible');
  assert.equal(await visible(), 8, 'reset');
  await ex.click('[data-segment-filter="Bone & Joint Care"]');
  assert.equal(await visible(), 2, 'segment chip');
  await ex.click('[data-segment-filter=""]');
  await ex.selectOption('[data-filter-form]', 'Syrup');
  assert.equal(await visible(), 2, 'dosage form');
  await ex.selectOption('[data-filter-form]', '');
  await ex.selectOption('[data-filter-sort]', 'za');
  const names = await ex
    .locator('[data-product]')
    .evaluateAll((els) => els.map((e) => e.dataset.name));
  assert.deepEqual(
    names,
    [...names].sort((a, b) => b.localeCompare(a)),
    'sort Z–A',
  );
  await ex.click('[data-view="list"]');
  assert.equal(
    await ex.getAttribute('[data-grid]', 'data-layout'),
    'list',
    'list view',
  );
  await ex.fill('[data-filter-q]', 'no-such-product');
  await ex.waitForTimeout(300);
  assert.ok(await ex.locator('[data-empty]').isVisible(), 'empty state');
  await ex.goto(`${origin}/product-divisions/?q=dha&view=list`, {
    waitUntil: 'networkidle',
  });
  assert.equal(await visible(), 1, 'URL state restored');
  await ex.goto(`${origin}/product-divisions/syrups/`, {
    waitUntil: 'networkidle',
  });
  assert.equal(await visible(), 2, 'division page items');
  assert.equal(
    await ex
      .locator('.division-pill[aria-current="page"] strong')
      .textContent(),
    'Syrups',
  );
  await ex.locator('[data-enquire]').first().click();
  assert.equal(
    await ex.inputValue('#quick-enquiry [data-product-select]'),
    'DPATE LIV',
    'enquire preselects product',
  );
  pass(
    'explorer: search, chips, form, sort, list view, empty state, URL state, division pages, enquire',
  );

  // 5. Navigation: mega menu, mobile drawer.
  await ex.goto(`${origin}/`, { waitUntil: 'networkidle' });
  await ex.hover('[data-mega] summary');
  assert.ok(await ex.locator('.mega').isVisible(), 'mega menu opens on hover');
  await ex.keyboard.press('Escape');
  assert.ok(
    !(await ex.locator('.mega').isVisible()),
    'mega menu closes on Escape',
  );
  const mobile = await newPage(375);
  await mobile.goto(`${origin}/`, { waitUntil: 'networkidle' });
  await mobile.click('[data-drawer-open]');
  assert.ok(await mobile.locator('[data-drawer]').isVisible(), 'drawer opens');
  assert.equal(
    await mobile.getAttribute('[data-drawer-open]', 'aria-expanded'),
    'true',
  );
  await mobile.keyboard.press('Escape');
  await mobile.waitForTimeout(400);
  assert.ok(
    !(await mobile.locator('[data-drawer]').isVisible()),
    'drawer closes on Escape',
  );
  await mobile.click('[data-drawer-open]');
  await mobile.click('.drawer-nav a[href="/about/"]');
  await mobile.waitForURL('**/about/');
  pass('navigation: mega menu hover/Escape, mobile drawer open/close/navigate');

  // 6. Product rail.
  await ex.goto(`${origin}/`, { waitUntil: 'networkidle' });
  const before = await ex
    .locator('[data-rail-track]')
    .evaluate((t) => t.scrollLeft);
  assert.ok(
    await ex.locator('[data-rail-prev]').isDisabled(),
    'rail prev disabled at start',
  );
  await ex.click('[data-rail-next]');
  await ex.waitForTimeout(800);
  assert.ok(
    (await ex.locator('[data-rail-track]').evaluate((t) => t.scrollLeft)) >
      before,
    'rail scrolls',
  );
  pass('product rail controls');

  // 7. Product page: tabs, lightbox, form.
  await ex.goto(`${origin}/products/daybone/`, { waitUntil: 'networkidle' });
  assert.ok(await ex.locator('#panel-composition').isHidden());
  await ex.focus('#tab-overview');
  await ex.keyboard.press('ArrowRight');
  assert.ok(
    await ex.locator('#panel-composition').isVisible(),
    'tab keyboard navigation',
  );
  assert.equal(await ex.locator('.comp-table tbody tr').count(), 5);
  await ex.click('[data-lightbox-open]');
  assert.ok(await ex.locator('[data-lightbox]').isVisible(), 'lightbox opens');
  await ex.keyboard.press('Escape');
  assert.ok(await ex.locator('[data-lightbox]').isHidden(), 'lightbox closes');
  const form = ex.locator('#enquiry [data-enquiry]');
  assert.equal(
    await form.locator('[data-product-select]').inputValue(),
    'DAYBONE',
  );
  await form.locator('button[value="email"]').click();
  assert.ok(
    await form.locator('[data-draft-panel]').isHidden(),
    'invalid form blocked',
  );
  await form.locator('[name="name"]').fill('QA Tester');
  await form.locator('[name="phone"]').fill('12');
  await form.locator('[name="business"]').fill('QA Pharmacy');
  await form
    .locator('[name="message"]')
    .fill('Synthetic verification enquiry.');
  await form.locator('[name="consent"]').check();
  await form.locator('button[value="email"]').click();
  assert.ok(
    await form.locator('[data-draft-panel]').isHidden(),
    'short phone rejected',
  );
  await form.locator('[name="phone"]').fill('+91 98765 43210');
  await form.locator('button[value="email"]').click();
  assert.ok(
    (await form.locator('[data-draft-link]').getAttribute('href')).startsWith(
      'mailto:dpliferemedies@gmail.com',
    ),
  );
  await form.locator('button[value="whatsapp"]').click();
  assert.ok(
    (await form.locator('[data-draft-link]').getAttribute('href')).startsWith(
      'https://wa.me/917900001029',
    ),
  );
  assert.ok(
    (await form.locator('[data-draft-text]').textContent()).includes(
      'Product: DAYBONE',
    ),
  );
  pass('product page: tabs, lightbox, enquiry validation and drafts');

  // 8. Contact form preselects product from query.
  await ex.goto(`${origin}/contact/?product=dp-q10#enquiry`, {
    waitUntil: 'networkidle',
  });
  assert.equal(await ex.inputValue('#enquiry [data-product-select]'), 'DP-Q10');
  pass('contact: product preselected from query');

  // 9. Redirect.
  const redirect = await ex.request.get(`${origin}/products/`);
  assert.ok(
    (await redirect.text()).includes('/product-divisions/'),
    '/products/ redirects',
  );
  pass('/products/ redirect');

  assert.deepEqual(errors, [], 'console/page errors');
} finally {
  await writeFile(
    `${OUT}/report.json`,
    JSON.stringify({ ...results, errors }, null, 2),
  );
  await browser.close();
}
console.log(
  `Verified ${results.routes} routes × ${WIDTHS.length} widths (${results.viewportChecks} checks), ${results.axeChecks} axe checks, ${results.links} internal links, ${results.interactions.length} interaction suites.`,
);
