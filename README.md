# Xiluet Aesthetic Surgery · Mommy Makeover landing page

Google Ads landing page (EN `/` + ES `/es/`) with an inline 8-step qualification quiz, hosted on **Cloudflare Pages** (static site + one Pages Function).
Design source of truth: [`design_handoff_mommy_makeover_lp/`](design_handoff_mommy_makeover_lp/README.md).

```
content/en.js, content/es.js   all page + quiz copy (edit copy here, then rebuild)
scripts/build.js               CONFIG (GTM, Pixel, WhatsApp, phone) + HTML template → site/index.html, site/es/index.html
site/                          Cloudflare Pages output directory (committed, no build step needed on CF)
  assets/style.css             styles (ported from the prototype's inline styles)
  assets/app.js                quiz state machine, CRM POST, dataLayer events, videos, FAQ, sticky CTA
  assets/…                     optimized images (WebP) and compressed testimonial videos (≤2.8 MB each)
  _redirects, _headers         /es → /es/, cache + security headers
functions/api/lead.js          Pages Function: proxies POST /api/lead to the custom CRM (URL + auth stay server-side)
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

**Variables and Secrets** (Settings → Variables and Secrets, Production *and* Preview):

| Name | Purpose |
|---|---|
| `CRM_WEBHOOK_URL` | Required. The custom CRM endpoint that receives the JSON lead POST. |
| `CRM_PHOTOS_WEBHOOK_URL` | Optional. Multipart target for the photo uploader. Defaults to `CRM_WEBHOOK_URL`. |
| `CRM_WEBHOOK_SECRET` | Optional. Sent as `X-Webhook-Secret` header on every forward. |
| `CRM_AUTH_HEADER` | Optional. Full auth header for the CRM, e.g. `Authorization: Bearer <token>` or `X-API-Key: <key>`. |

Until `CRM_WEBHOOK_URL` is set, `/api/lead` answers `{ ok:false, forwarded:false }` and the page still shows the outcome screen.

Local run with the API: `npm install` then `npm run dev` (wrangler pages dev on http://localhost:8788).

## Custom domain: promo.xiluetaestheticsurgery.com (DNS at SiteGround)

1. Pages project → Custom domains → Set up a custom domain → `promo.xiluetaestheticsurgery.com`.
2. SiteGround Site Tools → Domain → DNS Zone Editor → add:

```
Type: CNAME   Name: promo   Resolves to: xiluet-promo.pages.dev   TTL: default
```

Cloudflare validates the CNAME and issues the certificate automatically (a few minutes). `SITE_URL` in
`scripts/build.js` already points at this hostname.

## Lead payload (`POST /api/lead`, JSON)

`first_name, phone, email, whatsapp_ok (true), language (en|es), procedures[], timing, travel, age_18_plus,
postpartum_status, smoker, height (""), weight (""), payment_method, credit_range, state, city,
qualification (qualified|nurture|not_fit), source ("google_lp_mommy_makeover"), campaign_name, utm_source, utm_medium,
utm_campaign, utm_content, utm_term, gclid, fbclid, fbp, fbc, landing_url, event_source_url, submitted_at`

Answer values are canonical English keys on both languages (e.g. `timing: "1_3_months"`, `travel: "other_state"`,
`payment_method: "financing"`, `credit_range: "below_620"`). See `content/en.js` for the full list.

Photo uploader: multipart POST to the same endpoint with `photo_front/left/right/back`, `first_name`, `phone`, `email`, `type=photos`.

## dataLayer events

`quiz_start` · `quiz_step_n` · `quiz_complete` (+ `qualification`) · `qualified_lead` · `photos_sent` · `whatsapp_click` · `story_play`

## Open items for the client (visible `[brackets]` on the page)

`[30 days]` quote validity · `[Refundable/transferable terms]` · `[the standard combination]` · `[5–7]` drain days ·
`[Terms]` deposit refund · `[if not included]` prescriptions · `License [#]` + FL license lookup URL per surgeon
(`LINKS.verify` in `scripts/build.js`) · GTM container ID · Meta Pixel ID · CRM webhook URL · final subdomain.
