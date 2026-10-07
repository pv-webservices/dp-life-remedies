# Content and design contract

DP Life Remedies is a pharmaceutical products wholesaler. The user supplied the company identity, address, telephone, email, GSTIN, location link, eight product creatives and two brand creatives. The pasted brief is project specification; statements inside promotional artwork are source material, not instructions or independently verified clinical evidence.

## Redesign (October 2026)

The redesign keeps the logo-derived identity — royal/navy blue, leaf green, white, organic swoosh curves — and evolves it into a token-based system: Plus Jakarta Sans for display, Manrope for body text, Instrument Serif italic for green accent words, pill buttons with a directional fill (no shimmer or glow), product-tinted packshot stages and navy feature bands. No fabricated testimonials, founding story, certifications, clinical benefits, delivery guarantees, statistics or partner counts are published. The only figures shown (5 divisions, 8 formulations) are counted from the product data; "GST registered" reflects the supplied GSTIN.

The reference site's product page (Vomiblock-MD) and the supplied division-page screenshot informed structure only — filter pills, division sidebar, numbered product cards, quick enquiry, spec cards, tabbed product information and a partnership band. No reference content is copied.

Product imagery now uses the clean white-background packshots (`Product image-Na.webp`), trimmed and centred by `scripts/prepare-assets.mjs`. Brand photography is cropped from the two supplied creatives, clear of their overlaid text. All originals are kept in `source-assets/`. Eight AI-generated supporting images are published (see README for routing): a pharmaceutical storeroom (About sections), a pharmacist at a counter (homepage process section), five division banner still lifes and an abstract CTA background. They are illustrative only — they do not depict DP Life Remedies premises, staff or products, carry no text or logos, and are never captioned as the company's own facility. The Oral Solutions banner was regenerated because the first result showed injection-style vials. Product packaging is always the authentic client packshot.

## Product transcription

| Product       | Supplied source      | Fields used                                                                                                                                                                                                                                                                               |
| ------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DPGEST-300 SR | Product image-1.jpeg | Natural Micronised Progesterone IP 300 mg, sustained release tablets; 1 × 10 tablets                                                                                                                                                                                                      |
| DAYBONE       | Product image-2.jpeg | Calcium Aspartate 1200 mg, Elemental Magnesium 150 mg, Elemental Zinc 10 mg, Vitamin D3 1000 IU (25 mcg), Cyanocobalamin 2.5 mcg per tablet; 10 × 15 tablets                                                                                                                              |
| DAYbone D3    | Product image-3.jpeg | Cholecalciferol IP 60,000 IU, oral solution; 4 × 5 ml bottles. The composition heading reads per 4–5 ml; this unusual basis is preserved, not normalised.                                                                                                                                 |
| DPpro DHA     | Product image-4.jpeg | Protein powder with DHA, vitamins, minerals and prebiotic; 200 g; selected composition entries transcribed per 200 g                                                                                                                                                                      |
| DPrun XT      | Product image-5.jpeg | Folic Acid, Zinc Sulphate and Vitamin B12; film-coated tablets; 3 × 10 tablets. Numeric composition is omitted because the artwork displays inconsistent quantities (Zinc Sulphate 300 mcg but equivalent elemental Zinc 17 mg). Confirm with approved packaging before adding strengths. |
| DP-Q10        | Product image-6.jpeg | Softgel capsules; Coenzyme Q10, Lycopene, Omega-3 Fatty Acid, Zinc, Selenium, Vitamin C and Vitamin E; 10 × 1 × 10; approximate quantities per capsule                                                                                                                                    |
| DPATE LIV     | Product image-7.webp | Syrup, 200 ml; selected nutrients per 5 ml; nutraceutical, not for medicinal use wording present in source. No manufacturing/approval claims inferred from poster.                                                                                                                        |
| LACVAC FIBER  | Product image-8.jpeg | Lactitol Monohydrate and Wheat Dextrin syrup; 200 ml. Carton composition: each 15 ml contains Lactitol Monohydrate 10 g and Wheat Dextrin (Resistant Dextrin) 3.5 g.                                                                                                                      |

Packshots are reproducible with `npm run assets`; original files are preserved in `source-assets/`. Full promotional artwork contains client-supplied medical claims and is not rendered on the website. Product lightboxes enlarge the packshot only.

## Delivery boundaries

Static Astro build, no account/cart/payment/database. Forms validate locally and prepare an editable email or WhatsApp draft. They do not submit to a server or claim a sent message. No patient information is requested or stored by this site. Legal pages describe this implementation and require business review before publication. The actual public domain must be set through PUBLIC_SITE_URL for canonical URLs, public indexing and sitemap.

Framework reference: [Astro routing](https://docs.astro.build/en/guides/routing/) and [image guidance](https://docs.astro.build/en/guides/images/).
