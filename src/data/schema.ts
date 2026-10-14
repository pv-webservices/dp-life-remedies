// JSON-LD (schema.org) graph shared by every page. Only facts supplied by the client are used:
// no opening hours, founder, ratings or service areas are asserted.
import { business } from './business';

type Node = Record<string, unknown>;

/** Serialise JSON-LD safely for an inline <script>: "<" is escaped so "</script>" can't break out. */
export const jsonLd = (graph: Node[]): string =>
  JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
  }).replaceAll('<', '\\u003c');

export const orgId = (site: URL): string =>
  new URL('/#organization', site).href;

export const siteGraph = (site: URL): Node[] => {
  const url = new URL('/', site).href;
  return [
    {
      '@type': 'WholesaleStore',
      '@id': orgId(site),
      name: business.name,
      slogan: business.tagline,
      url,
      logo: {
        '@type': 'ImageObject',
        url: new URL('/media/brand/logo-512.png', site).href,
        width: 512,
        height: 512,
      },
      image: new URL('/media/og/default.jpg', site).href,
      telephone: business.tel,
      email: business.email,
      taxID: business.gstin,
      hasMap: business.maps,
      address: {
        '@type': 'PostalAddress',
        streetAddress:
          'Shop No. 2, Ground Floor, Near Dharamshala, Village Ramgarh',
        addressLocality: 'Panchkula',
        addressRegion: 'Haryana',
        postalCode: '134118',
        addressCountry: 'IN',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'sales',
        telephone: business.tel,
        email: business.email,
      },
    },
    {
      '@type': 'WebSite',
      '@id': new URL('/#website', site).href,
      url,
      name: business.name,
      inLanguage: 'en-IN',
      publisher: { '@id': orgId(site) },
    },
  ];
};

export const breadcrumbGraph = (
  site: URL,
  crumbs: { name: string; path: string }[],
): Node => ({
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    item: new URL(c.path, site).href,
  })),
});
