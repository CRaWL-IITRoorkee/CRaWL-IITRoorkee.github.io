/* ============================================================
   CRaWL — Logo marquee (shared by projects.html, conferences.html, …)
   Place at: assets/js/logo-marquee.js

   Markup — the folder comes from data-dir, so one script serves every page:
     <div class="logo-marquee" data-dir="assets/images/projects/">
       <button class="lm-arrow lm-prev" type="button">…</button>
       <div class="lm-strip"><div class="lm-track"></div></div>
       <button class="lm-arrow lm-next" type="button">…</button>
     </div>
   ============================================================ */
(function () {
  "use strict";

  var CFG = {
    exts: [".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG", ".WEBP"],
    pad: true,
    scanTo: 60,
    stopAfterMisses: 3,
    speed: 30,          // px per second of drift
    nudge: 1.15,        // cards travelled per arrow click
    nudgeMs: 480,
    resumeAfter: 1200,
    debug: false
  };

  function log() { if (CFG.debug && window.console) console.log.apply(console, arguments); }

  function tryLoad(src) {
    return new Promise(function (res) {
      var im = new Image();
      im.onload = function () { res(src); };
      im.onerror = function () { res(null); };
      im.src = src;
    });
  }

  /* ---------------- one independent marquee ---------------- */

  function Marquee(root) {
    var dir = root.getAttribute("data-dir") || "";
    var strip = root.querySelector(".lm-strip");
    var track = root.querySelector(".lm-track");
    var prevBtn = root.querySelector(".lm-prev");
    var nextBtn = root.querySelector(".lm-next");
    if (!strip || !track) return;

    var lockedExt = null, half = 0, x = 0;
    var paused = false, resumeTimer = null, last = 0, glide = null;

    function candidates(n) {
      var names = [String(n)];
      if (CFG.pad && n < 10) names.push("0" + n);
      var exts = lockedExt ? [lockedExt] : CFG.exts, out = [];
      for (var a = 0; a < names.length; a++)
        for (var b = 0; b < exts.length; b++) out.push(dir + names[a] + exts[b]);
      return out;
    }

    function resolveSlot(n) {
      return candidates(n).reduce(function (chain, url) {
        return chain.then(function (hit) { return hit ? hit : tryLoad(url); });
      }, Promise.resolve(null)).then(function (hit) {
        if (hit && !lockedExt) {
          var m = hit.match(/\.[a-z]+$/i);
          if (m) lockedExt = m[0];
        }
        return hit;
      });
    }

    function discover() {
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

    function tile(src, i) {
      var fig = document.createElement("figure");
      fig.className = "lm-logo";
      var img = document.createElement("img");
      img.alt = ""; img.decoding = "async";
      img.loading = i < 10 ? "eager" : "lazy";
      img.src = src;
      fig.appendChild(img);
      return fig;
    }

    function measure() {
      var cs = getComputedStyle(track);
      var gap = parseFloat(cs.columnGap || cs.gap) || 0;
      half = (track.scrollWidth + gap) / 2;
    }

    function paint() {
      if (half) { while (x >= half) x -= half; while (x < 0) x += half; }
      track.style.transform = "translate3d(" + (-x) + "px,0,0)";
    }

    function frame(now) {
      if (!last) last = now;
      var dt = (now - last) / 1000;
      last = now;
      if (!paused && !glide && !document.hidden && dt < 0.5 && half) { x += CFG.speed * dt; paint(); }
      requestAnimationFrame(frame);
    }

    function step2(dir2) {
      if (!track.firstChild) return;
      var w = track.firstChild.getBoundingClientRect().width + 12;
      var from = x, to = x + dir2 * w * CFG.nudge, t0 = performance.now();
      clearTimeout(resumeTimer);
      glide = function (now) {
        var p = Math.min(1, (now - t0) / CFG.nudgeMs);
        var e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        x = from + (to - from) * e;
        paint();
        if (p < 1) requestAnimationFrame(glide);
        else { glide = null; resumeTimer = setTimeout(function () { paused = false; }, CFG.resumeAfter); }
      };
      paused = true;
      requestAnimationFrame(glide);
    }

    function build(srcs) {
      srcs.forEach(function (src, i) { track.appendChild(tile(src, i)); });
      srcs.forEach(function (src, i) {                    // second set = seamless loop
        var t = tile(src, i + srcs.length);
        t.setAttribute("aria-hidden", "true");
        track.appendChild(t);
      });

      var imgs = track.querySelectorAll("img"), done = 0;
      Array.prototype.forEach.call(imgs, function (im) {
        var tick = function () { if (++done >= imgs.length) measure(); };
        if (im.complete) tick();
        else { im.addEventListener("load", tick); im.addEventListener("error", tick); }
      });
      measure();
      window.addEventListener("resize", measure);
      window.addEventListener("load", measure);

      strip.addEventListener("mouseenter", function () { paused = true; });
      strip.addEventListener("mouseleave", function () { if (!glide) { clearTimeout(resumeTimer); paused = false; } });
      if (prevBtn) prevBtn.addEventListener("click", function () { step2(-1); });
      if (nextBtn) nextBtn.addEventListener("click", function () { step2(1); });

      requestAnimationFrame(frame);
      log("[logo-marquee]", dir, "→", srcs.length, "logos");
    }

    discover().then(function (srcs) {
      log("[logo-marquee] found in " + dir + ":", srcs);
      if (srcs.length) build(srcs);
    });
  }

  function init() {
    var roots = document.querySelectorAll(".logo-marquee");
    Array.prototype.forEach.call(roots, function (r) { Marquee(r); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
