/* ============================================================
   CRaWL — Projects hero photo reel
   Place at: assets/js/proj-hero.js
   Requires in publications.html:
     <div class="proj-reel" id="projReel">
       <div class="proj-grid" id="projGrid"></div>
     </div>
   ============================================================ */
(function () {
  "use strict";

  var CFG = {
    dir: "assets/images/projects/",

    /* ---- OPTION A (guaranteed): list the files yourself ----
       Leave empty [] to auto-detect. If auto-detect ever misbehaves,
       just fill this in and it will use exactly these:
       files: ["1.jpg","2.jpg","3.png", ...]                        */
    files: [],

    /* ---- OPTION B: auto-detect ---- */
    scanTo: 40,                    // checks 1 … 40, keeps every one that exists
    exts: [".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG", ".WEBP"],
    pad: true,                     // also try 01.jpg, 02.jpg …

    stopAfterMisses: 3,            // end the scan after this many consecutive missing numbers
    debug: true                    // console summary — set false once happy
  };

  var grid, reel;

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
  var lockedExt = null;          // once one cover loads, reuse its extension (kills 404 noise)

  function candidates(n) {
    var names = [String(n)];
    if (CFG.pad && n < 10) names.push("0" + n);
    var exts = lockedExt ? [lockedExt] : CFG.exts;
    var out = [];
    for (var a = 0; a < names.length; a++)
      for (var b = 0; b < exts.length; b++)
        out.push(CFG.dir + names[a] + exts[b]);
    return out;
  }

  function resolveSlot(n) {
    return candidates(n).reduce(function (chain, url) {
      return chain.then(function (hit) { return hit ? hit : tryLoad(url); });
    }, Promise.resolve(null)).then(function (hit) {
      if (hit && !lockedExt) {
        var m = hit.match(/\.[a-z]+$/i);
        if (m) { lockedExt = m[0]; log("[proj-hero] extension locked to", lockedExt); }
      }
      return hit;
    });
  }

  function discover() {
    if (CFG.files && CFG.files.length) {
      return Promise.resolve(CFG.files.map(function (f) {
        return /^https?:|^\//.test(f) ? f : CFG.dir + f;
      }));
    }
    var found = [], n = 1, misses = 0;
    function step() {
      if (n > CFG.scanTo || misses >= CFG.stopAfterMisses) return Promise.resolve(found);
      return resolveSlot(n++).then(function (hit) {
        if (hit) { found.push(hit); misses = 0; } else { misses++; }
        return step();
      });
    }
    return step();
  }

  /* ---------------- render (static — no autoplay) ---------------- */

  function layout(n){
    if (n < 1 || window.innerWidth <= 820){          // small screens use the CSS fallback
      grid.style.gridTemplateColumns = "";
      return;
    }
    var rows = n <= 12 ? 2 : (n <= 24 ? 3 : 4);
    grid.style.gridTemplateColumns = "repeat(" + Math.ceil(n / rows) + ",1fr)";
  }

  function build(srcs){
    srcs.forEach(function (src, i) {
      var fig = document.createElement("figure");
      fig.className = "ptile";
      var img = document.createElement("img");
      img.alt = "";
      img.decoding = "async";
      img.loading = i < 8 ? "eager" : "lazy";
      img.src = src;
      fig.appendChild(img);
      grid.appendChild(fig);
    });
    layout(srcs.length);
    window.addEventListener("resize", function(){ layout(srcs.length); });
  }

  function init() {
    grid = document.getElementById("projGrid");
    reel = document.getElementById("projReel");
    if (!grid) { log("[proj-hero] #projGrid not found"); return; }

    discover().then(function (srcs) {
      log("[proj-hero] found " + srcs.length + " photo(s):", srcs);
      if (srcs.length) build(srcs);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
