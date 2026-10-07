# Local verification — 7 October 2026 (redesign)

The production build was served at `http://127.0.0.1:4321/`.

| Check | Result |
| --- | --- |
| `npm run check` | 0 errors, warnings or hints |
| `npm run build` | 21 content pages, custom 404 and the `/products/` redirect |
| Responsive audit | 168 checks: every content route at 320, 375, 430, 768, 1024, 1280, 1440 and 1920 px — no horizontal overflow, no broken images |
| Axe (WCAG 2.1 A/AA) | 42 checks: every route at 1440 and 375 px, plus the 404 page — no violations |
| Internal links | Every internal link and in-page anchor resolves |
| Explorer | Search by ingredient, segment chips, dosage form, sort Z–A, list view, empty state, URL state restore, division pages, Enquire pre-fills the quick enquiry |
| Navigation | Mega menu opens on hover and closes on Escape; mobile drawer opens, closes on Escape and navigates |
| Product page | Tabs (incl. arrow keys), lightbox open/close, form blocks invalid input and short numbers, email and WhatsApp drafts include the product |
| Contact | `?product=` pre-selects the product |
| Console | No page or console errors |
| SEO fixture (`npm run verify:seo`) | 21 unique canonicals, 21 sitemap URLs, robots allowance, social image URLs on an isolated `https://qa.example` build |

Issues found and fixed during the audit: the segment-chip selector also matched product cards (setting `aria-pressed` on articles), a definition list with disallowed children on product pages, and low contrast on decorative numbers. An intermittent 320 px overflow traced to the audit measuring immediately after an emulated resize (before media queries re-applied); the audit now waits for layout, and the header was also made shrink-safe below 400 px. Cross-document view transitions were removed after Chromium occasionally logged an aborted-transition error when navigating from the closing mobile drawer. Final state: three consecutive clean audit runs.

Visual review covered desktop and mobile screenshots of the home, explorer (all and Tablets), product, about, why-us, contact, legal and 404 pages.

## Boundaries

Results apply to the local static preview, not a live deployment, a formal accessibility certification or a performance benchmark. No message or form submission was sent; synthetic enquiry data was used. `npm run images` generated all 8 planned assets (2 × gpt-image-2.5-sunburst high, 6 × gpt-image-2.5-flare medium, one Flare asset regenerated with a corrected prompt). Each was reviewed in place on desktop and mobile.

DPrun XT strengths remain omitted pending approved packaging. Business review of policy text and product information is still needed before launch.
