import type { APIRoute } from 'astro';
import { products, divisions } from '../data/products';
export const GET: APIRoute = () => {
  const base = import.meta.env.PUBLIC_SITE_URL;
  const routes = [
    '/',
    '/about/',
    '/product-divisions/',
    '/why-us/',
    '/contact/',
    '/privacy-policy/',
    '/terms/',
    '/disclaimer/',
    ...products.map((p) => `/products/${p.slug}/`),
    ...divisions.map((d) => `/product-divisions/${d.slug}/`),
  ];
  const escape = (v: string) =>
    v
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('"', '&quot;');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${base ? routes.map((path) => `<url><loc>${escape(new URL(path, base).href)}</loc></url>`).join('') : ''}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
