# DP Life Remedies

Static, multi-page business website for DP Life Remedies, a pharmaceutical products wholesaler in Ramgarh, Panchkula, Haryana.
Built with Astro + TypeScript (no client framework, no server code). Live at **https://dpliferemedies.com/**.

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at http://127.0.0.1:4321 |
| `npm run build` | Production build into `dist/` (sitemap included) |
| `npm run preview` | Serve `dist/` at http://127.0.0.1:4321 |
| `npm run check` | Type check (Astro + TypeScript) |
| `npm run test:unit` | Unit tests for the enquiry-form rules (`tests/`) |
| `npm run audit` | Build, then the technical SEO audit of every page (`scripts/audit-seo.mjs`) |
| `npm test` | `check` + `test:unit` + `audit` |
| `npm run test:forms` | Browser tests for the forms — FormSubmit is **mocked**, nothing is sent (needs `npm run preview` running) |
| `npm run verify` | Browser audit: every route × 8 widths, axe WCAG 2.1 AA, links, tap targets, keyboard, 404, explorer/nav (needs preview) |
| `npm run test:e2e` | `test:forms` + `verify` |
| `npm run assets` | Regenerate optimised images, OG cards and favicons from `source-files/` |
| `npm run images` / `images:plan` | Optional AI editorial images (server-side, needs `OPENAI_API_KEY`) |

Full check before a deploy:

```powershell
npm test
npm run preview          # in a second terminal
npm run test:e2e
```

## Folder structure

```
├── netlify.toml             Netlify build, redirects (www/http → https apex, /index.html → /), headers, caching
├── astro.config.mjs         Site URL, trailing slashes, sitemap integration
├── src/
│   ├── data/site.mjs        Canonical URL, noindex pages, FormSubmit endpoint  ← change the form alias here
│   ├── data/                business.ts, products.ts, content.ts, legal.ts, schema.ts (JSON-LD), media.ts
│   ├── components/          Header, Footer, EnquiryForm, Photo (AVIF/WebP), Logo, …
│   ├── layouts/Layout.astro <head>: SEO meta, canonical, Open Graph/Twitter, favicons, JSON-LD
│   ├── pages/               Routes (incl. 404.astro, thank-you.astro, robots.txt.ts)
│   ├── scripts/modules/     Client JS: forms.ts, enquiry-validation.ts, nav, ui, explorer
│   └── styles/              tokens, base, chrome, sections, catalogue, pages
├── public/                  Served as-is
│   ├── favicon.ico/.svg, favicon-48x48.png, favicon-96x96.png, apple-touch-icon.png,
│   │   web-app-manifest-192x192.png, web-app-manifest-512x512.png, site.webmanifest
│   └── media/
│       ├── brand/           Logo emblem (64/128/192 px WebP, 512 px PNG for schema)
│       ├── people/          Family + doctor photos cropped from the brand creatives (AVIF + WebP)
│       ├── products/        Packshots at 160/320/480/640/1080 px (WebP)
│       ├── editorial/       AI-generated supporting images (see docs/CONTENT-SOURCES.md)
│       └── og/              1200×630 social cards (default + one per product)
├── source-files/            Full-resolution masters — never deployed
│   ├── brand/               Logo master, brand creatives
│   └── products/            {slug}-packshot.webp (clean packshot), {slug}-artwork.* (promotional artwork)
├── scripts/                 prepare-assets, audit-seo, test-forms, verify, generate-images
├── tests/                   Unit tests (node --test)
└── docs/                    GOOGLE-SEARCH-CONSOLE.md, QA.md, CONTENT-SOURCES.md
```

`dist/` and `output/` are build/test output and are git-ignored.

## Deploying (Netlify, Git deploy)

Netlify builds every push to `main` using `netlify.toml` (`npm run build` → `dist/`, Node 22). No environment variables or secrets are needed.

1. Run the full check above.
2. Commit and push to `main`. Netlify builds and publishes automatically (watch **Deploys** in the Netlify dashboard).
3. After the deploy, re-check the live site — see the checklist in [docs/GOOGLE-SEARCH-CONSOLE.md](docs/GOOGLE-SEARCH-CONSOLE.md#1-pre-launch-checklist-on-the-live-domain-after-the-new-version-is-deployed).

In Netlify → *Domain management*, `dpliferemedies.com` should be the **primary domain** with HTTPS enabled; `www` is redirected to it.

## Enquiries (FormSubmit → Gmail)

Every enquiry form posts to **FormSubmit** (`https://formsubmit.co/dpliferemedies@gmail.com`), which emails the submission to the client's Gmail. There is no SMTP, server code, password or API key anywhere in the project.

- **With JavaScript:** fields are validated inline, then sent in the background to FormSubmit's AJAX endpoint (20 s timeout). On success the visitor goes to `/thank-you/`. Offline, timeout and delivery failures show a message with call / WhatsApp / email alternatives; what the visitor typed is never cleared (and is kept in `sessionStorage` until sent).
- **Without JavaScript:** a normal POST to FormSubmit, which redirects to `/thank-you/` (`_next`).
- **Email:** subject `New enquiry from {Name}: {Product or enquiry type}`, table layout, Reply-To = the visitor's email (FormSubmit uses the `email` field), plus form type, page URL and submission time (IST).
- **Spam:** FormSubmit honeypot (`_honey`), keyword blacklist (`_blacklist`), and a 3-second minimum fill time (the "Send via WhatsApp" button is exempt). FormSubmit's reCAPTCHA page is turned off (`_captcha=false`) so visitors never see a third-party page.
- "Send via WhatsApp" opens WhatsApp with the message pre-filled; nothing is sent by the website.

### One-time FormSubmit activation (client action)

1. After the new version is live, the first submission to a new FormSubmit address triggers an **activation email** to dpliferemedies@gmail.com (check **Inbox and Spam**, sender FormSubmit). Until it is activated, the form shows the "could not be delivered" message with phone/WhatsApp/email alternatives.
2. Open that email and click **Activate Form**.
3. FormSubmit then shows/sends a random alias (e.g. `https://formsubmit.co/abc123…`). Put the alias part in `FORM_TARGET` in `src/data/site.mjs` (instead of the Gmail address), rebuild and redeploy. Enquiries still go only to dpliferemedies@gmail.com, and the address no longer appears in the page source.
4. In Gmail, if the first enquiry lands in Spam, mark it **Not spam** and create a filter for `from:(formsubmit.co)` → *Never send it to Spam*.

## Content maintenance

- Business details: `src/data/business.ts` · Products and divisions: `src/data/products.ts` · Shared copy: `src/data/content.ts` · Policies: `src/data/legal.ts`
- Adding a product to `products.ts` creates its page, sitemap entry, explorer card and related links. Add `source-files/products/{slug}-packshot.webp`, add the slug to `PRODUCTS` in `scripts/prepare-assets.mjs`, then `npm run assets`.
- Images: always run `npm run assets`; never link to files in `source-files/`.

Confirm DPrun XT strengths against approved packaging before adding them (the supplied artwork is inconsistent). Policy text and product details should be reviewed by the business.
