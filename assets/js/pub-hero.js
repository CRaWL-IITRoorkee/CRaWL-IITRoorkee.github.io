/* ============================================================
   CRaWL — Publications hero cover reel
   Place at: assets/js/pub-hero.js
   Requires in publications.html:
     <div class="cover-reel" id="coverReel">
       <div class="reel-stage" id="reelStage"></div>
       <div class="reel-grid"  id="reelGrid"></div>
     </div>
   ============================================================ */
(function () {
  "use strict";

  var CFG = {
    dir: "assets/images/publications/",

    /* ---- OPTION A (guaranteed): list the files yourself ----
       Leave empty [] to auto-detect. If auto-detect ever misbehaves,
       just fill this in and it will use exactly these:
       files: ["1.jpg","2.jpg","3.png", ...]                        */
    files: [],

    /* ---- OPTION B: auto-detect ---- */
    scanTo: 40,                    // checks 1 … 40, keeps every one that exists
    exts: [".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG", ".WEBP"],
    pad: true,                     // also try 01.jpg, 02.jpg …

    hold: 1000,                    // ms each cover holds the big panel
    hideActiveTile: true,          // featured cover is not repeated as a thumbnail
    debug: true                    // console summary — set false once happy
  };

  var stage, grid, reel, reduce;
  var slides = [], idx = 0, timer = null, paused = false;

  function log() {
    if (CFG.debug && window.console) console.log.apply(console, arguments);
  }

  /* ---------------- discovery ---------------- */

  function tryLoad(src) {
    return new Promise(function (res) {
      var im = new Image();
      im.onload = function () { res(src); };
      im.onerror = function () { res(null); };
      im.src = src;
    });
  }

  // every candidate filename for slot n, in priority order
  function candidates(n) {
    var names = [String(n)];
    if (CFG.pad && n < 10) names.push("0" + n);
    var out = [];
    for (var a = 0; a < names.length; a++)
      for (var b = 0; b < CFG.exts.length; b++)
        out.push(CFG.dir + names[a] + CFG.exts[b]);
    return out;
  }

  function resolveSlot(n) {
    return candidates(n).reduce(function (chain, url) {
      return chain.then(function (hit) { return hit ? hit : tryLoad(url); });
    }, Promise.resolve(null));
  }

  function discover() {
    if (CFG.files && CFG.files.length) {
      return Promise.resolve(CFG.files.map(function (f) {
        return /^https?:|^\//.test(f) ? f : CFG.dir + f;
      }));
    }
    // Scan the WHOLE range in batches and keep everything found.
    // A missing number no longer stops the scan.
    var found = [], next = 1, STEP = 10;
    function batch() {
      var jobs = [];
      for (var i = 0; i < STEP && next + i <= CFG.scanTo; i++) jobs.push(resolveSlot(next + i));
      if (!jobs.length) return Promise.resolve(found);
      next += jobs.length;
      return Promise.all(jobs).then(function (res) {
        for (var k = 0; k < res.length; k++) if (res[k]) found.push(res[k]);
        // stop early only once a whole batch came back empty AND we already have some
        if (found.length && res.every(function (r) { return !r; })) return found;
        return batch();
      });
    }
    return batch();
  }

  /* ---------------- layout + animation ---------------- */

  function layout() {
    var m = slides.length - (CFG.hideActiveTile ? 1 : 0);
    if (m < 1 || window.innerWidth <= 820) {       // small screens use the CSS fallback
      grid.style.gridTemplateColumns = "";
      grid.style.gridTemplateRows = "";
      return;
    }
    var rows = m <= 14 ? 2 : (m <= 27 ? 3 : 4);
    grid.style.gridTemplateColumns = "repeat(" + Math.ceil(m / rows) + ",1fr)";
    grid.style.gridTemplateRows = "repeat(" + rows + ",1fr)";
  }

  function show(n) {
    if (!slides.length) return;
    idx = ((n % slides.length) + slides.length) % slides.length;
    for (var j = 0; j < slides.length; j++) {
      var on = (j === idx);
      slides[j].big.classList.toggle("is-active", on);
      slides[j].thumb.classList.toggle("is-active", on);
      if (CFG.hideActiveTile) slides[j].thumb.classList.toggle("is-stage", on);
    }
  }

  function start() {
    if (!timer && !reduce && slides.length > 1) {
      timer = setInterval(function () { if (!paused) show(idx + 1); }, CFG.hold);
      log("[pub-hero] autoplay running @", CFG.hold + "ms");
    }
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  function build(srcs) {
    srcs.forEach(function (src, i) {
      var slot = {};

      slot.big = document.createElement("img");
      slot.big.alt = ""; slot.big.decoding = "async"; slot.big.src = src;
      stage.appendChild(slot.big);

      var t = document.createElement("img");
      t.alt = ""; t.decoding = "async"; t.src = src;
      t.loading = i < 8 ? "eager" : "lazy";

      slot.thumb = document.createElement("button");
      slot.thumb.type = "button";
      slot.thumb.className = "thumb";
      slot.thumb.setAttribute("aria-label", "Show publication front page " + (i + 1));
      slot.thumb.appendChild(t);
      slot.thumb.addEventListener("mouseenter", function () { paused = true; show(slides.indexOf(slot)); });
      slot.thumb.addEventListener("focus", function () { paused = true; show(slides.indexOf(slot)); });
      slot.thumb.addEventListener("click", function () { show(slides.indexOf(slot)); });
      grid.appendChild(slot.thumb);

      slides.push(slot);
    });

    layout();
    show(0);

    grid.addEventListener("mouseleave", function () { paused = false; });
    grid.addEventListener("focusout", function (e) { if (!grid.contains(e.relatedTarget)) paused = false; });
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
    window.addEventListener("resize", layout);

    if (reduce) { log("[pub-hero] reduced-motion on — autoplay disabled"); return; }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { e[0].isIntersecting ? start() : stop(); }, { threshold: 0.15 }).observe(reel);
      // safety net: if the observer never fires (odd layouts), kick off anyway
      setTimeout(function () { if (!timer) start(); }, 1200);
    } else { start(); }
  }

  function init() {
    stage = document.getElementById("reelStage");
    grid = document.getElementById("reelGrid");
    reel = document.getElementById("coverReel");
    if (!stage || !grid || !reel) {
      log("[pub-hero] containers missing — expected #coverReel / #reelStage / #reelGrid");
      return;
    }
    reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    discover().then(function (srcs) {
      log("[pub-hero] found " + srcs.length + " cover(s):", srcs);
      if (!srcs.length) {
        log("[pub-hero] nothing loaded from " + CFG.dir +
            " — check the folder path and file names, or set CFG.files manually.");
        return;
      }
      build(srcs);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
