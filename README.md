# DP Life Remedies

Static, multi-page business website for DP Life Remedies, a pharmaceutical products wholesaler in Ramgarh, Panchkula, Haryana. Built with Astro + TypeScript, no client framework, no backend.

## Run locally

```powershell
npm install
npm run dev            # http://127.0.0.1:4321
npm run check          # type check
npm run build          # static output in dist/
npm run preview -- --port 4321
```

## Site map

| Route | Purpose |
| --- | --- |
| `/` | Hero, division bento, product rail, about, why-us, process, enquiry |
| `/product-divisions/` | Product explorer — all products with filters |
| `/product-divisions/{division}/` | Same explorer, pre-scoped to one division (static, indexable) |
| `/products/{slug}/` | Product detail: specs, tabs, enquiry, related products |
| `/about/`, `/why-us/`, `/contact/` | Company pages |
| `/privacy-policy/`, `/terms/`, `/disclaimer/` | Website information |
| `/products/` | Redirects to `/product-divisions/` |

### Product explorer

Division rail (real links, one static page per division) plus client-side filters: ingredient/name search, therapeutic-segment chips, dosage form, sort and grid/list layout. Filter state is kept in the URL (`?q=&segment=&form=&sort=&view=`). "Enquire" on a card pre-fills the sidebar quick-enquiry form. Without JavaScript every product is still listed.

## Content maintenance

- Business details and audiences: `src/data/business.ts`
- Products, divisions and helpers: `src/data/products.ts`
- Shared copy (principles, steps, values): `src/data/content.ts`
- Policy text: `src/data/legal.ts`
- Design tokens: `src/styles/tokens.css`; styles are split into `base`, `chrome` (header/footer), `sections`, `catalogue` and `pages`.
- Client behaviour: `src/scripts/modules/` (`nav`, `ui`, `explorer`, `forms`)

Adding a product to `products.ts` creates its detail page and adds it to the explorer, menus and related products. Add its clean packshot to `source-assets/` and an entry in `scripts/prepare-assets.mjs`.

## Images

Original client files live in `source-assets/` and are never published directly. `npm run assets` produces trimmed, optimised WebP packshots (320/640/1080 px, 4:3), brand photo crops, logo, favicon and social image in `public/media/`. Packshots sit on product-tinted stages with `mix-blend-mode: multiply`, so their white backgrounds disappear.

### Optional AI imagery (OpenAI Image API)

`npm run images` generates a small, fixed set of supporting images server-side (Node only — the key never reaches the browser):

- Plan and placements: `scripts/images/manifest.mjs` (8 assets, each with a defined slot)
- Central config (models, quality, sizes, routing, output): `image-generation.config.mjs`
- Model routing: `gpt-image-2.5-flare` by default; `gpt-image-2.5-sunburst` for people, interiors, reference images, critical or detail-sensitive assets, or when an asset is retried with `--escalate`
- Quality: `medium` routine, `high` for high-priority / premium assets
- Output: WebP at two widths in `public/media/generated/`, recorded in `src/data/generated-media.json`

```powershell
npm run images:plan                          # dry run — shows model/quality/size per asset
$env:OPENAI_API_KEY = "…"; npm run images    # or put OPENAI_API_KEY in a local .env (gitignored)
npm run images -- --only=cta-texture --force --escalate
```

All 8 assets are currently generated and published. Every slot still has an authentic fallback (client photography, packshots or a designed CSS treatment): delete an entry from `src/data/generated-media.json` to revert that slot. Rebuild after generating.

## Enquiries

Forms validate locally (name, mobile 10–15 digits, business, message, consent) and prepare an editable email or WhatsApp draft. Nothing is sent automatically; there is no form backend. To add one, replace the draft step in `src/scripts/modules/forms.ts` and update the privacy policy.

## Verification

With the preview running on port 4321:

```powershell
npm run verify       # routes × 8 widths, axe WCAG A/AA, links, explorer/nav/rail/tabs/lightbox/forms
npm run verify:seo   # isolated build with a test domain; checks canonical, robots, sitemap
```

Results are written to `output/playwright/`. See `QA.md`.

## Publishing

Set `PUBLIC_SITE_URL` to the approved HTTPS origin before the final build. Without it the build is `noindex` with `Disallow: /` and an empty sitemap.

Confirm DPrun XT strengths against approved packaging before adding them (the supplied artwork is inconsistent). Have the business review policy text and product details before launch.
