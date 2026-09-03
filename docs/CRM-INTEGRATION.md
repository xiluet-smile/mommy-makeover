# CRM integration (Xiluet CRM endpoint)

The CRM contract is the developer's document **`contrato_crm_xiluet.pdf`** (2026-09-02) in this folder. It answers our
original spec and defines the endpoint that already exists in production. The live reference inside the CRM:
Informes › Web Leads › Endpoint.

```
POST https://securexapp.xiluetplasticsurgery.com/api/patients/create
Content-Type: application/json
X-API-CLIENT: <secret>
X-API-KEY:    <secret>
```

The page never calls the CRM. It posts its canonical payload to `/api/lead`; the Pages Function
(`functions/api/lead.js`) maps it to the contract and forwards it. Credentials live only in Cloudflare secrets.

## Cloudflare variables

| Name | Required | Purpose |
|---|---|---|
| `CRM_API_CLIENT` | yes (secret) | `X-API-CLIENT` header value, from Xiluet |
| `CRM_API_KEY` | yes (secret) | `X-API-KEY` header value, from Xiluet |
| `CRM_WEBHOOK_URL` | no | Override the endpoint URL (default: production endpoint above) |
| `CRM_REFERRAL` | no | CRM origin id, default `30` = "Web contact form". Change if Xiluet creates a dedicated origin for this landing page |
| `CRM_TEST_MODE` | no | `true` → every request carries `test_mode: true` (CRM validates, previews, writes nothing) and `/api/lead` answers synchronously with the CRM response |
| `LEAD_ALERT_WEBHOOK` | no | URL that receives a JSON POST whenever a lead is rejected, fails, or times out (or credentials are missing) |

Until `CRM_API_CLIENT` / `CRM_API_KEY` exist, `/api/lead` answers `{ ok:false, forwarded:false }`; the visitor still reaches the thank-you page.

## Page payload → CRM payload

The page keeps sending canonical keys (see README). The Function converts them:

| Page sends | CRM receives | Rule |
|---|---|---|
| `first_name`, `last_name` | `name`, `last` | Two separate form fields (max 50 each). Legacy single-field values are split on the first space. |
| `phone` | `phone` | Exactly 10 digits (punctuation and leading `1` removed). The form only lets a 10-digit US number through. |
| `email` | `email` | Lowercased, max 128 |
| `language` | `language` | `en` / `es` |
| `procedures[]` | `service` | Labels joined with `, `: `Tummy tuck`, `Breast lift`, `Breast augmentation`, `Liposuction`, `Not sure, surgeon to recommend` |
| `timing` | `procedure_date` | `ASAP`, `1-3 months`, `3-6 months`, `Just researching` |
| `travel` | `can_relocate` | `In Miami / South FL`, `Yes, from elsewhere in Florida`, `Yes, from another state`, `No` |
| `payment_method` | `procedure_payment` | `Cash / savings`, `Financing`, `A mix`, `Not sure` |
| `smoker` | `smoker` | `No`, `Yes`, `Yes, would stop before surgery` |
| `credit_range` | `credit_range` | `720+`, `680-719`, `620-679`, `Below 620`, `Don't know`, or `""` when payment is cash |
| — | `postpartum_status` | Always `""` (the postpartum question was removed from the quiz on 2026-09-03) |
| `age_18_plus` | `age_18_plus` | `Yes`, `No` |
| `state`, `city` | `state`, `city` | As is (city max 50) |
| `qualification` | `qualification` | Untranslated, lowercase: `qualified`, `nurture`, `not_fit` |
| — | `referral` | Fixed `"30"` |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` | same | As is, max 128 |
| `gclid`, `gbraid`, `wbraid` | same | Not in the contract's list; the CRM archives unknown fields in its raw log. Kept for future offline conversions. |
| `whatsapp_ok`, `source`, `campaign_name`, `utm_term`, `fbclid`, `fbp`, `fbc`, `landing_url`, `event_source_url`, `submitted_at`, `matchtype` | dropped | Per the contract |

Labels are always English, also on `/es/`. Photos are never sent: the CRM's assistant asks the patient for them itself.

## Delivery and response handling

- The browser gets `202 { ok:true, queued:true }` immediately and redirects to the thank-you page; the CRM call runs
  in the background with a **30 s** timeout (the CRM creates the patient and sends the first SMS/WhatsApp before replying).
- **No retries**: a retry becomes a "recontact" and the patient receives a second automatic message. Never retry a 4xx.
- The CRM answers **HTTP 200 even when it rejects the lead**. The Function reads `data.patient_status`:
  `created`, `recontact`, `test` → success; `invalid`, `error` → logged with `data.errors` and `data.log_id`, and posted
  to `LEAD_ALERT_WEBHOOK` if set. Network errors and timeouts are alerted the same way.

## Testing

1. Set `CRM_TEST_MODE=true` (plus the two credentials) in Cloudflare and redeploy.
2. Submit the quiz on the live page, or run the curl below. `/api/lead` returns `{ sent: <CRM payload>, crm: { patient_status: "test", preview: … } }`.
3. Remove `CRM_TEST_MODE`, redeploy, submit one real lead per language, confirm in the CRM (name, last name, procedure, qualification), then delete the test patients.

```bash
curl -s -X POST "https://promo.xiluetaestheticsurgery.com/api/lead" \
  -H "Content-Type: application/json" -H "Origin: https://promo.xiluetaestheticsurgery.com" \
  -d '{"first_name":"Ana","last_name":"Test","phone":"(305) 555-0100","email":"ana@example.com","language":"es","procedures":["tummy_tuck","breast_lift"],"timing":"1_3_months","travel":"other_state","age_18_plus":"yes","postpartum_status":"yes","smoker":"no","payment_method":"financing","credit_range":"720_plus","state":"Georgia","city":"Atlanta","qualification":"qualified","utm_source":"google","utm_medium":"cpc","utm_campaign":"mm-es","utm_content":""}'
```
