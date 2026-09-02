# Lead webhook spec for the Mommy Makeover landing page

**For:** the CRM developer
**From:** Xiluet Aesthetic Surgery marketing
**Landing page:** https://promo.xiluetaestheticsurgery.com (English) · https://promo.xiluetaestheticsurgery.com/es/ (Spanish)

## What we need from you

1. An **HTTPS endpoint** on the CRM that accepts a `POST` with a JSON body (one request per lead) and answers with any `2xx` status.
2. Optionally, the same or a second endpoint that accepts a `multipart/form-data` POST with up to 4 photos (see "Photo upload").
3. The **authentication** you want us to send: either a shared secret header or a bearer token. Tell us the header name and value.

When it's ready, send us back three things: the endpoint URL, the photo endpoint URL if different, and the auth header (name and value). We put them in Cloudflare and leads start flowing the same day. Nothing on the landing page changes.

## How the request reaches you

The visitor answers an 8-step quiz. On submit, the page posts to our Cloudflare function, which forwards **one JSON POST** to your endpoint from Cloudflare's network (the browser never calls your URL directly).

```
POST <your endpoint>
Content-Type: application/json
X-Webhook-Secret: <shared secret, if you choose that>      (or)
Authorization: Bearer <token>                               (any single header you specify)
```

Timeout: our side waits up to 8 seconds for your response. Please respond quickly (queue any slow processing).

## JSON payload

Every request has exactly these keys. Empty strings mean "not answered / not applicable". Values are stable English keys on both the English and Spanish page, so you never receive translated text.

```json
{
  "first_name": "Ana Test",
  "phone": "(305) 555-0100",
  "email": "ana@example.com",
  "whatsapp_ok": true,
  "language": "en",
  "procedures": ["tummy_tuck", "breast_lift"],
  "timing": "1_3_months",
  "travel": "other_state",
  "age_18_plus": "yes",
  "postpartum_status": "yes",
  "smoker": "no",
  "height": "",
  "weight": "",
  "payment_method": "financing",
  "credit_range": "720_plus",
  "state": "Georgia",
  "city": "Atlanta",
  "qualification": "qualified",
  "source": "google_lp_mommy_makeover",
  "campaign_name": "mm-en",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "mm-en",
  "utm_content": "",
  "utm_term": "",
  "gclid": "Cj0KCQjw...",
  "fbclid": "",
  "fbp": "",
  "fbc": "",
  "landing_url": "https://promo.xiluetaestheticsurgery.com/?utm_source=google&utm_campaign=mm-en&gclid=Cj0KCQjw...",
  "event_source_url": "https://promo.xiluetaestheticsurgery.com/",
  "submitted_at": "2026-09-01T23:27:47.220Z"
}
```

### Field reference

| Field | Type | Values / notes |
|---|---|---|
| `first_name` | string | Full name as typed by the visitor (label on the form is "Full name"). |
| `phone` | string | As typed; not normalized. |
| `email` | string | As typed, trimmed. |
| `whatsapp_ok` | boolean | Always `true` (consent line on the form covers phone, SMS, WhatsApp). |
| `language` | string | `en` or `es`. Use it to route to English- or Spanish-speaking coordinators. |
| `procedures` | array of strings | Any of `tummy_tuck`, `breast_lift`, `breast_augmentation`, `liposuction`, `not_sure`. May be empty. |
| `timing` | string | `asap`, `1_3_months`, `3_6_months`, `researching`. |
| `travel` | string | `miami_south_fl`, `florida`, `other_state`, `no`. |
| `age_18_plus` | string | `yes`, `no`. |
| `postpartum_status` | string | `yes` (done having children, 6+ months postpartum, not breastfeeding), `not_yet`, `not_sure`. |
| `smoker` | string | `no`, `yes`, `yes_would_stop`. |
| `height`, `weight` | string | Always empty (the step was removed; kept for schema stability). |
| `payment_method` | string | `cash`, `financing`, `mix`, `not_sure`. |
| `credit_range` | string | `720_plus`, `680_719`, `620_679`, `below_620`, `unknown`, or empty when payment is `cash`. |
| `state` | string | US state name, `Puerto Rico`, or `Outside the US` / `Fuera de EE. UU.`. Default `Florida`. |
| `city` | string | Optional free text. |
| `qualification` | string | `qualified`, `nurture`, `not_fit`. See rules below. |
| `source` | string | Always `google_lp_mommy_makeover`. |
| `campaign_name` | string | Equals `utm_campaign`, or `google-lp-mm` when the visitor arrived without UTMs. |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` | string | Captured from the landing URL, persisted through the quiz. Empty if absent. |
| `gclid` | string | Google Ads click ID. Store it: it enables offline conversion uploads later. |
| `fbclid`, `fbp`, `fbc` | string | Meta click ID and pixel cookies, for Conversions API. Empty if absent. |
| `landing_url` | string | First URL of the session, including UTMs. |
| `event_source_url` | string | URL of the page where the form was submitted. |
| `submitted_at` | string | ISO 8601 UTC timestamp. |

### Qualification rules (computed by the page, never shown to the visitor)

- `not_fit`: `age_18_plus` = `no` **or** `travel` = `no`. These visitors exit early and **are not submitted**; you will normally not receive them.
- `nurture`: `timing` = `researching` **or** `credit_range` = `below_620` **or** `postpartum_status` = `not_yet`.
- `qualified`: everything else.

Suggested handling: `qualified` → sales pipeline, immediate follow-up (the visitor is asked to send 4 photos on WhatsApp right after submitting). `nurture` → coordinator follow-up sequence.

## Photo upload (optional endpoint)

Qualified visitors can upload photos on the thank-you page instead of using WhatsApp. If you support it, we send:

```
POST <photo endpoint>            (defaults to the lead endpoint if you don't give us a second one)
Content-Type: multipart/form-data
<same auth header as above>

photo_front   file (image/*, ≤ 12 MB)   -- any subset of the four may be present
photo_left    file
photo_right   file
photo_back    file
first_name    text
phone         text
email         text
language      text   en | es
type          text   "photos"
source        text   "google_lp_mommy_makeover"
submitted_at  text   ISO 8601
```

Match the photos to the lead by `email` and/or `phone`. Answer `2xx` on success. If you don't want to receive files, tell us and we'll keep the uploader on WhatsApp only.

## Reliability notes

- Deduplicate on `email` + `phone` + `submitted_at` if you see retries.
- We do not retry on failure at the moment; a non-2xx response is logged on our side. If you want retries, tell us and we'll add them.
- All requests originate from Cloudflare's network, so IP allowlisting is not practical. Use the auth header instead.

## How to test your endpoint before we connect it

Run this against your endpoint (replace the URL and header). You should see the lead appear in the CRM.

```bash
curl -X POST "https://YOUR-CRM/endpoint" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR-SECRET" \
  -d '{"first_name":"Test Lead","phone":"(305) 555-0100","email":"test@example.com","whatsapp_ok":true,"language":"en","procedures":["tummy_tuck"],"timing":"asap","travel":"miami_south_fl","age_18_plus":"yes","postpartum_status":"yes","smoker":"no","height":"","weight":"","payment_method":"cash","credit_range":"","state":"Florida","city":"Miami","qualification":"qualified","source":"google_lp_mommy_makeover","campaign_name":"google-lp-mm","utm_source":"","utm_medium":"","utm_campaign":"","utm_content":"","utm_term":"","gclid":"","fbclid":"","fbp":"","fbc":"","landing_url":"https://promo.xiluetaestheticsurgery.com/","event_source_url":"https://promo.xiluetaestheticsurgery.com/","submitted_at":"2026-09-01T00:00:00.000Z"}'
```

Once you send us the URL and header, we'll submit a live test lead through the real quiz and confirm it arrives.
