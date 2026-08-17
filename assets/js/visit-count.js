/* ==========================================================
   CRaWL — page visit counter (footer strip)
   File: assets/js/visit-count.js
   ----------------------------------------------------------
   Fills <span id="visitCount"> in the footer with a real
   number. If the count cannot be fetched, the strip stays
   hidden — a fake number is never shown.

   Two providers, chosen in assets/js/site-data.js:

     provider: "countapi"     no sign-up, works the moment you
                              commit. Pick a key nobody else
                              would use.
     provider: "goatcounter"  privacy-first analytics with a
                              free account; reuses the site
                              code already in CRAWL.analytics
                              and reports unique visitors.

   One visit is counted per browser session, so a reader
   reloading the page does not inflate the number.
   ========================================================== */
(function () {
  "use strict";

  var box = document.getElementById("visitCount");
  if (!box || !window.fetch) return;

  var cfg = (window.CRAWL && window.CRAWL.visits) || {};
  var provider = cfg.provider || "countapi";
  var label = cfg.label || "page visits";

  var EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/>' +
    '<circle cx="12" cy="12" r="2.6"/></svg>';

  function show(n) {
    var num = Number(n);
    if (!isFinite(num)) return;
    box.innerHTML = EYE + '<b>' + num.toLocaleString("en-IN") + '</b> ' +
      '<span>' + label + '</span>';
    box.hidden = false;
  }

  function firstThisSession() {
    try {
      if (sessionStorage.getItem("crawl-counted")) return false;
      sessionStorage.setItem("crawl-counted", "1");
      return true;
    } catch (e) {
      return true;                       /* private mode — count it */
    }
  }

  if (provider === "goatcounter") {
    var code = (cfg.code ||
      (window.CRAWL && window.CRAWL.analytics && window.CRAWL.analytics.code) || "").trim();
    if (!code) return;
    fetch("https://" + code + ".goatcounter.com/counter/TOTAL.json")
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { if (d && d.count !== undefined) show(String(d.count).replace(/,/g, "")); })
      .catch(function () { /* stays hidden */ });
    return;
  }

  /* ---- countapi: no account, no keys ---- */
  var key = (cfg.key || "crawl-iitr-website").replace(/[^A-Za-z0-9_-]/g, "");
  var base = "https://countapi.mileshilliard.com/api/v1/";
  var url = base + (firstThisSession() ? "hit/" : "get/") + key;

  fetch(url)
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (d) { if (d && d.value !== undefined) show(d.value); })
    .catch(function () { /* stays hidden */ });
})();
