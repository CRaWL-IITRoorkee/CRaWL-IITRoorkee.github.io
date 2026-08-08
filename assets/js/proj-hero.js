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
    speed: 34,                     // px per second of continuous drift
    nudge: 1.15,                   // how far one arrow click travels, in tile widths
    resumeAfter: 1400,             // ms of stillness after an arrow click before drift resumes
    debug: true                    // console summary — set false once happy
  };

  var strip, track, prevBtn, nextBtn;

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

  /* ---------------- render: single-row continuous marquee ---------------- */

  var half = 0, paused = false, resumeTimer = null, last = 0;

  function tile(src, i){
    var fig = document.createElement("figure");
    fig.className = "plogo";
    var img = document.createElement("img");
    img.alt = "";
    img.decoding = "async";
    img.loading = i < 10 ? "eager" : "lazy";
    img.src = src;
    fig.appendChild(img);
    return fig;
  }

  function measure(){
    // half = width of one full set (the track holds the set twice)
    half = track.scrollWidth / 2;
  }

  function wrap(){
    if (!half) return;
    if (strip.scrollLeft >= half) strip.scrollLeft -= half;
    else if (strip.scrollLeft < 0) strip.scrollLeft += half;
  }

  function frame(now){
    if (!last) last = now;
    var dt = (now - last) / 1000;
    last = now;
    if (!paused && !document.hidden && dt < 0.5) {
      strip.scrollLeft += CFG.speed * dt;
      wrap();
    }
    requestAnimationFrame(frame);
  }

  function step(dir){
    var w = track.firstChild ? track.firstChild.getBoundingClientRect().width + 12 : 200;
    paused = true;
    strip.scrollBy({ left: dir * w * CFG.nudge, behavior: "smooth" });
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(function(){ paused = false; wrap(); }, CFG.resumeAfter);
  }

  function build(srcs){
    // two identical sets back to back make the loop seamless
    srcs.forEach(function (src, i) { track.appendChild(tile(src, i)); });
    srcs.forEach(function (src, i) {
      var t = tile(src, i + srcs.length);
      t.setAttribute("aria-hidden", "true");
      track.appendChild(t);
    });

    var imgs = track.querySelectorAll("img"), done = 0;
    imgs.forEach(function (im) {
      if (im.complete) { if (++done === imgs.length) measure(); return; }
      im.addEventListener("load", function(){ if (++done === imgs.length) measure(); });
      im.addEventListener("error", function(){ if (++done === imgs.length) measure(); });
    });
    measure();
    window.addEventListener("resize", measure);

    strip.addEventListener("mouseenter", function(){ paused = true; });
    strip.addEventListener("mouseleave", function(){ if (!resumeTimer) paused = false; });
    strip.addEventListener("scroll", wrap, { passive: true });
    if (prevBtn) prevBtn.addEventListener("click", function(){ step(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function(){ step(1); });

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) requestAnimationFrame(frame);
    log("[proj-hero] marquee running,", srcs.length, "logos");
  }

  function init() {
    strip = document.getElementById("projStrip");
    track = document.getElementById("projTrack");
    prevBtn = document.getElementById("projPrev");
    nextBtn = document.getElementById("projNext");
    if (!strip || !track) { log("[proj-hero] #projStrip / #projTrack not found"); return; }

    discover().then(function (srcs) {
      log("[proj-hero] found " + srcs.length + " logo(s):", srcs);
      if (srcs.length) build(srcs);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
