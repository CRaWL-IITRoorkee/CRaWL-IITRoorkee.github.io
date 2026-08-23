/* ============================================================
   CRaWL — Collaborator logo marquee
   Place at: assets/js/collaborators.js

   HOW TO ADD A COLLABORATOR
   -------------------------
   Drop the logo into  assets/images/collaborators/  named:

       collab-1.png, collab-2.png, collab-3.png ...

   Numbers start at 1 and run upward; no HTML editing. Same
   convention as the gallery folder.

   Accepted: .png .PNG .jpg .JPG .jpeg .svg .webp

   WHY THE LANE USED TO SIT STILL AT RANDOM  (two separate causes)

   1. The measurement raced the layout. The lane only animates when the
      logos are wider than the box, so the width has to be measured. The
      old version measured the instant the <img> tags were appended —
      before the browser had laid them out — so scrollWidth was often 0,
      which reads as "not wider than the box", and the marquee quietly
      concluded there was nothing to scroll. Cache warm, it won the race
      and rolled; cache cold, it lost and sat still.

   2. The scan was being starved. Finding the logos means probing
      collab-1, collab-2 ... until one is missing, and every missing
      number costs a failed request per extension. That is fast on an
      empty page (about a second) but on the home page it competes with
      the hero's WebGL canvas and forty-odd images for the browser's
      handful of connections, and can take far longer. If you reached
      the footer before it finished, the lane was still empty.

   Both are handled below: the width is measured only after every image
   has actually loaded (and again on resize), and the scan result is kept
   in sessionStorage so only the first page view of a visit pays for it.

   WHY THIS FILE MEASURES SO CAREFULLY
   -----------------------------------
   The lane only animates when the logos are wider than the box,
   so the width has to be measured. The old version measured the
   instant the <img> tags were appended — before the browser had
   laid them out — so scrollWidth was often 0, which is "not
   wider than the box", and the marquee silently concluded it had
   nothing to scroll. That is why it rolled on some loads and sat
   still on others: a plain race, won or lost by the disk cache.

   Now it waits for every image to finish loading, then measures,
   and measures again on resize. loading="lazy" is also gone: the
   lane sits low on the page, and a lazy image has no size until
   it is scrolled into view — the same bug by another route.
   ============================================================ */
(function () {
  "use strict";

  var BASE = "assets/images/collaborators/";
  var EXTS = [".png", ".PNG", ".jpg", ".JPG", ".jpeg", ".svg", ".webp"];
  var BATCH = 6;            /* numbers probed per round */
  var MAX = 120;
  var CACHE_KEY = "crawl-collab-urls";
  var PX_PER_SEC = 90;      /* scroll speed; lower = slower */

  /* The extension that worked last time is tried first, so a logo that
     exists usually costs ONE request instead of up to seven. */
  var hotExt = null;

  function findAt(n, done) {
    var list = hotExt
      ? [hotExt].concat(EXTS.filter(function (e) { return e !== hotExt; }))
      : EXTS.slice();
    var i = 0;
    (function next() {
      if (i >= list.length) { done(null); return; }
      var ext = list[i++];
      var url = BASE + "collab-" + n + ext;
      var im = new Image();
      im.onload = function () { hotExt = ext; done(url); };
      im.onerror = next;
      im.src = url;
    })();
  }

  function scan(done) {
    var found = {}, start = 1;
    (function round() {
      var pending = BATCH, any = false;
      for (var k = 0; k < BATCH; k++) {
        (function (n) {
          findAt(n, function (url) {
            if (url) { found[n] = url; any = true; }
            if (--pending === 0) {
              start += BATCH;
              if (!any || start > MAX) {
                var nums = Object.keys(found).map(Number).sort(function (a, b) { return a - b; });
                done(nums.map(function (n) { return found[n]; }));
              } else { round(); }
            }
          });
        })(start + k);
      }
    })();
  }

  /* Resolve once every <img> in the lane has settled (loaded or failed).
     complete && naturalWidth covers images already in the browser cache. */
  function whenLoaded(imgs, done) {
    var left = 0, fired = false;
    function tick() { if (--left <= 0 && !fired) { fired = true; done(); } }
    imgs.forEach(function (im) {
      if (im.complete && im.naturalWidth > 0) return;
      left++;
      im.addEventListener("load", tick, { once: true });
      im.addEventListener("error", tick, { once: true });
    });
    if (left === 0) { fired = true; done(); return; }
    setTimeout(function () { if (!fired) { fired = true; done(); } }, 4000);
  }

  function addImg(lane, url, clone) {
    var img = document.createElement("img");
    img.src = url;
    img.alt = clone ? "" : "Collaborating institution";
    img.decoding = "async";
    /* deliberately NOT loading="lazy" — see the note at the top */
    if (clone) img.setAttribute("aria-hidden", "true");
    lane.appendChild(img);
  }

  function measure(box, lane, urls) {
    /* strip clones from any previous pass, so scrollWidth is the width of
       ONE set of logos rather than one set plus its duplicate */
    [].slice.call(lane.querySelectorAll('img[aria-hidden="true"]'))
      .forEach(function (im) { im.parentNode.removeChild(im); });

    box.classList.remove("is-rolling");
    lane.style.justifyContent = "";
    lane.style.width = "";

    var oneSet = lane.scrollWidth;
    var visible = box.clientWidth;

    /* Nothing sensible to measure yet — box still hidden, fonts swapping,
       images still decoding. Try again next frame instead of concluding
       there is nothing to scroll. */
    if (oneSet === 0 || visible === 0) {
      requestAnimationFrame(function () { measure(box, lane, urls); });
      return;
    }

    /* A short row sits centred rather than sliding pointlessly. */
    if (oneSet <= visible) {
      lane.style.justifyContent = "center";
      lane.style.width = "100%";
      return;
    }

    urls.forEach(function (u) { addImg(lane, u, true); });   /* seamless loop */
    box.style.setProperty("--logo-duration",
      Math.max(12, Math.round(oneSet / PX_PER_SEC)) + "s");
    box.classList.add("is-rolling");
  }

  function build(box, urls) {
    var lane = box.querySelector(".logo-lane");
    if (!lane) return;
    if (!urls.length) { box.setAttribute("hidden", ""); return; }

    lane.innerHTML = "";
    urls.forEach(function (u) { addImg(lane, u, false); });

    whenLoaded([].slice.call(lane.querySelectorAll("img")), function () {
      measure(box, lane, urls);
    });

    var t;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(function () { measure(box, lane, urls); }, 200);
    });
  }

  /* The scan is the slow part: every number that does NOT exist costs one
     failed request per extension, and the browser only opens a handful of
     connections at a time. On a cold load that can take many seconds, which
     is the OTHER half of the "sometimes it does not move" problem — the lane
     was still empty when you scrolled past it.

     So the result is remembered for the tab. First view scans; every later
     page view in the same visit fills the lane immediately. Clearing it is
     just a matter of opening a new tab. */
  function readCache() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var list = JSON.parse(raw);
      return (list && list.length) ? list : null;
    } catch (e) { return null; }
  }

  function writeCache(urls) {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(urls)); }
    catch (e) { /* private mode — just scan again next time */ }
  }

  function init() {
    var box = document.querySelector("[data-collab-logos]");
    if (!box) return;

    var cached = readCache();
    if (cached) { build(box, cached); return; }

    scan(function (urls) {
      if (urls.length) writeCache(urls);
      build(box, urls);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
