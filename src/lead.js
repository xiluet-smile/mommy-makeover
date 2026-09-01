/**
 * POST /api/lead · handled by the Worker in src/worker.js
 *
 * Proxies quiz submissions to the CRM so the webhook URL (and any secret) never ships to the browser.
 *
 * Env vars (Cloudflare → Workers & Pages → mommy-makeover → Settings → Variables and Secrets):
 *   CRM_WEBHOOK_URL         required · custom CRM endpoint that accepts the JSON lead POST
 *   CRM_PHOTOS_WEBHOOK_URL  optional · multipart target for the photo uploader (defaults to CRM_WEBHOOK_URL)
 *   CRM_WEBHOOK_SECRET      optional · sent as `X-Webhook-Secret` header to the CRM
 *   CRM_AUTH_HEADER         optional · full header for the CRM's auth scheme, e.g. "Authorization: Bearer <token>"
 *                                      or "X-API-Key: <key>" (sent on every forward)
 *
 * Accepts:
 *   application/json   → the lead payload built by site/assets/app.js (field allowlist below)
 *   multipart/form-data → photo_front/left/right/back + first_name, phone, email (uploader)
 */

const LEAD_FIELDS = [
  "first_name", "phone", "email", "whatsapp_ok", "language", "procedures", "timing", "travel",
  "age_18_plus", "postpartum_status", "smoker", "height", "weight", "payment_method", "credit_range",
  "state", "city", "qualification", "source", "campaign_name", "utm_source", "utm_medium", "utm_campaign",
  "utm_content", "utm_term", "gclid", "fbclid", "fbp", "fbc", "landing_url", "event_source_url", "submitted_at",
];
const MAX_PHOTO_BYTES = 12 * 1024 * 1024; // per file
const PHOTO_FIELDS = ["photo_front", "photo_left", "photo_right", "photo_back"];

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true; // non-browser clients (keepalive beacons may omit it)
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

function clean(v, max = 500) {
  if (Array.isArray(v)) return v.slice(0, 10).map((x) => clean(x, 60));
  if (typeof v === "boolean") return v;
  return String(v ?? "").slice(0, max).trim();
}

export async function handleLead(request, env) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (request.method !== "POST") return json(405, { ok: false, error: "method not allowed" });
  if (!sameOrigin(request)) return json(403, { ok: false, error: "forbidden" });

  const target = env.CRM_WEBHOOK_URL;
  const ct = request.headers.get("Content-Type") || "";
  const extra = {};
  if (env.CRM_WEBHOOK_SECRET) extra["X-Webhook-Secret"] = env.CRM_WEBHOOK_SECRET;
  if (env.CRM_AUTH_HEADER && env.CRM_AUTH_HEADER.includes(":")) {
    const i = env.CRM_AUTH_HEADER.indexOf(":");
    extra[env.CRM_AUTH_HEADER.slice(0, i).trim()] = env.CRM_AUTH_HEADER.slice(i + 1).trim();
  }

  /* ---- photo uploader (multipart) ---- */
  if (ct.includes("multipart/form-data")) {
    let form;
    try { form = await request.formData(); } catch { return json(400, { ok: false, error: "bad multipart" }); }
    const out = new FormData();
    let files = 0;
    for (const k of PHOTO_FIELDS) {
      const f = form.get(k);
      if (f && typeof f === "object" && f.size > 0) {
        if (f.size > MAX_PHOTO_BYTES) return json(413, { ok: false, error: `${k} too large` });
        if (!/^image\//.test(f.type || "")) return json(415, { ok: false, error: `${k} must be an image` });
        out.append(k, f, f.name || `${k}.jpg`); files++;
      }
    }
    if (!files) return json(400, { ok: false, error: "no photos" });
    for (const k of ["first_name", "phone", "email", "language"]) out.append(k, clean(form.get(k), 200));
    out.append("type", "photos");
    out.append("source", "google_lp_mommy_makeover");
    out.append("submitted_at", new Date().toISOString());
    const photoTarget = env.CRM_PHOTOS_WEBHOOK_URL || target;
    if (!photoTarget) return json(200, { ok: false, forwarded: false, reason: "CRM_WEBHOOK_URL not configured" });
    try {
      const r = await fetch(photoTarget, { method: "POST", headers: extra, body: out });
      return json(r.ok ? 200 : 502, { ok: r.ok, forwarded: true, status: r.status });
    } catch (e) {
      return json(502, { ok: false, forwarded: false, error: "upstream unreachable" });
    }
  }

  /* ---- lead (JSON) ---- */
  let body;
  try { body = await request.json(); } catch { return json(400, { ok: false, error: "bad json" }); }
  if (!body || typeof body !== "object") return json(400, { ok: false, error: "bad json" });
  if (!clean(body.phone) && !clean(body.email)) return json(400, { ok: false, error: "phone or email required" });

  const lead = {};
  for (const k of LEAD_FIELDS) lead[k] = k in body ? clean(body[k]) : (k === "procedures" ? [] : "");
  lead.whatsapp_ok = true;
  lead.source = "google_lp_mommy_makeover";
  lead.language = lead.language === "es" ? "es" : "en";
  if (!["qualified", "nurture", "not_fit"].includes(lead.qualification)) lead.qualification = "nurture";
  if (!lead.campaign_name) lead.campaign_name = lead.utm_campaign || "google-lp-mm";
  if (!lead.submitted_at) lead.submitted_at = new Date().toISOString();

  if (!target) {
    console.warn("[lead] CRM_WEBHOOK_URL not configured; lead not forwarded", lead.email);
    return json(200, { ok: false, forwarded: false, reason: "CRM_WEBHOOK_URL not configured" });
  }
  try {
    const r = await fetch(target, { method: "POST", headers: { "Content-Type": "application/json", ...extra }, body: JSON.stringify(lead) });
    if (!r.ok) console.warn("[lead] CRM responded", r.status);
    return json(r.ok ? 200 : 502, { ok: r.ok, forwarded: true, status: r.status });
  } catch (e) {
    console.error("[lead] upstream error", e && e.message);
    return json(502, { ok: false, forwarded: false, error: "upstream unreachable" });
  }
}
