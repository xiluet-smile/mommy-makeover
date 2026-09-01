# Handoff: Xiluet Aesthetic Surgery · Mommy Makeover Landing Page (EN + ES)

## Overview
Google-Ads landing page for a Mommy Makeover promotion ("from $7,500", struck-through $8,900) at Xiluet Aesthetic Surgery, Miami. The page's single conversion mechanic is an inline 8-step qualification quiz in the hero that branches to three outcome screens and pushes the lead to WhatsApp / a CRM webhook. Two languages: English (`/`) and Spanish (`/es/`).

Target hosting: **Cloudflare Pages** (static). No framework is required; plain HTML/CSS/JS is preferred. A Cloudflare Pages Function (or Worker) may be used for the CRM webhook proxy if the CRM needs a secret.

## About the design files
`design/index.dc.html` (EN) and `design/es.dc.html` (ES) are **design references built in a prototyping runtime** (`support.js`, a small templating layer over React). They are not production code. Open them in a browser to see exact layout, copy, and behavior, and read them for the exact inline styles. **Recreate them as static HTML + CSS + vanilla JS** (or Astro/Eleventy if you prefer a build step). Do not ship `support.js`, `<x-dc>`, `<sc-for>`, `<sc-if>`, or `{{ }}` holes.

How to read the prototype:
- Everything between `<x-dc>` and `</x-dc>` is the markup. Styles are inline; copy them literally.
- `<sc-for list="{{ x }}" as="item">` = loop; `<sc-if value="{{ x }}">` = conditional; `{{ path }}` = value from the logic class.
- The `<script type="text/x-dc" data-dc-script>` block is the logic class (`class Component`). `renderVals()` returns all data arrays (steps, options, FAQs, included/not-included lists, surgeons, results, videos). Copy the data from here.

## Fidelity
**High-fidelity.** Colors, type, spacing, copy, and interactions are final. Recreate pixel-accurately. All `[bracketed]` text is a partner-confirm placeholder that must remain visible until the client fills it (do not invent values).

## Site map / routes
| Route | Source | Notes |
|---|---|---|
| `/` (index.html) | `design/index.dc.html` | English |
| `/es/` (es/index.html) | `design/es.dc.html` | Spanish; identical structure, ES copy |
| header EN/ES toggle | links `/` ↔ `/es/` | |
| quiz | inline in hero, `#quiz` anchor | not a separate route; all "See if you qualify / Start the quiz" CTAs scroll to `#quiz` |
| thank-you states | rendered in place inside the quiz card | not separate routes |

## Design tokens
- Deep teal (hero, process, final CTA, footer bg): `#0b2a29`
- Ink (headings on light): `#10312f`; body on light: `#1d3d3a`; secondary: `#4c635f`; muted: `#6c7f7b`, `#8b8371`
- Champagne gold (CTAs, icons, dividers): `#c8a465`; darker gold text: `#b08d4f`; light gold hover: `#d9b878`; pale gold: `#e5c98d`
- Off-white section bg: `#f7f5f0` / `#f6f2ea`; card white `#ffffff`; card border `#e6e0d2`; gold hairline `#d9c9a3`
- Cream text on teal: `#f4ecdc`, `#e9dcc3`, `rgba(238,230,213,.85)`
- Muted teal text on dark: `#8fa9a6`; success sage: `#7fa88f`
- Fonts (Google Fonts): **Cormorant Garamond** 500/600/700 + italic 500 for headings; **Mulish** 400–700 for body/UI.
- Type: H1 `clamp(40px,5vw,62px)` 600 lh 1.06; section H2 44px 600 lh 1.1; card H3 22–28px 600; body 15.5–18px lh 1.6–1.7; eyebrows 12px, letter-spacing .28em, 700, uppercase, `#b08d4f` (gold `#c8a465` on teal).
- Radii: pills 999px; cards 8–10px; quiz card 18px; results images 8px. Section padding 96px 48px (80px on S1b), content max-width 1200px (1100px on pricing, 860px on FAQ).
- Buttons: primary pill `#c8a465` on `#0b2a29` text, 16px/700, padding 16px 30px, hover `#d9b878`. Outline pill: 1.5px `rgba(200,164,101,.6)` border, cream text. Quiz "Continue": full-width gradient `linear-gradient(90deg,#e2c98f,#c8a465 60%,#b08d4f)` with clipped top-right corner `clip-path: polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%)`, 17px/700, padding 16px; disabled = opacity .45.

## Section order (top → bottom)
Each `<section data-screen-label="…">` in the prototype is one block. Order is final:

1. **S0 Header** — sticky, teal `rgba(11,42,41,.97)` + blur, gold hairline bottom. Left: logo mark (`uploads/Xiluet.jpg` 40×44) + "Xiluet" (Cormorant 24) / "AESTHETIC SURGERY" (10px, .32em). Right: EN|ES pill toggle, gold CTA "See if you qualify → 60 sec" → `#quiz`. **Mobile (<900px): CTA is hidden until the user scrolls past the hero**, then fades in (opacity/translateY .3s).
2. **S1 Hero** — teal, faint logo watermark bottom-right (opacity .07). Two columns (auto-fit, min 340px): copy left (eyebrow, H1 "Mommy Makeover in Miami ~~$8,900~~ from $7,500", subhead, two CTAs, trust row with 3 gold line icons, gold italic line), **quiz card right** (see Quiz).
3. **S1b What is a Mommy Makeover** — off-white. Eyebrow + H2 + intro left, lifestyle photo right (external CDN URL in prototype; see Assets). Below: 4 compact cards (icon + title only): Tummy Tuck · Breast Lift · Breast Augmentation (optional) · Liposuction, and an italic note.
4. **S6 How it works** — teal. H2 + 6 numbered steps (gold Cormorant numerals 01–06, emoji, bold title, muted text) in a 6-col auto-fit grid, then primary CTA.
5. **S7 Results** — off-white. H2 "Results That Speak For Themselves", 10 square before/after images (5-col auto-fill, min 210px) with procedure label + surgeon name, disclaimer line. Images are hotlinked from `lp.xiluetaestheticsurgery.com` — **download and self-host**.
6. **S8 Stories** — white. 5 vertical 9:16 videos (250×444, radius 10) in a horizontal snap-scroll row; gold play badge overlay; tap toggles play/pause with sound, starting one pauses the others. Video 2 uses a poster image (`uploads/poster-womk.png`). Caption under each: "★★★★★ Xiluet patient".
7. **S5 Surgeons** — white. Eyebrow/H2/intro, 4 cards (photo 300px tall object-fit cover top, name, gold uppercase title, bio, "License [#] ↗" link → placeholder), then full-width gold band with the promise line.
8. **S3 Pricing** — white. Header row: eyebrow/H2/intro left, price tag box right (label "MOMMY MAKEOVER", ~~$8,900~~ 24px muted + "from $7,500" 44px). Two-column: "Included" card (off-white, 7 gold-check items, "7 ITEMS" label) and right column stack of "Not included" card (4 items, ring-dash markers) + teal callout with primary CTA "Get my written quote →".
9. **S4 Recovery** — off-white. Eyebrow/H2/intro, 4 phase cards (WEEK 1 · WEEKS 2–3 · WEEKS 4–6 · MONTHS 3–6) with gold SVG line icons (paths are in `phases[]`).
10. **S9 Travel** — off-white. Eyebrow/H2, 4 cards with gold SVG icons (plane, house, nurse, checklist) and one-line text.
11. **S12 FAQ** — white, max 860px. H2 "Your questions, answered straight." Accordion of **10** items; gold ◇ marker rotates 90° when open; +/– at right; first item open by default; one open at a time.
12. **S13 Final CTA** — teal, centered: H2, primary pill "Start the quiz", italic sub-line. Logo watermark top-left.
13. **S14 Visit** — off-white. Two equal-height columns: left H2 "Visit us in Miami", ADDRESS / HOURS / PHONE (gold 11.5px labels), reception photo `uploads/Office.jpg` filling remaining height; right Google Maps embed (min-height 420px, `filter: saturate(.6)`).
14. **Footer** — 260px skyline banner (external CDN; see Assets) with teal gradient fade, then logo left / business line + Privacy Policy + Terms links + small disclaimer right.

Exact copy for every block is in the prototype markup and `renderVals()`. Spanish copy: `design/es.dc.html` (and `copy-reference-es.md` for the source storyboard).

## Mobile (<720px)
The prototype's `<helmet><style>` has a `@media (max-width: 720px)` block — port it as-is: 20px side padding, H1 38px / H2 30px / H3 22px, hero stacks copy → quiz, `[data-m="grid2"]` grids become 2 columns (results, surgeons, phases, steps), price tag full-width, quiz card padding 18px 16px, story cards 210×373, skyline 150px, map 260px. Minimum tap target 44px.

## Quiz (core conversion mechanic)
Lives inside the hero card (`#quiz`, `scroll-margin-top: 90px`). Card: gradient `#fbf8f1→#f3ecdd`, radius 18, padding 24px 28px, shadow `0 30px 80px rgba(0,0,0,.35)`, gold outline frame offset 14px behind it.

Header row: "← Back" (hidden on step 1) · "FREE EVALUATION · 60 SEC". Progress: 8 diamonds (◆ filled gold for done/current, ◇ `#d9c9a3` for upcoming) joined by hairlines. Eyebrow "QUESTION n OF 8", question in Cormorant 700 `clamp(24px,2.2vw,30px)`, optional hint.

Answer rows (single column): icon 26px · label · 20px check circle; white bg, 1.5px `#e6dcc4` border, radius 10, min-height 54; selected = bg `#f8efd9`, border `#c8a465`, gold check. **Single-select auto-advances after ~220ms; multi-select and form steps show the Continue button** (disabled until valid).

Screens (11 screens across 8 numbered steps; `q` = displayed number):
| id | q | question | options / fields |
|---|---|---|---|
| procedures (multi) | 1 | Which procedures are you interested in? "Choose everything that applies." | Tummy tuck · Breast lift · Breast augmentation · Liposuction · Not sure, let the surgeon recommend |
| timing | 2 | When would you like to have surgery? | ASAP · 1–3 months · 3–6 months · Just researching |
| travel | 3 | Can you travel to our clinic in Miami? | I'm in Miami/South FL · Yes, from elsewhere in Florida · Yes, from another state · No |
| age | 4 | Are you 18 or older? | Yes · No |
| postpartum | 4 | Are you done having children, at least 6 months postpartum, and no longer breastfeeding? | Yes · Not yet · Not sure |
| smoke | 4 | Do you smoke or vape? | No · Yes · Yes, but I'd stop before surgery |
| pay | 5 | How do you plan to pay? | Cash/savings · Financing · A mix · Not sure |
| credit | 6 | Approximate credit score? *(only if pay ∈ Financing / A mix / Not sure)* | 720+ · 680–719 · 620–679 · Below 620 · Don't know |
| location | 7 | Where are you located? | STATE select (default Florida, full US list + Puerto Rico + Outside the US) · CITY (optional) |
| contact | 8 | Where should your surgeon send your evaluation? | FULL NAME · PHONE · EMAIL · consent line · button "Get my free evaluation →" |

Icon SVG paths per option are in `ICONS` in the logic class (48×48 viewBox, stroke `#c8a465`, 1.4px, round caps).

**Early exits:** travel = "No" or age = "No" → Not-a-fit screen immediately.
**Qualification (computed on submit, never shown to the user, never in the URL):**
- `not_fit`: age = No OR travel = No
- `nurture`: timing = Just researching OR credit = Below 620 OR postpartum = Not yet
- `qualified`: everything else

Never show the price or an "approved" message inside the quiz.

### Outcome screens (render inside the same card)
- **Qualified (TY-A):** gold ✓ badge; "Thank you, {name}. One last step for your surgeon."; instructions paragraph; 4 gold line-art silhouettes FRONT / LEFT SIDE / RIGHT SIDE / BACK (SVG in `silhouette()`); 🔒 privacy line; gold button **Send my photos on WhatsApp** → `https://wa.me/{WHATSAPP_NUMBER}?text=` + URL-encoded `Hi, I'm {name}. I just completed the Mommy Makeover evaluation and I'm sending my photos.`; outline button **Upload them here instead** toggles a 4-slot image uploader (dashed gold boxes, thumbnails on select, "Submit photos" disabled until ≥1 file, success banner in sage); "WHAT HAPPENS NEXT" arrow line; "Prefer to call? (305) 615-4200".
- **Nurture (TY-B):** ✓ badge; "You're on our list, {name}."; coordinator paragraph; gold **Chat on WhatsApp** (wa.me with `Hi, I'm {name}. I just completed the Mommy Makeover evaluation.`); call line. No uploader.
- **Not a fit:** ◇; "Thank you for your honesty."; text depends on reason (travel: "Our surgeries are performed in Miami. If your plans change, we'd love to help." / age: "Our procedures are for patients 18 and older. When the time is right, we'd love to help."); outline **Chat on WhatsApp anyway** + text button **Start over** (resets state).

`{name}` falls back to "there" (ES: "mamá").

## Integration spec (to implement, not in prototype)
Put a clearly marked `CONFIG` block at the top of the page JS:
```js
const CONFIG = {
  CRM_WEBHOOK_URL: "",  // POST target
  GTM_ID: "",
  META_PIXEL_ID: "",
  WHATSAPP_NUMBER: "13056154200",
  PHONE: "(305) 615-4200",
  DEPOSIT_AMOUNT: "$250",
  REVIEW_COUNT: "",
};
```
- On contact submit: **one JSON POST** to `CRM_WEBHOOK_URL` with exactly: `first_name, phone, email, whatsapp_ok, language ("en"|"es"), procedures[], timing, travel, age_18_plus, postpartum_status, smoker, height, weight, payment_method, credit_range, state, city, qualification (qualified|nurture|not_fit), source ("google_lp_mommy_makeover"), campaign_name (fallback "google-lp-mm"), utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbclid, fbp, fbc, landing_url, event_source_url, submitted_at`. `height`/`weight` are always empty (the step was removed); `whatsapp_ok` is always `true` (checkbox removed). Capture UTMs/gclid/fbclid from the URL on load and persist in `sessionStorage` through the quiz. Never put answers in the URL.
- Uploader: multipart POST to the same `CRM_WEBHOOK_URL` (fields: the 4 images + `phone`, `email`, `first_name`).
- `dataLayer` events: `quiz_start` (first CTA click), `quiz_step_n`, `quiz_complete`, `qualified_lead` (only for `qualified`), `photos_sent`. GTM container snippet in `<head>`; Meta Pixel `PageView` only.
- Recommended on Cloudflare Pages: keep the webhook URL out of the client by proxying through a Pages Function at `/api/lead` that forwards to the CRM with a server-side secret.
- Add `<html lang="en">` / `lang="es"`, `<link rel="alternate" hreflang>` pairs, Open Graph tags, and a `_redirects` file if `/es` should redirect to `/es/`.

## Assets
Bundled in `design/uploads/`:
- `Xiluet.jpg` — logo mark (header, footer, hero/final-CTA watermarks)
- `Office.jpg` — reception photo (S14)
- `poster-womk.png` — poster frame for Stories video 2
- 5 testimonial videos, in row order: `videos-1788297367616-tmmr.mp4`, `videos-1788297366841-womk.mp4`, `videos-1788297367155-9ud7.mp4`, `videos-1788297368392-fcyv.mp4`, `videos-1788297369311-v9w5.mp4` — compress to ≤3 MB each (H.264, 720×1280) before shipping.

Hotlinked in the prototype — **download, optimize (WebP/AVIF), and self-host**:
- Surgeon portraits (4) and results images (10): URLs under `https://lp.xiluetaestheticsurgery.com/wp-content/uploads/2026/07/…` listed in `surgeons[]` and `results[]`.
- S1b lifestyle photo and footer skyline: `https://d8j0ntlcm91z4.cloudfront.net/…` (two AI-generated images; URLs in the markup). These are temporary; the client may replace them with real photography.
- Google Maps iframe: `https://maps.google.com/maps?q=7390+W+Flagler+St+Miami+FL+33144&t=&z=15&ie=UTF8&iwloc=B&output=embed`.

Icons are inline SVG paths (no icon font). Step emojis in S6 are literal characters.

## Links
- Privacy Policy: https://xiluetaestheticsurgery.com/privacy-policy/
- Terms: https://xiluetaestheticsurgery.com/terms-and-conditions/
- Phone: (305) 615-4200 · Address: 7390 W Flagler St, Miami, FL 33144 · Hours: Mon–Fri 9 AM–6 PM · Sat 9 AM–2 PM · Sun closed
- Surgeon "License [#] ↗" links → `VERIFY_URL_3` placeholder until the client supplies the FL license lookup URLs.

## Open items for the client (leave as visible `[brackets]`)
`[30 days]` quote validity · `[Refundable/transferable terms]` · `[the standard combination]` · `[5–7]` drain days · `[Terms]` deposit refund · `[if not included]` prescriptions · `License [#]` per surgeon.

## Files
- `design/index.dc.html` — English page + quiz (design reference)
- `design/es.dc.html` — Spanish page + quiz (design reference)
- `design/support.js`, `design/image-slot.js` — prototype runtime only; needed to open the references locally, do not ship
- `design/uploads/*` — assets listed above
- `copy-reference-es.md` — original Spanish storyboard copy
