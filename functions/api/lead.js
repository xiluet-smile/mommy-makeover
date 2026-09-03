/**
 * Cloudflare Pages Function · POST /api/lead
 *
 * Receives the quiz payload from the page (canonical English keys) and forwards it to the Xiluet CRM
 * in the shape defined by "Contrato del CRM Xiluet" (docs/contrato_crm_xiluet.pdf, 2026-09-02):
 * readable English labels, split name, 10-digit US phone, fixed referral, X-API-CLIENT / X-API-KEY headers.
 *
 * Env vars (Pages project → Settings → Variables and Secrets, Production + Preview):
 *   CRM_API_CLIENT      required · secret · value of the X-API-CLIENT header (sent by Xiluet through a private channel)
 *   CRM_API_KEY         required · secret · value of the X-API-KEY header
 *   CRM_WEBHOOK_URL     optional · endpoint URL (defaults to the production endpoint below)
 *   CRM_REFERRAL        optional · CRM origin id (default "30" = "Web contact form")
 *   CRM_TEST_MODE       optional · "true" → adds test_mode:true (CRM validates and previews, writes nothing) and answers synchronously
 *   LEAD_ALERT_WEBHOOK  optional · URL that receives a JSON POST when the CRM rejects or fails a lead (invalid/error/timeout)
 *
 * Delivery model: the browser gets an immediate 202 and redirects to the thank-you page; the CRM call continues in the
 * background (context.waitUntil) with a 30 s timeout, because the CRM creates the patient and fires the first SMS/WhatsApp
 * before answering. No retries (a retry would create a "recontact" and send the patient a second message).
 *
 * The CRM answers HTTP 200 even when it rejects the payload: success is data.patient_status ∈ {created, recontact, test}.
 */

const DEFAULT_ENDPOINT = "https://securexapp.xiluetplasticsurgery.com/api/patients/create";
const CRM_TIMEOUT_MS = 30000;
const OK_STATUSES = ["created", "recontact", "test"];

/* Canonical page keys → labels the CRM stores (always English, on both language pages) */
const LABELS = {
  procedures: { tummy_tuck: "Tummy tuck", breast_lift: "Breast lift", breast_augmentation: "Breast augmentation", liposuction: "Liposuction", not_sure: "Not sure, surgeon to recommend" },
  timing: { asap: "ASAP", "1_3_months": "1-3 months", "3_6_months": "3-6 months", researching: "Just researching" },
  travel: { miami_south_fl: "In Miami / South FL", florida: "Yes, from elsewhere in Florida", other_state: "Yes, from another state", no: "No" },
  payment_method: { cash: "Cash / savings", financing: "Financing", mix: "A mix", not_sure: "Not sure" },
  smoker: { no: "No", yes: "Yes", yes_would_stop: "Yes, would stop before surgery" },
  credit_range: { "720_plus": "720+", "680_719": "680-719", "620_679": "620-679", below_620: "Below 620", unknown: "Don't know" },
  postpartum_status: { yes: "Yes", not_yet: "Not yet", not_sure: "Not sure" },
  age_18_plus: { yes: "Yes", no: "No" },
};
const LIMITS = { name: 50, last: 50, email: 128, service: 128, procedure_date: 128, can_relocate: 128, procedure_payment: 128,
  age_18_plus: 16, postpartum_status: 32, smoker: 32, credit_range: 32, city: 50, utm_source: 128, utm_medium: 128, utm_campaign: 128, utm_content: 128 };

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true; // keepalive beacons may omit it
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}
const str = (v, max = 500) => String(v ?? "").trim().slice(0, max);
const label = (map, key) => (key in map ? map[key] : str(key, 128)); // unknown key: pass the raw value rather than drop the lead

/** US phone → exactly 10 digits, or "" when it cannot be normalized (CRM rejects anything else). */
export function normalizePhone(v) {
  let d = String(v ?? "").replace(/\D/g, "");
  if (d.length === 11 && d[0] === "1") d = d.slice(1);
  return d.length === 10 ? d : "";
}

/** Page payload (canonical keys) → CRM payload (contract shape). Pure; unit-tested. */
export function mapLead(body, { referral = "30", testMode = false } = {}) {
  const first = str(body.first_name, 200), lastIn = str(body.last_name, 200);
  let name = first, last = lastIn;
  if (!last && first.includes(" ")) { // legacy single-field submissions: split on the first space
    const i = first.indexOf(" "); name = first.slice(0, i); last = first.slice(i + 1).trim();
  }
  const procedures = Array.isArray(body.procedures) ? body.procedures : [];
  const out = {
    name: str(name, LIMITS.name),
    last: str(last, LIMITS.last),
    phone: normalizePhone(body.phone),
    email: str(body.email, LIMITS.email).toLowerCase(),
    language: body.language === "es" ? "es" : "en",
    service: str(procedures.map((k) => label(LABELS.procedures, k)).join(", "), LIMITS.service),
    procedure_date: str(label(LABELS.timing, body.timing), LIMITS.procedure_date),
    can_relocate: str(label(LABELS.travel, body.travel), LIMITS.can_relocate),
    procedure_payment: str(label(LABELS.payment_method, body.payment_method), LIMITS.procedure_payment),
    age_18_plus: str(label(LABELS.age_18_plus, body.age_18_plus), LIMITS.age_18_plus),
    postpartum_status: str(label(LABELS.postpartum_status, body.postpartum_status), LIMITS.postpartum_status),
    smoker: str(label(LABELS.smoker, body.smoker), LIMITS.smoker),
    credit_range: body.credit_range ? str(label(LABELS.credit_range, body.credit_range), LIMITS.credit_range) : "",
    state: str(body.state, 64),
    city: str(body.city, LIMITS.city),
    qualification: ["qualified", "nurture", "not_fit"].includes(body.qualification) ? body.qualification : "nurture", // untranslated, lowercase
    referral: String(referral),
    utm_source: str(body.utm_source, LIMITS.utm_source),
    utm_medium: str(body.utm_medium, LIMITS.utm_medium),
    utm_campaign: str(body.utm_campaign, LIMITS.utm_campaign),
    utm_content: str(body.utm_content, LIMITS.utm_content),
    // Not in the contract's required list; the CRM archives unknown fields in the raw request log. Kept so offline
    // Google Ads conversions stay possible later without a page change.
    gclid: str(body.gclid, 200),
    gbraid: str(body.gbraid, 200),
    wbraid: str(body.wbraid, 200),
  };
  if (testMode) out.test_mode = true;
  return out;
}

async function postWithTimeout(url, init, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...init, signal: ctrl.signal }); } finally { clearTimeout(timer); }
}

async function alert(env, payload) {
  if (!env.LEAD_ALERT_WEBHOOK) return;
  try { await postWithTimeout(env.LEAD_ALERT_WEBHOOK, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }, 8000); }
  catch (e) { console.error("[lead] alert webhook failed", e && e.message); }
}

/** Sends one lead to the CRM and interprets the response. Returns { ok, status, patient_status, errors, log_id, preview? }. */
async function forward(env, lead) {
  const url = env.CRM_WEBHOOK_URL || DEFAULT_ENDPOINT;
  const headers = { "Content-Type": "application/json", "X-API-CLIENT": env.CRM_API_CLIENT || "", "X-API-KEY": env.CRM_API_KEY || "" };
  let res, data = null, text = "";
  try {
    res = await postWithTimeout(url, { method: "POST", headers, body: JSON.stringify(lead) }, CRM_TIMEOUT_MS);
    text = await res.text();
    try { data = JSON.parse(text); } catch { data = null; }
  } catch (e) {
    const timeout = e && e.name === "AbortError";
    const result = { ok: false, status: 0, patient_status: timeout ? "timeout" : "network_error", errors: [String(e && e.message)] };
    console.error("[lead] CRM unreachable", result.patient_status, lead.email);
    await alert(env, { kind: "crm_unreachable", ...result, lead: { email: lead.email, phone: lead.phone, name: lead.name, last: lead.last } });
    return result;
  }
  const d = (data && data.data) || {};
  const patientStatus = d.patient_status || (res.ok ? "unknown" : "http_" + res.status);
  const ok = res.ok && OK_STATUSES.includes(patientStatus);
  const result = { ok, status: res.status, patient_status: patientStatus, errors: d.errors || (res.ok ? [] : [text.slice(0, 300)]), log_id: d.log_id ?? null, patient_id: d.patient_id ?? null };
  if (d.preview) result.preview = d.preview;
  if (!ok) {
    console.error("[lead] CRM rejected", JSON.stringify(result), lead.email);
    await alert(env, { kind: "crm_rejected", ...result, lead: { email: lead.email, phone: lead.phone, name: lead.name, last: lead.last, qualification: lead.qualification } });
  } else {
    console.log("[lead] CRM ok", patientStatus, d.patient_id ?? "", lead.email);
  }
  return result;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!sameOrigin(request)) return json(403, { ok: false, error: "forbidden" });

  let body;
  try { body = await request.json(); } catch { return json(400, { ok: false, error: "bad json" }); }
  if (!body || typeof body !== "object") return json(400, { ok: false, error: "bad json" });

  const testMode = String(env.CRM_TEST_MODE || "").toLowerCase() === "true";
  const lead = mapLead(body, { referral: env.CRM_REFERRAL || "30", testMode });

  if (!lead.email || !lead.phone) {
    // The page validates both; reaching here means a tampered or legacy request. The CRM would reject it anyway.
    return json(400, { ok: false, error: "valid email and 10-digit US phone required" });
  }
  if (!env.CRM_API_CLIENT || !env.CRM_API_KEY) {
    console.warn("[lead] CRM credentials not configured; lead not forwarded", lead.email);
    await alert(env, { kind: "not_configured", lead: { email: lead.email, phone: lead.phone, name: lead.name, last: lead.last } });
    return json(200, { ok: false, forwarded: false, reason: "CRM credentials not configured" });
  }

  if (testMode) {
    // Synchronous so the CRM's preview block can be inspected while validating the integration.
    const result = await forward(env, lead);
    return json(200, { ok: result.ok, forwarded: true, test_mode: true, sent: lead, crm: result });
  }
  // Production: acknowledge immediately, deliver in the background (up to 30 s), never block the thank-you redirect.
  context.waitUntil(forward(env, lead));
  return json(202, { ok: true, queued: true });
}

export function onRequest({ request }) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  return json(405, { ok: false, error: "method not allowed" });
}
