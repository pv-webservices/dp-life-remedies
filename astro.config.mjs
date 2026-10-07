import { defineConfig } from 'astro/config';
export default defineConfig({
  output: 'static',
  site: process.env.PUBLIC_SITE_URL || undefined,
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  // The full catalogue now lives in the Product Divisions explorer.
  redirects: { '/products': '/product-divisions/' },
});
