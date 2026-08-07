/* ==========================================================
   CRaWL — website analytics
   ----------------------------------------------------------
   Loads the privacy-first GoatCounter tracker and renders the
   footer panel from the numbers it reports back.

   Rules this file follows:
     • It never displays a number it did not fetch.
     • "Visitors" and "Page views" are separate metrics.
     • It never labels page views as "clicks" — click tracking
       is not configured, so clicks are simply not shown.
     • With no site code set, the panel stays hidden.

   Configure in assets/js/site-data.js.
   ========================================================== */
(function () {
  "use strict";

  var cfg = (window.CRAWL && window.CRAWL.analytics) || {};
  var box = document.getElementById("footAnalytics");
  var code = (cfg.code || "").trim();

  if (!code) {
    if (box) box.hidden = true;
    if (window.console && console.info) {
      console.info(
        "CRaWL analytics: not configured.\n" +
        "1. Create a free site at https://www.goatcounter.com\n" +
        "2. Put your site code in assets/js/site-data.js\n" +
        "The footer panel appears once real data is available."
      );
    }
    return;
  }

  var origin = "https://" + code + ".goatcounter.com";

  /* ---- 1. count this page view (async, no cookies) -------- */
  var t = document.createElement("script");
  t.async = true;
  t.src = "//gc.zgo.at/count.js";
  t.setAttribute("data-goatcounter", origin + "/count");
  document.body.appendChild(t);

  if (!box) return;

  /* ---- 2. render the panel -------------------------------- */
  var EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/>' +
    '<circle cx="12" cy="12" r="2.6"/></svg>';
  var PAGE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/>' +
    '<path d="M14 3v5h5"/></svg>';

  box.hidden = false;
  box.innerHTML =
    '<h4>Website analytics</h4>' +
    '<div class="an-grid">' +
      '<div class="an-stat"><span class="an-ic">' + EYE + '</span>' +
        '<span><b id="anVisitors">—</b><span>Visitors</span></span></div>' +
      '<div class="an-stat" id="anViewsWrap" hidden><span class="an-ic">' + PAGE + '</span>' +
        '<span><b id="anViews">—</b><span>Page views</span></span></div>' +
    '</div>' +
    '<p class="an-foot" id="anFoot">Loading live counts…</p>';

  var elVisitors = document.getElementById("anVisitors");
  var elViews = document.getElementById("anViews");
  var elViewsWrap = document.getElementById("anViewsWrap");
  var elFoot = document.getElementById("anFoot");
  var got = false;

  function fail(msg) {
    if (got) return;
    box.hidden = true;
    if (window.console && console.info) console.info("CRaWL analytics: " + msg);
  }

  /* Total visitors — public endpoint, no API key needed. */
  fetch(origin + "/counter/TOTAL.json")
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      if (!d || d.count === undefined) throw new Error("no count");
      got = true;
      elVisitors.textContent = d.count;              // already thousands-separated
      elFoot.textContent = "Since launch · privacy-first, no cookies";
    })
    .catch(function () { fail("no visitor data yet — counts appear a few hours after the first visit."); });

  /* Page views — written monthly by .github/workflows/analytics.yml.
     Absent file simply means the metric is not shown. */
  if (cfg.dataFile) {
    fetch(cfg.dataFile, { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        if (!d || typeof d.pageviews !== "number") return;
        elViews.textContent = d.pageviews.toLocaleString("en-IN");
        elViewsWrap.hidden = false;
        if (typeof d.visitors === "number" && !got) {
          got = true;
          box.hidden = false;
          elVisitors.textContent = d.visitors.toLocaleString("en-IN");
        }
        if (d.updated) {
          elFoot.textContent = "Updated " + d.updated + " · privacy-first, no cookies";
        }
      })
      .catch(function () { /* no file yet — visitors only */ });
  }
})();
