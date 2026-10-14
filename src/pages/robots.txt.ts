import type { APIRoute } from 'astro';
// Allow everything (including noindex utility pages, CSS and JS) so crawlers can read the
// noindex meta and render pages; point them at the sitemap index.
export const GET: APIRoute = ({ site }) =>
  new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', site).href}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
