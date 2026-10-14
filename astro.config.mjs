import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL, NOINDEX_PATHS } from './src/data/site.mjs';

// Canonical origin. PUBLIC_SITE_URL only overrides it for isolated QA builds.
const site = process.env.PUBLIC_SITE_URL || SITE_URL;
const lastmod = new Date();

export default defineConfig({
  output: 'static',
  site,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  devToolbar: { enabled: false },
  integrations: [
    sitemap({
      // Only indexable pages: utility pages (thank-you, 404) are noindex.
      filter: (page) => !NOINDEX_PATHS.includes(new URL(page).pathname),
      serialize: (item) => ({ ...item, lastmod: lastmod.toISOString() }),
    }),
  ],
});
