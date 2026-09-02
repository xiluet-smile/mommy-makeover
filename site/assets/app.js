/* Xiluet Aesthetic Surgery · Mommy Makeover LP · page JS (quiz, stories, FAQ, header, tracking)
   Shared by / and /es/. Per-language strings come from <script id="mm-i18n" type="application/json">,
   integration values from window.MM_CONFIG (both emitted by scripts/build.js — edit CONFIG there). */
(function () {
  "use strict";

  /* ═══════════════════════════════ CONFIG ═══════════════════════════════ */
  var CONFIG = Object.assign({
    LEAD_ENDPOINT: "/api/lead",        // Pages Function that forwards to the CRM (secret stays server-side)
    CRM_WEBHOOK_URL: "",               // not used by the browser; set CRM_WEBHOOK_URL in Cloudflare Pages env vars
    GTM_ID: "",
    META_PIXEL_ID: "",
    WHATSAPP_NUMBER: "13056154200",
    PHONE: "(305) 615-4200",
    DEPOSIT_AMOUNT: "$250",
    REVIEW_COUNT: "",
    SOURCE: "google_lp_mommy_makeover",
    CAMPAIGN_FALLBACK: "google-lp-mm"
  }, window.MM_CONFIG || {});
  /* ═════════════════════════════════════════════════════════════════════ */

  var I18N = JSON.parse(document.getElementById("mm-i18n").textContent);
  var LANG = document.documentElement.lang === "es" ? "es" : "en";
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var t = function (s, vars) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return vars && k in vars ? vars[k] : ""; }); };

  /* ---------- tracking helpers ---------- */
  window.dataLayer = window.dataLayer || [];
  function track(event, data) { var o = Object.assign({ event: event }, data || {}); window.dataLayer.push(o); }

  /* UTM / gclid / fbclid: captured on load, kept in sessionStorage, sent in the POST body only. Never written to the URL. */
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];
  var utm = {};
  (function captureUtm() {
    var params = new URLSearchParams(location.search);
    UTM_KEYS.forEach(function (k) {
      var v = params.get(k) || "";
      var stored = "";
      try { if (v) sessionStorage.setItem("mm_" + k, v); stored = sessionStorage.getItem("mm_" + k) || ""; } catch (e) { /* storage blocked */ }
      utm[k] = v || stored || "";
    });
    try { if (!sessionStorage.getItem("mm_landing_url")) sessionStorage.setItem("mm_landing_url", location.href); } catch (e) { /* ignore */ }
  })();
  function landingUrl() { try { return sessionStorage.getItem("mm_landing_url") || location.href; } catch (e) { return location.href; } }
  function cookie(name) { var m = document.cookie.match("(?:^|; )" + name + "=([^;]*)"); return m ? decodeURIComponent(m[1]) : ""; }
  function metaIds() { /* read at submit time: the pixel can set _fbc/_fbp after page load */
    var fbclid = utm.fbclid || "", fbp = cookie("_fbp"), fbc = cookie("_fbc");
    if (!fbc && fbclid) fbc = "fb.1." + Date.now() + "." + fbclid;
    return { fbclid: fbclid, fbp: fbp, fbc: fbc };
  }

  /* ---------- quiz icons (48×48, gold stroke) keyed by canonical option value ---------- */
  var ICONS = {
    tummy_tuck: ["M14 10c-2 8-2 20 0 28", "M34 10c2 8 2 20 0 28", "M14 24h20", "M20 30h8"],
    breast_lift: ["M24 38V14", "M16 22l8-8 8 8", "M12 40h24"],
    breast_augmentation: ["M14 28a8 8 0 1016 0 8 8 0 10-16 0z", "M34 20v10M29 25h10"],
    liposuction: ["M18 8v14a6 6 0 1012 0V8", "M16 36c0-4 4-6 8-6s8 2 8 6"],
    not_sure: ["M24 34v1", "M18 18a6 6 0 1112 0c0 4-6 5-6 9", "M24 6a18 18 0 100 36 18 18 0 100-36z"],
    asap: ["M24 8a16 16 0 100 32 16 16 0 100-32z", "M24 14v10l7 4"],
    "1_3_months": ["M8 14h32v26H8z", "M8 22h32", "M16 8v10M32 8v10"],
    "3_6_months": ["M8 14h32v26H8z", "M8 22h32", "M16 8v10M32 8v10", "M16 30h6M26 30h6"],
    researching: ["M20 8a12 12 0 100 24 12 12 0 100-24z", "M29 29l11 11"],
    miami_south_fl: ["M24 42s-12-12-12-22a12 12 0 0124 0c0 10-12 22-12 22z", "M24 16a4 4 0 100 8 4 4 0 100-8z"],
    florida: ["M8 38c8-2 14-6 16-12s4-10 12-14", "M30 12l6-2-2 6"],
    other_state: ["M6 30l14-6 10-14 4 2-6 14 12 6-2 3-14-3-8 7-3-1 3-9-9-3z"],
    no: ["M24 8a16 16 0 100 32 16 16 0 100-32z", "M14 14l20 20"],
    yes: ["M24 8a16 16 0 100 32 16 16 0 100-32z", "M16 24l6 6 10-12"],
    not_yet: ["M24 8a16 16 0 100 32 16 16 0 100-32z", "M20 18v12M28 18v12"],
    yes_would_stop: ["M8 30h24v6H8z", "M32 30h6v6h-6z", "M20 24c0-4 4-4 4-8", "M10 40L38 12"],
    cash: ["M6 14h36v20H6z", "M24 18a6 6 0 100 12 6 6 0 100-12z", "M11 19h2M35 29h2"],
    financing: ["M8 12h32v24H8z", "M8 20h32", "M14 30h8"],
    mix: ["M8 24a16 16 0 0132 0", "M8 24a16 16 0 0032 0", "M24 8v32"],
    "720_plus": ["M24 6l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z"],
    "680_719": ["M24 6l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z", "M24 6v34"],
    "620_679": ["M8 34a16 16 0 0132 0", "M24 34V22", "M8 34h32"],
    below_620: ["M8 30a16 16 0 0132 0", "M14 30l10-10", "M8 30h32"],
    unknown: ["M24 34v1", "M18 18a6 6 0 1112 0c0 4-6 5-6 9", "M24 6a18 18 0 100 36 18 18 0 100-36z"]
  };
  /* "smoke: no" shares the circle-X, "smoke: yes" is a plain circle-check in the prototype; keep parity. */
  var SILHOUETTES = {
    front: ["M28 8a5 5 0 100 10 5 5 0 100-10z", "M22 20c-4 1-6 4-6 8v10c0 3 1 5 3 7l2 22h4l2-18h2l2 18h4l2-22c2-2 3-4 3-7V28c0-4-2-7-6-8z", "M16 26l-3 14M40 26l3 14"],
    left: ["M28 8a5 5 0 100 10 5 5 0 100-10z", "M26 20c-3 2-4 5-4 9 0 5 3 8 3 12l-2 24h6l2-22c3-3 4-7 3-12-1-6-3-9-8-11z", "M24 24l-2 16"],
    right: ["M28 8a5 5 0 100 10 5 5 0 100-10z", "M30 20c3 2 4 5 4 9 0 5-3 8-3 12l2 24h-6l-2-22c-3-3-4-7-3-12 1-6 3-9 8-11z", "M32 24l2 16"],
    back: ["M28 8a5 5 0 100 10 5 5 0 100-10z", "M22 20c-4 1-6 4-6 8v10c0 3 1 5 3 7l2 22h4l2-18h2l2 18h4l2-22c2-2 3-4 3-7V28c0-4-2-7-6-8z", "M28 26v14", "M16 26l-3 14M40 26l3 14"]
  };
  function svg(paths, viewBox, sw) {
    return '<svg viewBox="' + (viewBox || "0 0 48 48") + '" fill="none" stroke="#c8a465" stroke-width="' + (sw || 1.4) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      paths.map(function (d) { return '<path d="' + d + '"/>'; }).join("") + "</svg>";
  }

  var STATES = ["Florida", "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming", "Puerto Rico"];

  /* ═══════════════════════════════ QUIZ ═══════════════════════════════ */
  var Q = I18N.quiz;
  var quizEl = $("#quiz");
  var IS_TY = document.body.getAttribute("data-page") === "thankyou";
  var HOME = LANG === "es" ? "/es/" : "/";
  var TY_URL = LANG === "es" ? "/es/gracias/" : "/thank-you/";
  var state, started = false;

  function freshState() {
    return { step: 0, answers: {}, outcome: null, submitting: false, error: "",
      form: { state: "Florida", city: "", name: "", phone: "", email: "" },
      uploaderOpen: false, photos: [null, null, null, null], photosSubmitted: false, photosError: "", photosSending: false };
  }
  state = freshState();

  function visibleSteps() {
    return Q.steps.filter(function (s) { return !s.showIfPay || s.showIfPay.indexOf(state.answers.pay) !== -1; });
  }
  function qualify() {
    var a = state.answers;
    if (a.age === "no" || a.travel === "no") return "not_fit";
    if (a.timing === "researching" || a.credit === "below_620" || a.postpartum === "not_yet") return "nurture";
    return "qualified";
  }
  function markStarted() { if (!started) { started = true; track("quiz_start"); } }
  function scrollToQuiz() {
    var top = quizEl.getBoundingClientRect().top + window.pageYOffset - 90;
    window.scrollTo({ top: top, behavior: "smooth" });
  }
  function displayName() { return (state.form.name || "").trim() || Q.nameFallback; }
  function waLink(msg) { return "https://wa.me/" + CONFIG.WHATSAPP_NUMBER + "?text=" + encodeURIComponent(t(msg, { name: displayName() })); }
  function phoneLink() { return "tel:" + String(CONFIG.PHONE).replace(/[^\d+]/g, ""); }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
  function validPhone(v) { return (v.match(/\d/g) || []).length >= 7; }
  function canContinue(cur) {
    if (cur.multi) return (state.answers[cur.id] || []).length > 0;
    if (cur.type === "location") return true;
    if (cur.type === "contact") return state.form.name.trim().length > 1 && validPhone(state.form.phone) && validEmail(state.form.email.trim());
    return true;
  }

  function advance() {
    var steps = visibleSteps(), cur = steps[state.step], a = state.answers;
    if ((cur.id === "travel" && a.travel === "no") || (cur.id === "age" && a.age === "no")) {
      state.outcome = "not_fit"; state.notFitReason = cur.id; render(); return;
    }
    if (state.step + 1 >= steps.length) { submitLead(); return; }
    state.step += 1;
    track("quiz_step_" + (state.step + 1));
    render();
  }

  function buildPayload(qualification) {
    var a = state.answers, f = state.form, m = metaIds();
    return {
      first_name: f.name.trim(),
      phone: f.phone.trim(),
      email: f.email.trim(),
      whatsapp_ok: true,
      language: LANG,
      procedures: a.procedures || [],
      timing: a.timing || "",
      travel: a.travel || "",
      age_18_plus: a.age || "",
      postpartum_status: a.postpartum || "",
      smoker: a.smoke || "",
      height: "",
      weight: "",
      payment_method: a.pay || "",
      credit_range: a.credit || "",
      state: f.state,
      city: f.city.trim(),
      qualification: qualification,
      source: CONFIG.SOURCE,
      campaign_name: utm.utm_campaign || CONFIG.CAMPAIGN_FALLBACK,
      utm_source: utm.utm_source, utm_medium: utm.utm_medium, utm_campaign: utm.utm_campaign, utm_content: utm.utm_content, utm_term: utm.utm_term,
      gclid: utm.gclid, fbclid: m.fbclid, fbp: m.fbp, fbc: m.fbc,
      landing_url: landingUrl(),
      event_source_url: location.href,
      submitted_at: new Date().toISOString()
    };
  }

  function postWithTimeout(url, opts, ms) {
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, ms);
    if (ctrl) opts.signal = ctrl.signal;
    return fetch(url, opts).then(function (r) { clearTimeout(timer); return r; }, function (e) { clearTimeout(timer); throw e; });
  }

  function submitLead() {
    if (state.submitting) return;
    var qualification = qualify();
    state.submitting = true; state.error = ""; render();
    var payload = buildPayload(qualification);
    postWithTimeout(CONFIG.LEAD_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true }, 8000)
      .then(function (r) { if (!r.ok) console.warn("[lead] CRM proxy returned", r.status); })
      .catch(function (e) { console.warn("[lead] CRM proxy unreachable", e && e.message); })
      .then(function () {
        var lead = { outcome: qualification, name: state.form.name.trim(), phone: state.form.phone.trim(), email: state.form.email.trim(), lang: LANG, ts: Date.now() };
        try { sessionStorage.setItem("mm_lead", JSON.stringify(lead)); sessionStorage.removeItem("mm_lead_tracked"); } catch (e) { /* storage blocked: thank-you page renders the generic version */ }
        location.assign(TY_URL);
      });
  }

  function submitPhotos() {
    var files = state.photos.filter(Boolean);
    if (!files.length || state.photosSending) return;
    state.photosSending = true; state.photosError = ""; render();
    var fd = new FormData();
    var keys = ["photo_front", "photo_left", "photo_right", "photo_back"];
    state.photos.forEach(function (p, i) { if (p) fd.append(keys[i], p.file, p.file.name || keys[i] + ".jpg"); });
    fd.append("type", "photos"); fd.append("first_name", state.form.name.trim()); fd.append("phone", state.form.phone.trim()); fd.append("email", state.form.email.trim()); fd.append("language", LANG);
    postWithTimeout(CONFIG.LEAD_ENDPOINT, { method: "POST", body: fd }, 60000)
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json().catch(function () { return {}; }); })
      .then(function () { state.photosSending = false; state.photosSubmitted = true; track("photos_sent"); render(); })
      .catch(function (e) { console.warn("[photos]", e && e.message); state.photosSending = false; state.photosError = Q.qualified.uploadError; render(); });
  }

  /* ---------- render ---------- */
  function render() {
    var html = "";
    var steps = visibleSteps(), cur = steps[Math.min(state.step, steps.length - 1)];
    var inQuestions = !state.outcome;
    var showBack = inQuestions && state.step > 0 && !state.submitting;
    html += '<div class="q-top">' + (IS_TY ? '<a class="q-back" href="' + HOME + '">' + esc(Q.backHome) + "</a>" : showBack ? '<button type="button" class="q-back" data-act="back">' + esc(Q.back) + "</button>" : "<span></span>") + '<span class="q-badge">' + esc(Q.badge) + "</span></div>";

    if (inQuestions) {
      /* progress */
      html += '<div class="q-progress" aria-hidden="true">';
      for (var n = 1; n <= 8; n++) {
        var done = n < cur.q, now = n === cur.q;
        html += '<span class="q-mk' + (done || now ? " on" : "") + (done ? " done" : "") + '"><span class="sym">' + (done || now ? "◆" : "◇") + "</span>" + (n < 8 ? '<span class="line"></span>' : "") + "</span>";
      }
      html += "</div>";
      html += '<div class="q-head"><span class="q-eyebrow">' + esc(t(Q.questionOf, { n: cur.q })) + '</span><h2 class="q-title">' + esc(cur.title) + "</h2>" + (cur.hint ? '<p class="q-hint">' + esc(cur.hint) + "</p>" : "") + "</div>";

      if (cur.options) {
        var sel = state.answers[cur.id];
        html += '<div class="q-options" role="group">';
        cur.options.forEach(function (o) {
          var label = o[0], value = o[1];
          var on = cur.multi ? (sel || []).indexOf(value) !== -1 : sel === value;
          var iconKey = cur.id === "smoke" && value === "yes" ? "yes" : value;
          html += '<button type="button" class="q-opt' + (on ? " on" : "") + '" data-act="pick" data-value="' + esc(value) + '" aria-pressed="' + (on ? "true" : "false") + '">' +
            '<span class="q-icon">' + svg(ICONS[iconKey] || ICONS.unknown) + '</span><span class="q-opt-label">' + esc(label) + '</span><span class="q-check">' + (on ? "✓" : "") + "</span></button>";
        });
        html += "</div>";
      } else if (cur.type === "location") {
        html += '<div class="q-row"><label class="q-label">' + esc(Q.stateLabel) + '<select class="q-input" data-field="state">' +
          STATES.concat([Q.outsideUS]).map(function (s) { return '<option value="' + esc(s) + '"' + (s === state.form.state ? " selected" : "") + ">" + esc(s) + "</option>"; }).join("") +
          '</select></label><label class="q-label">' + esc(Q.cityLabel) + '<input class="q-input" type="text" data-field="city" autocomplete="address-level2" placeholder="' + esc(Q.cityPlaceholder) + '" value="' + esc(state.form.city) + '"></label></div>';
      } else if (cur.type === "contact") {
        html += '<div class="q-fields"><div class="q-row">' +
          '<label class="q-label">' + esc(Q.nameLabel) + '<input class="q-input" type="text" data-field="name" autocomplete="name" value="' + esc(state.form.name) + '"></label>' +
          '<label class="q-label">' + esc(Q.phoneLabel) + '<input class="q-input" type="tel" data-field="phone" autocomplete="tel" inputmode="tel" placeholder="' + esc(Q.phonePlaceholder) + '" value="' + esc(state.form.phone) + '"></label></div>' +
          '<div class="q-row"><label class="q-label">' + esc(Q.emailLabel) + '<input class="q-input" type="email" data-field="email" autocomplete="email" inputmode="email" value="' + esc(state.form.email) + '"></label></div>' +
          '<p class="q-consent">' + esc(Q.consent) + "</p></div>";
      }
      if (cur.multi || cur.type) {
        var ok = canContinue(cur);
        var label = cur.type === "contact" ? (state.submitting ? Q.sending : Q.submitLabel) : Q.continueLabel;
        html += '<button type="button" class="btn-grad" data-act="next"' + (ok && !state.submitting ? "" : " disabled") + ">" + esc(label) + "</button>";
      }
    } else if (state.outcome === "qualified") {
      var K = Q.qualified, kinds = ["front", "left", "right", "back"];
      html += '<div class="ty"><div class="ty-head"><span class="ty-badge">✓</span><h2 class="ty-title">' + esc(t(K.title, { name: displayName() })) + '</h2><p class="ty-text">' + esc(K.text) + "</p></div>";
      html += '<div class="sil-grid">' + K.silhouettes.map(function (lbl, i) { return '<div class="sil"><span class="icon">' + svg(SILHOUETTES[kinds[i]], "0 0 56 76", 1.3) + "</span><span>" + esc(lbl) + "</span></div>"; }).join("") + "</div>";
      html += '<p class="ty-privacy">' + esc(K.privacy) + "</p>";
      html += '<div class="ty-actions"><a class="btn-grad btn-grad--lg" data-act="wa" href="' + esc(waLink(K.waMessage)) + '" target="_blank" rel="noopener">' + esc(K.waButton) + '</a><button type="button" class="btn-ghost" data-act="uploader">' + esc(K.uploadToggle) + "</button></div>";
      if (state.uploaderOpen) {
        if (!state.photosSubmitted) {
          html += '<div class="uploader"><div class="up-grid">' + K.uploadSlots.map(function (lbl, i) {
            var p = state.photos[i];
            return '<label class="up-slot">' + (p ? '<img src="' + p.src + '" alt="">' : "<span>+ " + esc(lbl) + "</span>") + '<input type="file" accept="image/*" data-slot="' + i + '"></label>';
          }).join("") + "</div>" +
            (state.photosError ? '<p class="q-error">' + esc(state.photosError) + "</p>" : "") +
            '<button type="button" class="up-submit" data-act="photos"' + (state.photos.some(Boolean) && !state.photosSending ? "" : " disabled") + ">" + esc(state.photosSending ? Q.sending : K.uploadSubmit) + "</button></div>";
        } else {
          html += '<div class="up-ok"><span class="dot">✓</span><p>' + esc(K.uploadSuccess) + "</p></div>";
        }
      }
      html += '<div class="next"><span class="next-label">' + esc(K.nextLabel) + '</span><div class="next-steps">' + K.nextSteps.map(esc).join('<span class="arrow">→</span>') + "</div>" +
        '<p class="call">' + esc(K.call) + ' <a href="' + phoneLink() + '">' + esc(CONFIG.PHONE) + "</a></p></div></div>";
    } else if (state.outcome === "nurture") {
      var N = Q.nurture;
      html += '<div class="ty"><div class="ty-head"><span class="ty-badge">✓</span><h2 class="ty-title">' + esc(t(N.title, { name: displayName() })) + '</h2><p class="ty-text">' + esc(N.text) + "</p></div>" +
        '<a class="btn-grad btn-grad--lg" data-act="wa" href="' + esc(waLink(N.waMessage)) + '" target="_blank" rel="noopener">' + esc(N.waButton) + "</a>" +
        '<p class="call">' + esc(N.call) + ' <a href="' + phoneLink() + '">' + esc(CONFIG.PHONE) + "</a></p></div>";
    } else if (state.outcome === "not_fit") {
      var F = Q.notFit;
      var reason = state.notFitReason === "travel" || (state.answers.travel === "no" && state.answers.age !== "no") ? F.travel : F.age;
      html += '<div class="ty" style="gap:22px"><span class="ty-dia">◇</span><h2 class="ty-title">' + esc(F.title) + '</h2><p class="ty-text">' + esc(reason) + "</p>" +
        '<div class="nf-actions"><a class="btn-pill-outline" data-act="wa" href="' + esc(waLink(F.waMessage)) + '" target="_blank" rel="noopener">' + esc(F.waButton) + '</a><button type="button" class="btn-text" data-act="reset">' + esc(F.restart) + "</button></div></div>";
    }
    quizEl.innerHTML = html;
  }

  /* ---------- events (delegated) ---------- */
  quizEl.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]"); if (!el || !quizEl.contains(el)) return;
    var act = el.getAttribute("data-act");
    if (act === "pick") {
      markStarted();
      var steps = visibleSteps(), cur = steps[state.step], v = el.getAttribute("data-value");
      if (cur.multi) {
        var arr = (state.answers[cur.id] || []).slice(), i = arr.indexOf(v);
        if (i === -1) arr.push(v); else arr.splice(i, 1);
        state.answers[cur.id] = arr; render();
      } else {
        state.answers[cur.id] = v; render();
        setTimeout(advance, 220);
      }
    } else if (act === "next") {
      var s2 = visibleSteps(), c2 = s2[state.step];
      if (canContinue(c2)) { markStarted(); advance(); }
    } else if (act === "back") {
      state.step = Math.max(0, state.step - 1); render();
    } else if (act === "reset") {
      if (IS_TY) { location.assign(HOME); return; }
      state = freshState(); render(); scrollToQuiz();
    } else if (act === "uploader") {
      state.uploaderOpen = !state.uploaderOpen; render();
    } else if (act === "photos") {
      submitPhotos();
    } else if (act === "wa") {
      track("whatsapp_click", { placement: "quiz_" + state.outcome });
    }
  });
  quizEl.addEventListener("input", function (e) {
    var f = e.target.getAttribute && e.target.getAttribute("data-field"); if (!f) return;
    state.form[f] = e.target.value;
    var btn = $('[data-act="next"]', quizEl); if (btn) btn.disabled = !canContinue(visibleSteps()[state.step]);
  });
  quizEl.addEventListener("change", function (e) {
    var slot = e.target.getAttribute && e.target.getAttribute("data-slot");
    if (slot == null) { if (e.target.getAttribute && e.target.getAttribute("data-field") === "state") state.form.state = e.target.value; return; }
    var file = e.target.files && e.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function () { state.photos[+slot] = { file: file, src: reader.result }; render(); };
    reader.readAsDataURL(file);
  });
  quizEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.matches && e.target.matches("input.q-input")) {
      var btn = $('[data-act="next"]', quizEl); if (btn && !btn.disabled) { e.preventDefault(); btn.click(); }
    }
  });
  if (IS_TY) {
    var lead = {};
    try { lead = JSON.parse(sessionStorage.getItem("mm_lead") || "{}") || {}; } catch (e) { /* ignore */ }
    state.outcome = lead.outcome === "qualified" ? "qualified" : "nurture";
    state.form.name = lead.name || ""; state.form.phone = lead.phone || ""; state.form.email = lead.email || "";
    var tracked = false; try { tracked = !!sessionStorage.getItem("mm_lead_tracked"); } catch (e) { /* ignore */ }
    if (lead.outcome && !tracked) {
      track("quiz_complete", { qualification: lead.outcome, language: LANG });
      if (lead.outcome === "qualified") track("qualified_lead", { language: LANG });
      try { sessionStorage.setItem("mm_lead_tracked", "1"); } catch (e) { /* ignore */ }
    }
  }
  render();

  /* CTAs → quiz: fire quiz_start on first click */
  $$('a[href="#quiz"]').forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); markStarted(); scrollToQuiz(); try { history.replaceState(null, "", "#quiz"); } catch (err) { /* ignore */ } });
  });
  if (location.hash === "#quiz") setTimeout(scrollToQuiz, 50);
  $$("a[data-wa]").forEach(function (a) { a.addEventListener("click", function () { track("whatsapp_click", { placement: a.getAttribute("data-wa") }); }); });

  /* ═══════════════════════════ header CTA (mobile) ═══════════════════════════ */
  var hero = $(".hero");
  function onScroll() {
    var past = hero ? window.pageYOffset > hero.offsetTop + hero.offsetHeight - 80 : true;
    document.body.classList.toggle("past-hero", past);
  }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ═══════════════════════════ stories (videos) ═══════════════════════════ */
  var players = $$(".story-video");
  players.forEach(function (box) {
    var v = $("video", box);
    box.addEventListener("click", function () {
      if (v.paused) {
        players.forEach(function (o) { if (o !== box) { var ov = $("video", o); ov.pause(); ov.currentTime = 0; o.classList.remove("playing"); } });
        v.muted = false; v.play().then(function () { box.classList.add("playing"); track("story_play", { index: players.indexOf(box) + 1 }); }).catch(function () { v.muted = true; v.play(); box.classList.add("playing"); });
      } else { v.pause(); box.classList.remove("playing"); }
    });
    v.addEventListener("ended", function () { box.classList.remove("playing"); v.currentTime = 0; });
    v.addEventListener("pause", function () { box.classList.remove("playing"); });
  });

  /* ═══════════════════════════ FAQ accordion ═══════════════════════════ */
  var faqItems = $$(".faq-item");
  faqItems.forEach(function (item) {
    var btn = $(".faq-q", item);
    btn.addEventListener("click", function () {
      var open = item.classList.contains("open");
      faqItems.forEach(function (o) { o.classList.remove("open"); $(".faq-q", o).setAttribute("aria-expanded", "false"); $(".faq-sign", o).textContent = "+"; });
      if (!open) { item.classList.add("open"); btn.setAttribute("aria-expanded", "true"); $(".faq-sign", item).textContent = "–"; }
    });
  });
})();
