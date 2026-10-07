import type { APIRoute } from 'astro';
export const GET: APIRoute = () => {
  const base = import.meta.env.PUBLIC_SITE_URL;
  return new Response(
    base
      ? `User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap.xml', base).href}\n`
      : 'User-agent: *\nDisallow: /\n',
    { headers: { 'Content-Type': 'text/plain' } },
  );
};
