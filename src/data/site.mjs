// Site-wide constants shared by astro.config.mjs, pages, scripts and the SEO audit.

/** Canonical origin (HTTPS, apex, no trailing slash). */
export const SITE_URL = 'https://dpliferemedies.com';

/** Utility pages: robots "noindex, follow", no canonical, excluded from the sitemap. */
export const NOINDEX_PATHS = ['/404/', '/404.html', '/thank-you/'];

/**
 * FormSubmit delivery for every enquiry form (no SMTP, no server code, no password).
 * After the one-time activation, FormSubmit emails a random alias for this address.
 * Replace FORM_TARGET with that alias to keep the Gmail address out of the page source;
 * enquiries still go only to dpliferemedies@gmail.com.
 */
export const FORM_TARGET = 'dpliferemedies@gmail.com';
export const FORM_ACTION = `https://formsubmit.co/${FORM_TARGET}`;
export const FORM_AJAX = `https://formsubmit.co/ajax/${FORM_TARGET}`;
export const THANK_YOU_PATH = '/thank-you/';
