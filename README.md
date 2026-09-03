# Xiluet Aesthetic Surgery · Mommy Makeover landing page

Google Ads landing page (EN `/` + ES `/es/`) with an inline 8-step qualification quiz, hosted on **Cloudflare Pages** (static site + one Pages Function).
Design source of truth: [`design_handoff_mommy_makeover_lp/`](design_handoff_mommy_makeover_lp/README.md).

```
content/en.js, content/es.js   all page + quiz copy (edit copy here, then rebuild)
scripts/build.js               CONFIG (GTM, Pixel, WhatsApp, phone) + HTML templates → site/index.html, site/es/index.html,
                               site/thank-you/index.html, site/es/gracias/index.html
site/                          Cloudflare Pages output directory (committed, no build step needed on CF)
  assets/style.css             styles (ported from the prototype's inline styles)
  assets/app.js                quiz state machine, CRM POST, dataLayer events, videos, FAQ, sticky CTA
  assets/…                     optimized images (WebP) and compressed testimonial videos (≤2.8 MB each)
  _redirects, _headers         /es → /es/, cache + security headers
functions/api/lead.js          Pages Function: maps POST /api/lead to the Xiluet CRM contract and forwards it (credentials stay server-side)
wrangler.jsonc                 Pages config for local `wrangler pages dev` (output dir only)
```

## Edit copy or config

1. Change text in `content/en.js` / `content/es.js`, or IDs in the `CONFIG` block at the top of `scripts/build.js`.
2. Rebuild and commit the output:

```bash
node scripts/build.js
```

## Preview locally

```bash
python3 -m http.server 8477 -d site
```

Open http://localhost:8477 and http://localhost:8477/es/. (`/api/lead` is not served by this static server; the quiz logs a warning and still shows
the thank-you screen. Use `npm run dev` to run Pages with the API locally.)

## Deploy (Cloudflare Pages, Git-connected)

Every push to `main` deploys. Create the project at
[dash.cloudflare.com → Workers & Pages → Create → Pages → Import an existing Git repository](https://dash.cloudflare.com/?to=/:account/pages/new/provider/github):

| Setting | Value |
|---|---|
| Repository | `xiluet-smile/mommy-makeover` |
| Project name | `xiluet-promo` (→ `xiluet-promo.pages.dev`) |
| Production branch | `main` |
| Framework preset | None |
| Build command | *(empty)* |
| Build output directory | `site` |
| Functions | auto-detected from `functions/` |

**Variables and Secrets** (Settings → Variables and Secrets, Production *and* Preview) — see `docs/CRM-INTEGRATION.md`:

| Name | Purpose |
|---|---|
| `CRM_API_CLIENT` | Required (secret). `X-API-CLIENT` header for the Xiluet CRM endpoint. |
| `CRM_API_KEY` | Required (secret). `X-API-KEY` header. |
| `CRM_WEBHOOK_URL` | Optional. Endpoint override (default `https://securexapp.xiluetplasticsurgery.com/api/patients/create`). |
| `CRM_REFERRAL` | Optional. CRM origin id (default `30`, "Web contact form"). |
| `CRM_TEST_MODE` | Optional. `true` → CRM validates without writing; `/api/lead` answers synchronously with the CRM preview. |
| `LEAD_ALERT_WEBHOOK` | Optional. Receives a JSON POST when a lead is rejected, fails, or times out. |

Until the two credentials are set, `/api/lead` answers `{ ok:false, forwarded:false }` and the page still shows the thank-you page.

## Custom domain: promo.xiluetaestheticsurgery.com (DNS at SiteGround)

1. Pages project → Custom domains → Set up a custom domain → `promo.xiluetaestheticsurgery.com`.
2. SiteGround Site Tools → Domain → DNS Zone Editor → add:

```
Type: CNAME   Name: promo   Resolves to: xiluet-promo.pages.dev   TTL: default
```

Cloudflare validates the CNAME and issues the certificate automatically (a few minutes). `SITE_URL` in
`scripts/build.js` already points at this hostname.

## Lead payload (`POST /api/lead`, JSON, page → Function)

`first_name, last_name, phone (10 digits), email, whatsapp_ok (true), language (en|es), procedures[], timing, travel,
age_18_plus, postpartum_status, smoker, payment_method, credit_range, state, city, qualification (qualified|nurture|not_fit),
source ("google_lp_mommy_makeover"), campaign_name, utm_source, utm_medium, utm_campaign, utm_content, utm_term, matchtype,
gclid, gbraid, wbraid, fbclid, fbp, fbc, landing_url, event_source_url, submitted_at`

Answer values are canonical English keys on both languages (e.g. `timing: "1_3_months"`). The Function maps them to the
CRM contract (readable labels, `name`/`last`, `service`, `procedure_date`, `can_relocate`, `procedure_payment`, `referral`)
— see `docs/CRM-INTEGRATION.md` and `docs/contrato_crm_xiluet.pdf`. Photos are not uploaded from the site.

## Thank-you pages

After the contact step is submitted the visitor is redirected to `/thank-you/` (EN) or `/es/gracias/` (ES). Those pages
are short static pages (no quiz, no form): headline, the 3 next steps, WhatsApp button, phone, link back to the LP.
Before redirecting, the quiz stores `xil_lead_email` / `xil_lead_phone` (E.164) / `xil_lead_qualification` in `sessionStorage`;
the thank-you page sends email/phone to Google as enhanced-conversion user data, fires the Ads conversion event
`quiz_complete` (send_to AW-11505059358) plus the GTM `quiz_complete` / `qualified_lead` dataLayer events, then clears them. Nothing is put in the URL. The not-a-fit early exit stays
inline in the quiz card (no lead is created). Both pages are `noindex`.

Google tag (gtag.js, `AW-11505059358` + GA4 `G-K59E90DQD0`) is the first thing in `<head>` on every page (`googleTag()` in
`scripts/build.js`). Section anchors: `#pricing`, `#surgeons`, `#recovery`.

## dataLayer events

`quiz_start` · `quiz_step_n` (landing page) · `quiz_complete` (+ `qualification`) · `qualified_lead` (thank-you page, once) ·
`photos_sent` · `whatsapp_click` · `story_play`

## Open items for the client

Bracket placeholders were removed on 2026-09-01 (copy rewritten to not depend on them). Still worth confirming with the client:
quote validity period · deposit refund/transfer terms · drain duration · whether prescriptions are included ·
per-surgeon Florida license profile URLs (`LINKS.verify` in `scripts/build.js`, currently the generic FL DOH lookup) ·
GTM container ID · Meta Pixel ID · CRM webhook URL.
