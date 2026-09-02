#!/usr/bin/env node
/**
 * Emits site/index.html (EN) and site/es/index.html (ES) from content/{en,es}.js.
 * No dependencies. Run: `node scripts/build.js`. Output is committed; Cloudflare Pages needs no build command.
 */
const fs = require("fs");
const path = require("path");

/* ═══════════════════════════════ CONFIG ═══════════════════════════════ */
const SITE_URL = "https://promo.xiluetaestheticsurgery.com"; // canonical + hreflang + OG
const CONFIG = {
  GOOGLE_ADS_ID: "AW-11505059358",   // Google tag (gtag.js): Ads conversion account, first thing in <head> on every page
  GA4_ID: "G-K59E90DQD0",            // GA4 property configured through the same tag
  GOOGLE_ADS_CONVERSION_LABEL: "HytJCO7F-ewcEJ6Mhe4q", // "MM Quiz Lead (promo)" conversion action
  LEAD_ENDPOINT: "/api/lead",   // Pages Function; the CRM webhook URL is set as env var CRM_WEBHOOK_URL in Cloudflare (never in the client)
  GTM_ID: "",                   // e.g. "GTM-XXXXXXX" → injects the GTM container in <head> + <noscript>
  META_PIXEL_ID: "",            // e.g. "1234567890" → injects the Meta Pixel base code (PageView only)
  WHATSAPP_NUMBER: "13056154200",
  PHONE: "(305) 615-4200",
  DEPOSIT_AMOUNT: "$250",
  REVIEW_COUNT: "",
  SOURCE: "google_lp_mommy_makeover",
  CAMPAIGN_FALLBACK: "google-lp-mm",
};
const LINKS = {
  privacy: "https://xiluetaestheticsurgery.com/privacy-policy/",
  terms: "https://xiluetaestheticsurgery.com/terms-and-conditions/",
  map: "https://maps.google.com/maps?q=7390+W+Flagler+St+Miami+FL+33144&t=&z=15&ie=UTF8&iwloc=B&output=embed",
  verify: Array(4).fill("https://mqa-internet.doh.state.fl.us/MQASearchServices/HealthCareProviders"), // Florida DOH license lookup (replace with per-surgeon profile URLs when the client supplies them)
};
/* ═════════════════════════════════════════════════════════════════════ */

// Cache-busting version for CSS/JS links: content hash of the two files (changes only when they change)
const crypto = require("crypto");
const ASSET_V = crypto.createHash("md5")
  .update(fs.readFileSync(path.join(__dirname, "../site/assets/style.css")))
  .update(fs.readFileSync(path.join(__dirname, "../site/assets/app.js")))
  .digest("hex").slice(0, 8);

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const svg = (paths, vb = "0 0 48 48", sw = 1.4) =>
  `<svg viewBox="${vb}" fill="none" stroke="#c8a465" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths.map((d) => `<path d="${d}"/>`).join("")}</svg>`;
const wa = (msg) => `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
const tel = `tel:${CONFIG.PHONE.replace(/[^\d+]/g, "")}`;

const ICON = {
  eval: ["M10 10h28v28H10z", "M16 20h16M16 26h10", "M30 30l3 3 6-6"],
  finance: ["M6 14h36v20H6z", "M24 18a6 6 0 100 12 6 6 0 100-12z", "M11 19h2M35 29h2"],
  board: ["M24 6l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z"],
  tummy: ["M14 10c-2 8-2 20 0 28", "M34 10c2 8 2 20 0 28", "M14 24h20", "M20 30h8"],
  lift: ["M24 38V14", "M16 22l8-8 8 8", "M12 40h24"],
  aug: ["M14 28a8 8 0 1016 0 8 8 0 10-16 0z", "M34 20v10M29 25h10"],
  lipo: ["M18 8v14a6 6 0 1012 0V8", "M16 36c0-4 4-6 8-6s8 2 8 6"],
  phases: [
    ["M8 30h26l4-10H14z", "M8 30v8M34 30v8", "M14 20V12h10", "M38 20l-4 10"],
    ["M24 8a3 3 0 100 6 3 3 0 100-6z", "M24 14v10l-5 14M24 24l5 14", "M24 17l-7 4M24 17l7 6", "M10 40h28"],
    ["M20 10a3 3 0 100 6 3 3 0 100-6z", "M20 16v12l-4 12M20 28l4 12", "M20 19l-6 3M20 19l7-2", "M31 12a2.5 2.5 0 100 5 2.5 2.5 0 100-5z", "M31 17v7l-3 4M31 24l3 4", "M27 17l4 3"],
    ["M6 36c6-4 12-4 18 0s12 4 18 0", "M24 8a8 8 0 100 16 8 8 0 100-16z", "M24 4v2M24 26v2M10 16h2M36 16h2"],
  ],
  travel: [
    ["M6 30l14-6 10-14 4 2-6 14 12 6-2 3-14-3-8 7-3-1 3-9-9-3z"],
    ["M8 24L24 10l16 14", "M12 21v19h24V21", "M20 40V29h8v11"],
    ["M24 8a5 5 0 100 10 5 5 0 100-10z", "M12 40c0-8 5-13 12-13s12 5 12 13", "M24 30v6M21 33h6"],
    ["M8 14h24v22H8z", "M32 20l8-4v18l-8-4", "M14 22l3 3 6-6"],
  ],
};
const RESULT_FILES = [
  "r01-breast-aug-lipo-bbl", "r02-tummy-tuck-lipo-bbl", "r03-lipo-bbl", "r04-breast-lift-no-implants", "r05-breast-aug-ext-tummy-tuck",
  "r06-breast-lift-reduction", "r07-tummy-tuck-breast-lift-implants", "r08-ext-tummy-tuck-breast-aug", "r09-ext-tummy-tuck-breast-lift", "r10-ext-tummy-tuck-breast-lift",
];
const SURGEON_FILES = ["dr-liliav", "dr-zorrilla", "dr-sartorato", "madeline-vazquez"];
const STORIES = [1, 2, 3, 4, 5];

function googleTag() {
  return `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${CONFIG.GOOGLE_ADS_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${CONFIG.GOOGLE_ADS_ID}', { allow_enhanced_conversions: true });
  gtag('config', '${CONFIG.GA4_ID}');
</script>
`;
}
function gtmHead() {
  if (!CONFIG.GTM_ID) return "";
  return `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${CONFIG.GTM_ID}');</script>
<!-- End Google Tag Manager -->
`;
}
function gtmBody() {
  if (!CONFIG.GTM_ID) return "";
  return `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${CONFIG.GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
`;
}
function metaPixel() {
  if (!CONFIG.META_PIXEL_ID) return "";
  return `<!-- Meta Pixel (PageView only; Lead events fire from GTM) -->
<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${CONFIG.META_PIXEL_ID}');fbq('track','PageView');</script>
<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${CONFIG.META_PIXEL_ID}&ev=PageView&noscript=1" alt=""/></noscript>
`;
}

function page(c) {
  const quizHref = "#quiz";
  const H = c.hero, Qz = c.quiz, W = c.what, P = c.process, R = c.results, St = c.stories, S = c.surgeons, Pr = c.pricing, Rc = c.recovery, T = c.travel, F = c.faq, Fi = c.final, V = c.visit, Ft = c.footer;
  const i18n = { quiz: Qz };
  const url = SITE_URL + c.path;
  const heroWa = wa(H.waHeroMessage);

  return `<!DOCTYPE html>
<html lang="${c.lang}">
<head>
${googleTag()}<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.title)}</title>
<meta name="description" content="${esc(c.description)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en" href="${SITE_URL}/">
<link rel="alternate" hreflang="es" href="${SITE_URL}/es/">
<link rel="alternate" hreflang="x-default" href="${SITE_URL}/">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(c.ogTitle)}">
<meta property="og:description" content="${esc(c.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE_URL}/assets/og-image.jpg">
<meta property="og:locale" content="${c.lang === "es" ? "es_US" : "en_US"}">
<meta property="og:site_name" content="Xiluet Aesthetic Surgery">
<meta name="twitter:card" content="summary_large_image">
<meta name="robots" content="index,follow">
<link rel="icon" href="/assets/logo-mark-180.png" type="image/png">
<link rel="apple-touch-icon" href="/assets/logo-mark-180.png">
<meta name="theme-color" content="#0b2a29">
${gtmHead()}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Mulish:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="preload" as="image" href="/assets/logo-mark.webp">
<link rel="stylesheet" href="/assets/style.css?v=${ASSET_V}">
${metaPixel()}</head>
<body>
${gtmBody()}<div class="site">

<!-- S0 · Sticky header -->
<header class="hdr">
  <a class="brand" href="${c.path}" aria-label="Xiluet Aesthetic Surgery">
    <img src="/assets/logo-mark.webp" alt="${esc(c.header.logoAlt)}" width="40" height="44">
    <span class="brand-text"><span class="brand-name">${esc(c.header.brand)}</span><span class="brand-sub">${esc(c.header.brandSub)}</span></span>
  </a>
  <div class="hdr-right">
    <div class="lang" aria-label="Language">${c.lang === "en"
      ? `<span>EN</span><a href="/es/" hreflang="es" lang="es">ES</a>`
      : `<a href="/" hreflang="en" lang="en">EN</a><span>ES</span>`}</div>
    <a class="hdr-cta" href="${quizHref}">${esc(c.header.cta)}</a>
  </div>
</header>

<!-- S1 · Hero + quiz -->
<section class="hero" id="top">
  <img class="watermark" src="/assets/logo-mark.webp" alt="" aria-hidden="true">
  <div class="hero-grid">
    <div class="hero-copy">
      <span class="eyebrow">${esc(H.eyebrow)}</span>
      <h1 class="h1">${esc(H.h1Before)} <span class="strike">${esc(H.oldPrice)}</span> ${esc(H.from)} <span class="gold">${esc(H.newPrice)}</span></h1>
      <p class="hero-sub">${esc(H.sub)}</p>
      <div class="hero-ctas">
        <a class="btn-primary" href="#quiz">${esc(H.ctaPrimary)}</a>
        <a class="btn-outline" href="${heroWa}" target="_blank" rel="noopener" data-wa="hero">${esc(H.ctaWhatsApp)}</a>
      </div>
      <div class="trust">
        <span><span class="icon">${svg(ICON.eval)}</span>${esc(H.trust[0])}</span>
        <span><span class="icon">${svg(ICON.finance)}</span>${esc(H.trust[1])}</span>
        <span><span class="icon">${svg(ICON.board)}</span>${esc(H.trust[2])}</span>
      </div>
      <div class="promise"><span class="dia">◇</span><em>${esc(H.promise)}</em></div>
    </div>
    <div class="quiz-wrap">
      <div class="quiz-frame"></div>
      <div id="quiz" class="quiz" aria-live="polite">
        <noscript><p class="ty-text">${c.lang === "es" ? "Activa JavaScript para completar la evaluación, o escríbenos por WhatsApp." : "Enable JavaScript to complete the evaluation, or chat with us on WhatsApp."} <a href="${heroWa}">WhatsApp</a></p></noscript>
      </div>
    </div>
  </div>
</section>

<!-- S1b · What is a Mommy Makeover -->
<section class="what sec-off2">
  <div class="wrap what-inner">
    <div class="what-grid">
      <div class="what-copy">
        <span class="eyebrow">${esc(W.eyebrow)}</span>
        <h2 class="h2">${esc(W.h2)}</h2>
        <p class="lead">${esc(W.p)}</p>
      </div>
      <div class="what-img"><div class="frame"></div><img src="/assets/lifestyle.webp" alt="${esc(W.imgAlt)}" width="1400" height="939" loading="lazy"></div>
    </div>
    <div class="proc">
      <div class="proc-cards">
        ${[ICON.tummy, ICON.lift, ICON.aug, ICON.lipo].map((ic, i) => `<div class="proc-card"><span class="icon">${svg(ic)}</span><h3>${esc(W.cards[i])}</h3></div>`).join("\n        ")}
      </div>
      <p class="note">${esc(W.note)}</p>
    </div>
  </div>
</section>

<!-- S6 · How it works -->
<section class="sec sec-teal">
  <div class="wrap process-inner">
    <h2 class="h2 h2--cream">${esc(P.h2)}</h2>
    <ol class="steps">
      ${P.steps.map((s) => `<li class="step"><span class="step-n">${esc(s[0])}</span><span class="step-emoji" aria-hidden="true">${s[1]}</span><h3>${esc(s[2])}</h3><p>${esc(s[3])}</p></li>`).join("\n      ")}
    </ol>
    <a class="btn-primary self-start" href="${quizHref}">${esc(P.cta)}</a>
  </div>
</section>

<!-- S7 · Results -->
<section class="sec sec-off">
  <div class="wrap results-inner">
    <h2 class="h2">${esc(R.h2)}</h2>
    <div class="results-grid">
      ${R.items.map((r, i) => `<figure><div class="res-img"><img src="/assets/results/${RESULT_FILES[i]}.webp" alt="${esc(r[0])} · ${esc(r[1])}" width="640" height="640" loading="lazy"></div><figcaption><span class="res-label">${esc(r[0])}</span><span class="res-doc">${esc(r[1])}</span></figcaption></figure>`).join("\n      ")}
    </div>
    <p class="disclaimer">${esc(R.disclaimer)}</p>
  </div>
</section>

<!-- S8 · Stories -->
<section class="sec sec-white">
  <div class="wrap stories-inner">
    <div class="sec-head"><span class="eyebrow">${esc(St.eyebrow)}</span><h2 class="h2">${esc(St.h2)}</h2></div>
    <div class="stories">
      ${STORIES.map((n) => `<div class="story"><div class="story-video" role="button" tabindex="0" aria-label="${esc(St.playLabel)} ${n}"><video src="/assets/videos/story-${n}.mp4" poster="/assets/videos/story-${n}-poster.webp" playsinline preload="metadata"></video><span class="play-badge" aria-hidden="true">▶</span></div><span class="story-cap">★★★★★ <span>${esc(St.caption)}</span></span></div>`).join("\n      ")}
    </div>
  </div>
</section>

<!-- S5 · Surgeons -->
<section class="surgeons sec-white" id="surgeons">
  <div class="wrap surgeons-inner">
    <div class="sec-head"><span class="eyebrow">${esc(S.eyebrow)}</span><h2 class="h2">${esc(S.h2)}</h2><p class="lead">${esc(S.p)}</p></div>
    <div class="surgeons-grid">
      ${S.list.map((s, i) => `<div class="surgeon"><img src="/assets/surgeons/${SURGEON_FILES[i]}.webp" alt="${esc(s[0])}" width="500" height="500" loading="lazy"><h3>${esc(s[0])}</h3><span class="surgeon-title">${esc(s[1])}</span><p>${esc(s[2])}</p><a class="license" href="${LINKS.verify[i]}" target="_blank" rel="noopener">${esc(S.license)}</a></div>`).join("\n      ")}
    </div>
  </div>
  <div class="band"><p><span class="dia">◇</span>${esc(S.band)}</p></div>
</section>

<!-- S3 · Pricing -->
<section class="sec sec-white" id="pricing">
  <div class="pricing-inner">
    <div class="price-head">
      <div class="sec-head"><span class="eyebrow">${esc(Pr.eyebrow)}</span><h2 class="h2">${esc(Pr.h2)}</h2><p class="lead">${esc(Pr.p)}</p></div>
      <div class="price-tag"><span class="lbl">${esc(Pr.tagLabel)}</span><div class="nums"><span class="price-old">${esc(Pr.oldPrice)}</span><span class="price-new">${esc(Pr.newPrice)}</span></div></div>
    </div>
    <div class="price-grid">
      <div class="card-inc">
        <div class="card-head"><h3>${esc(Pr.includedTitle)}</h3><span class="count">${esc(Pr.includedCount)}</span></div>
        <ul class="plist">${Pr.included.map((it) => `<li><span class="check">✓</span><span>${esc(it)}</span></li>`).join("")}</ul>
      </div>
      <div class="price-col">
        <div class="card-not">
          <div class="card-head"><h3>${esc(Pr.notIncludedTitle)}</h3><span class="sub">${esc(Pr.notIncludedSub)}</span></div>
          <ul class="plist">${Pr.notIncluded.map((it) => `<li><span class="dash"></span><span>${esc(it)}</span></li>`).join("")}</ul>
        </div>
        <div class="callout"><span class="bigdia" aria-hidden="true">◇</span><p>${esc(Pr.callout)}</p><a class="btn-primary self-start" href="${quizHref}">${esc(Pr.cta)}</a></div>
      </div>
    </div>
  </div>
</section>

<!-- S4 · Recovery -->
<section class="sec sec-off" id="recovery">
  <div class="wrap recovery-inner">
    <div class="sec-head"><span class="eyebrow">${esc(Rc.eyebrow)}</span><h2 class="h2">${esc(Rc.h2)}</h2><p class="lead">${esc(Rc.p)}</p></div>
    <div class="phases">
      ${Rc.phases.map((p, i) => `<div class="phase"><span class="icon">${svg(ICON.phases[i])}</span><span class="lbl">${esc(p[0])}</span><p>${esc(p[1])}</p></div>`).join("\n      ")}
    </div>
  </div>
</section>

<!-- S9 · Travel -->
<section class="sec sec-off">
  <div class="wrap travel-inner">
    <div class="sec-head"><span class="eyebrow">${esc(T.eyebrow)}</span><h2 class="h2">${esc(T.h2)}</h2></div>
    <div class="travel-grid">
      ${T.cards.map((txt, i) => `<div class="travel-card"><span class="icon">${svg(ICON.travel[i])}</span><p>${esc(txt)}</p></div>`).join("\n      ")}
    </div>
  </div>
</section>

<!-- S12 · FAQ -->
<section class="sec sec-white">
  <div class="faq-inner">
    <h2 class="h2">${esc(F.h2)}</h2>
    <div class="faq">
      ${F.items.map((f, i) => `<div class="faq-item${i === 0 ? " open" : ""}"><button type="button" class="faq-q" aria-expanded="${i === 0 ? "true" : "false"}" aria-controls="faq-a-${i}"><span class="faq-marker" aria-hidden="true">◇</span><span class="faq-qt">${esc(f[0])}</span><span class="faq-sign" aria-hidden="true">${i === 0 ? "–" : "+"}</span></button><p class="faq-a" id="faq-a-${i}">${esc(f[1])}</p></div>`).join("\n      ")}
    </div>
  </div>
</section>

<!-- S13 · Final CTA -->
<section class="final sec-teal">
  <img class="watermark" src="/assets/logo-mark.webp" alt="" aria-hidden="true">
  <div class="final-inner">
    <h2 class="h2 h2--cream">${esc(Fi.h2)}</h2>
    <a class="btn-primary" href="${quizHref}">${esc(Fi.cta)}</a>
    <p class="final-sub">${esc(Fi.sub)}</p>
  </div>
</section>

<!-- S14 · Visit -->
<section class="visit sec-off">
  <div class="wrap">
    <div class="visit-grid">
      <div class="visit-info">
        <h2 class="h2">${esc(V.h2)}</h2>
        <div class="visit-lines">
          <span><span class="visit-lbl">${esc(V.addressLabel)}</span>${esc(V.address)}</span>
          <span><span class="visit-lbl">${esc(V.hoursLabel)}</span>${esc(V.hours)}</span>
          <span><span class="visit-lbl">${esc(V.phoneLabel)}</span><a href="${tel}" style="color:inherit;text-decoration:none">${esc(CONFIG.PHONE)}</a></span>
        </div>
        <img src="/assets/office.webp" alt="${esc(V.officeAlt)}" width="1400" height="916" loading="lazy">
      </div>
      <iframe class="map" title="${esc(V.mapTitle)}" src="${LINKS.map}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    </div>
  </div>
</section>

<footer>
  <div class="skyline"><img src="/assets/miami-skyline.webp" alt="${esc(Ft.skylineAlt)}" width="1920" height="815" loading="lazy"><div class="fade"></div></div>
  <div class="foot">
    <div class="foot-brand"><img src="/assets/logo-mark.webp" alt="" width="32" height="36"><span class="brand-name">${esc(c.header.brand)}</span><span class="brand-sub">${esc(c.header.brandSub)}</span></div>
    <div class="foot-info">
      <span>${esc(Ft.line)}</span>
      <div class="foot-links"><a href="${LINKS.privacy}" target="_blank" rel="noopener">${esc(Ft.privacy)}</a><a href="${LINKS.terms}" target="_blank" rel="noopener">${esc(Ft.terms)}</a></div>
      <span class="foot-small">${esc(Ft.disclaimer)}</span>
    </div>
  </div>
</footer>

</div>
<script id="mm-i18n" type="application/json">${JSON.stringify(i18n).replace(/</g, "\\u003c")}</script>
<script>window.MM_CONFIG=${JSON.stringify(CONFIG).replace(/</g, "\\u003c")};</script>
<script src="/assets/app.js?v=${ASSET_V}" defer></script>
</body>
</html>
`;
}



function thankYouPage(c) {
  const TY = c.thankYou, Ft = c.footer;
  const url = SITE_URL + TY.path;
  return `<!DOCTYPE html>
<html lang="${c.lang}">
<head>
${googleTag()}<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(TY.title)}</title>
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en" href="${SITE_URL}/thank-you/">
<link rel="alternate" hreflang="es" href="${SITE_URL}/es/gracias/">
<link rel="icon" href="/assets/logo-mark-180.png" type="image/png">
<meta name="theme-color" content="#0b2a29">
${gtmHead()}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Mulish:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/style.css?v=${ASSET_V}">
${metaPixel()}<script>
  (function(){
    var email = sessionStorage.getItem('xil_lead_email');
    var phone = sessionStorage.getItem('xil_lead_phone');
    var ud = {};
    if (email) ud.email = email;
    if (phone) ud.phone_number = phone;
    if (email || phone) gtag('set', 'user_data', ud);
    gtag('event', 'conversion', { 'send_to': '${CONFIG.GOOGLE_ADS_ID}/${CONFIG.GOOGLE_ADS_CONVERSION_LABEL}' });
    sessionStorage.removeItem('xil_lead_email');
    sessionStorage.removeItem('xil_lead_phone');
    /* GTM/GA4 parity: same events the quiz used to push in-page, once per submission */
    var q = sessionStorage.getItem('xil_lead_qualification');
    if (q) {
      window.dataLayer.push({ event: 'quiz_complete', qualification: q, language: '${c.lang}' });
      if (q === 'qualified') window.dataLayer.push({ event: 'qualified_lead', language: '${c.lang}' });
      sessionStorage.removeItem('xil_lead_qualification');
    }
  })();
</script>
</head>
<body>
${gtmBody()}<div class="site">

<header class="hdr">
  <a class="brand" href="${c.path}" aria-label="Xiluet Aesthetic Surgery">
    <img src="/assets/logo-mark.webp" alt="${esc(c.header.logoAlt)}" width="40" height="44">
    <span class="brand-text"><span class="brand-name">${esc(c.header.brand)}</span><span class="brand-sub">${esc(c.header.brandSub)}</span></span>
  </a>
  <div class="hdr-right">
    <div class="lang" aria-label="Language">${c.lang === "en"
      ? `<span>EN</span><a href="/es/gracias/" hreflang="es" lang="es">ES</a>`
      : `<a href="/thank-you/" hreflang="en" lang="en">EN</a><span>ES</span>`}</div>
  </div>
</header>

<section class="hero ty-page">
  <img class="watermark" src="/assets/logo-mark.webp" alt="" aria-hidden="true">
  <div class="ty-wrap">
    <div class="ty-intro">
      <span class="eyebrow eyebrow--gold">${esc(TY.eyebrow)}</span>
      <h1 class="h1 h1--sm">${esc(TY.h1)}</h1>
      <p class="hero-sub">${esc(TY.sub)}</p>
    </div>
    <div class="quiz-wrap">
      <div class="quiz-frame"></div>
      <div class="quiz ty-card">
        <ol class="ty-steps">
          ${TY.steps.map((st, i) => `<li><span class="ty-n">0${i + 1}</span><div><h2>${esc(st[0])}</h2><p>${esc(st[1])}</p></div></li>`).join("\n          ")}
        </ol>
        <p class="ty-privacy">${esc(TY.privacy)}</p>
        <a class="btn-grad btn-grad--lg" href="${wa(TY.waMessage)}" target="_blank" rel="noopener">${esc(TY.waButton)}</a>
        <p class="call">${esc(TY.call)} <a href="${tel}">${esc(CONFIG.PHONE)}</a></p>
        <a class="ty-back" href="${c.path}">${esc(TY.back)}</a>
      </div>
    </div>
  </div>
</section>

<footer>
  <div class="foot">
    <div class="foot-brand"><img src="/assets/logo-mark.webp" alt="" width="32" height="36"><span class="brand-name">${esc(c.header.brand)}</span><span class="brand-sub">${esc(c.header.brandSub)}</span></div>
    <div class="foot-info">
      <span>${esc(Ft.line)}</span>
      <div class="foot-links"><a href="${LINKS.privacy}" target="_blank" rel="noopener">${esc(Ft.privacy)}</a><a href="${LINKS.terms}" target="_blank" rel="noopener">${esc(Ft.terms)}</a></div>
      <span class="foot-small">${esc(Ft.disclaimer)}</span>
    </div>
  </div>
</footer>

</div>
</body>
</html>
`;
}

const root = path.join(__dirname, "..");
for (const lang of ["en", "es"]) {
  const c = require(path.join(root, "content", lang + ".js"));
  const out = path.join(root, "site", lang === "en" ? "index.html" : "es/index.html");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, page(c));
  console.log("wrote", path.relative(root, out), fs.statSync(out).size, "bytes");
  const ty = path.join(root, "site", c.thankYou.path.replace(/^\//, ""), "index.html");
  fs.mkdirSync(path.dirname(ty), { recursive: true });
  fs.writeFileSync(ty, thankYouPage(c));
  console.log("wrote", path.relative(root, ty), fs.statSync(ty).size, "bytes");
}
