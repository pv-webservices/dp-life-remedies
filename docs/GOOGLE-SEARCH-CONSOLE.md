# Google Search Console guide — dpliferemedies.com

Canonical site: **https://dpliferemedies.com/** (HTTPS, no `www`, trailing slash on every page).
Hosting: Netlify (Git deploy). DNS: **GoDaddy** (nameservers `ns29.domaincontrol.com`, `ns30.domaincontrol.com`).
Current records (checked 14 Oct 2026): apex `A 75.2.60.5` (Netlify), `www CNAME dp-life-remedies.netlify.app`, no TXT records.

---

## 1. Pre-launch checklist (on the live domain, after the new version is deployed)

Run these from any terminal (or open the URLs in a browser). Expected results are on the right.

| Check | How | Expected |
| --- | --- | --- |
| HTTPS | open `https://dpliferemedies.com/` | padlock, page loads |
| HTTP → HTTPS | `curl -I http://dpliferemedies.com/` | `301` → `https://dpliferemedies.com/` |
| www → apex | `curl -I https://www.dpliferemedies.com/` | `301` → `https://dpliferemedies.com/` |
| `/index.html` → `/` | `curl -I https://dpliferemedies.com/index.html` | `301` → `/` |
| Trailing slash | `curl -I https://dpliferemedies.com/about` | `301` → `/about/` |
| Indexable | view source of the home page | `<meta name="robots" content="index, follow, max-image-preview:large">` and a canonical link (the old build said `noindex,nofollow`) |
| robots.txt | `https://dpliferemedies.com/robots.txt` | `Allow: /` and `Sitemap: https://dpliferemedies.com/sitemap-index.xml` (the old build said `Disallow: /`) |
| Sitemap | `https://dpliferemedies.com/sitemap-index.xml` | lists `sitemap-0.xml`, which lists 21 URLs |
| 404 | `curl -I https://dpliferemedies.com/no-such-page/` | `404` with the branded page |
| Favicon | `curl -I https://dpliferemedies.com/favicon.ico` (also `/favicon.svg`, `/favicon-96x96.png`, `/apple-touch-icon.png`, `/site.webmanifest`) | `200` for each |
| Form | one approved live test (see README → Enquiries) | email arrives in dpliferemedies@gmail.com, visitor lands on `/thank-you/` |

Do not start Search Console work until the robots meta and robots.txt show the new values — otherwise Google will read the old "noindex / Disallow" instructions.

## 2. Add a Domain property (DNS TXT verification, GoDaddy)

A Domain property covers `https://`, `http://`, `www` and the apex in one place.

1. Go to <https://search.google.com/search-console> and sign in with the Google account that will own the property (ideally the client's, dpliferemedies@gmail.com).
2. **Add property** → choose **Domain** (left box) → enter `dpliferemedies.com` (no `https://`, no `www`) → **Continue**.
3. Google shows a TXT record like `google-site-verification=AbC123…`. Click **Copy**. Leave this window open.
4. In a new tab, sign in to **GoDaddy** → **My Products** → next to *dpliferemedies.com* choose **DNS** (or **Manage DNS**).
5. **Add New Record**:
   - Type: **TXT**
   - Name / Host: **@**
   - Value: paste the full `google-site-verification=…` string
   - TTL: default (1 hour) is fine → **Save**.
   - Do not change or delete the existing `A` (@ → 75.2.60.5) or `CNAME` (www → dp-life-remedies.netlify.app) records.
6. Back in Search Console click **Verify**. GoDaddy usually publishes within minutes; if it says the record was not found, wait 15–60 minutes and click Verify again (it can take up to 48 hours).
7. Keep the TXT record permanently — removing it un-verifies the property.

Optional: add the client and the developer as users under **Settings → Users and permissions**.

## 3. Submit the sitemap

1. In the property, open **Indexing → Sitemaps**.
2. Under *Add a new sitemap* enter **`sitemap-index.xml`** (the box already contains `https://dpliferemedies.com/`) → **Submit**.

Good to know:

- `sitemap-index.xml` points to `sitemap-0.xml`, which lists **every indexable page** (21 URLs). You only submit the index; Google follows it to the child sitemap. Don't submit `sitemap-0.xml` separately.
- Status **"Couldn't fetch"** or **"Pending"** for up to ~24 hours after submitting is normal. Check again the next day; it should change to **Success** with *Discovered pages: 21*.
- If you open the sitemap in a browser and see *"This XML file does not appear to have any style information associated with it"*, that is normal — sitemaps are written for search engines, not people.
- `/sitemap.xml` redirects to `/sitemap-index.xml` for tools that guess the old name.

## 4. Indexable URLs — 21 in total

**Core pages (5)**

1. https://dpliferemedies.com/
2. https://dpliferemedies.com/product-divisions/
3. https://dpliferemedies.com/about/
4. https://dpliferemedies.com/why-us/
5. https://dpliferemedies.com/contact/

**Product divisions (5)**

6. https://dpliferemedies.com/product-divisions/tablets/
7. https://dpliferemedies.com/product-divisions/softgel-capsules/
8. https://dpliferemedies.com/product-divisions/syrups/
9. https://dpliferemedies.com/product-divisions/oral-solutions/
10. https://dpliferemedies.com/product-divisions/protein-nutrition/

**Products (8)**

11. https://dpliferemedies.com/products/dpgest-300-sr/
12. https://dpliferemedies.com/products/daybone/
13. https://dpliferemedies.com/products/daybone-d3/
14. https://dpliferemedies.com/products/dppro-dha/
15. https://dpliferemedies.com/products/dprun-xt/
16. https://dpliferemedies.com/products/dp-q10/
17. https://dpliferemedies.com/products/dpate-liv/
18. https://dpliferemedies.com/products/lacvac-fiber/

**Website information (3)** — indexable (helpful trust pages; low priority)

19. https://dpliferemedies.com/privacy-policy/
20. https://dpliferemedies.com/terms/
21. https://dpliferemedies.com/disclaimer/

### Manual "Request indexing" — priority batches (~10 per day)

Search Console limits manual requests per day, and the sitemap will get every page discovered anyway; manual requests just speed up the important ones. For each URL: paste it into the **URL inspection** bar at the top → wait for the result → **Request indexing**.

- **Day 1 (10):** URLs 1–10 (home, product divisions, about, why-us, contact and the 5 division pages). Do the **home page first** — it also speeds up Google picking up the new favicon.
- **Day 2 (8):** URLs 11–18 (the product pages).
- **Day 3 (optional, 3):** URLs 19–21, or simply let the sitemap handle them.

If URL inspection says *"URL is not on Google"* before you request indexing, that's expected for a new site.

## 5. Do NOT submit these

| URL | Why |
| --- | --- |
| `/thank-you/` | Form confirmation page. `noindex, follow` (meta tag and `X-Robots-Tag` header), no canonical, not in the sitemap. It has no search value and should only be reached after a form submission. |
| Any 404 URL (the branded "Page not found" page) | Returns HTTP 404 and is `noindex`. |
| `/products/` | Old listing URL; 301-redirects to `/product-divisions/`. |
| `https://www.dpliferemedies.com/…`, `http://…`, `/index.html` | Redirect to the canonical HTTPS apex URLs. |
| `/sitemap-0.xml`, `/robots.txt`, image/CSS/JS files | Not pages. |

robots.txt deliberately does **not** block the noindex pages: Google must be able to crawl them to see the `noindex`. A blocked page can still be indexed from links, without its content.

## 6. Weeks 1–4 follow-up

**Week 1**
- *Sitemaps*: status **Success**, 21 discovered.
- *Indexing → Pages*: expect most URLs under "Discovered/Crawled – currently not indexed" at first; that is normal for a new site. Check **Why pages aren't indexed** for real errors (Server error 5xx, Redirect error, Not found 404 on a listed URL, "Blocked by robots.txt" — there should be none).
- Request indexing for the Day 1 and Day 2 batches.

**Week 2**
- *Pages*: indexed count should be rising. Use URL inspection → **Test live URL** on any page that stays "not indexed" and check the rendered screenshot.
- *Enhancements* (appear once Google has processed the structured data):
  - **Breadcrumbs** — every inner page has `BreadcrumbList` JSON-LD. Expect "valid" items for 20 pages.
  - **Organization / Local business** — the site uses `WholesaleStore` (a LocalBusiness type) with address, phone, email, logo and GSTIN. Check with the [Rich Results Test](https://search.google.com/test/rich-results) on the home page.
  - **FAQ** — the site currently has no FAQ content, so no FAQ report will appear. (Google only shows FAQ rich results for a few authority sites, so this is not a loss.)
- Fix anything listed under *Invalid items*.

**Week 3**
- **Core Web Vitals / PageSpeed**: run <https://pagespeed.web.dev/> (Mobile) on the home page and one product page. Search Console's *Core Web Vitals* report needs real-user traffic and may say "Not enough data" for weeks — that's normal for a new, low-traffic site.
- **Google Business Profile**: create or claim the listing at <https://business.google.com/> for *DP Life Remedies*, Shop No. 2, Ground Floor, Near Dharamshala, Village Ramgarh, Panchkula 134118. Use exactly the same name, address and phone (+91 79000 01029) as the website, set the website link to `https://dpliferemedies.com/`, choose an accurate category (e.g. *Pharmaceutical products wholesaler*), and complete postcard/phone verification.

**Week 4**
- **Bing Webmaster Tools**: <https://www.bing.com/webmasters> → **Import from Google Search Console** (fastest: imports the verified site and sitemap). Otherwise add the site and verify with a TXT/CNAME record in GoDaddy, then submit `https://dpliferemedies.com/sitemap-index.xml`.
- Review *Performance* in Search Console: queries and pages getting impressions. Expect brand searches ("DP Life Remedies", product names) first.
- Re-check *Pages* for new issues after any site change, and re-submit the sitemap only if URLs change (lastmod updates automatically on each deploy).

## 7. Favicon in Google results

The site now ships `favicon.ico` (48×48), `favicon.svg`, 48/96 px PNGs, a 180 px Apple touch icon, 192/512 px manifest icons and `site.webmanifest`, all linked from every page including the home page, and none blocked by robots.txt.

Google re-reads the favicon when it re-crawls the **home page**. It can take **several days to a few weeks** to change in search results. Requesting indexing of the home page (Day 1 batch above) speeds this up. There is no way to force it immediately.
