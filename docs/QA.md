# QA record

## 14 October 2026 — pre-deployment audit (forms, SEO, performance, accessibility)

Local production build, served by `npm run preview` (http://127.0.0.1:4321). Not yet deployed.

| Check | Command | Result |
| --- | --- | --- |
| Type check | `npm run check` | 0 errors, 0 warnings, 0 hints |
| Unit tests (form rules) | `npm run test:unit` | 13/13 pass |
| Technical SEO audit | `npm run audit` | 23 pages (21 indexable, 2 noindex), 94 internal URLs, 0 broken, 21 sitemap URLs = 21 indexable pages, 0 issues |
| Form browser tests (FormSubmit mocked) | `npm run test:forms` | 16/16 pass, 0 real submissions |
| Site browser audit | `npm run verify` | 22 routes × 8 widths (320–1920) = 176 layout checks: no horizontal scroll, no broken images, no tap target under 24 px at ≤430 px; 45 axe WCAG 2.1 A/AA runs (every route at 1440 + 375, plus 404): 0 violations; skip link, focus visible on 25 tab stops, reduced motion, 404 status, no console errors |

Form scenarios covered: empty submit (5 linked errors + summary + focus), email/phone/min/max length (incl. script-filled values), consent, success (payload, subject, Reply-To field, busy state, `/thank-you/`), honeypot, 3-second bot timer, delivery failure (incl. "not activated"), network failure, offline, 20 s timeout, Back-button `pageshow`, draft restore after reload, WhatsApp pre-fill (no bot timer), compact quick-enquiry form, mobile layout-shift regression, JavaScript-disabled POST with `_next`.

Lighthouse mobile (Lighthouse 12.8, this machine; live = old build, local = new build):

| Page | Throttling | Before (live) | After (local) |
| --- | --- | --- | --- |
| Home | simulated | Perf 80–94 · SEO 58 · LCP 2.2–2.5 s · CLS ≤0.013 · TBT 150–550 ms | Perf 81–96 · SEO 100 · LCP 2.0–2.6 s · CLS 0–0.014 · TBT 150–530 ms |
| Home | applied (DevTools) | Perf 53–54 · LCP 4.8–6.2 s · TBT 400–940 ms | Perf 56–70 · LCP 4.1–4.5 s · TBT 170–950 ms |
| Product (DAYBONE) | simulated | Perf 90–96 · SEO 58 · LCP 2.1–2.3 s · CLS ≤0.001 · TBT 130–320 ms | Perf 87–98 · SEO 100 · LCP 2.2–2.4 s · CLS 0 · TBT 0–320 ms |
| Product (DAYBONE) | applied (DevTools) | Perf 55–58 · LCP 4.8–4.9 s · TBT 470–610 ms | Perf 82–87 · LCP 3.0–3.3 s · TBT 190–230 ms |

Accessibility and Best Practices: 100 before and after. Ranges are across 2–3 runs; this machine's CPU timings are noisy, so re-measure on https://pagespeed.web.dev/ after deployment.

Not verified locally: Netlify redirects/headers (only exist on Netlify), live FormSubmit delivery (needs activation and an approved live test), Gmail inbox placement.

## 7 October 2026 — redesign

Earlier verification of the redesign (168 responsive checks, 42 axe checks, explorer/nav/product interactions) — superseded by the record above. The enquiry form at that time only prepared email/WhatsApp drafts; it now sends through FormSubmit.
