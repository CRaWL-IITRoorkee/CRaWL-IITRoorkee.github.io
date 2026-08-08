/* ============================================================
   CRaWL — Gallery viewer
   Place at: assets/js/gallery.js

   Turns every <div class="gallery-grid"> on the page into a
   large stage with a thumbnail strip underneath. No markup
   change needed when you add or remove a <figure>.
   ============================================================ */
(function () {
  "use strict";

  var CFG = {
    hold: 30000,     // ms each photo stays on the stage
    fade: 600,       // ms cross-fade
    debug: false
  };

  function log() { if (CFG.debug && window.console) console.log.apply(console, arguments); }

  function Viewer(grid) {
    var figures = Array.prototype.slice.call(grid.querySelectorAll("figure"));
    if (figures.length < 2) return;              // one image needs no viewer

    var shots = figures.map(function (f) {
      var img = f.querySelector("img");
      return { src: img ? img.getAttribute("src") : "", alt: img ? img.getAttribute("alt") || "" : "" };
    }).filter(function (s) { return s.src; });
    if (!shots.length) return;

    // --- build ---
    var wrap = document.createElement("div");
    wrap.className = "gal-viewer";

    var stage = document.createElement("div");
    stage.className = "gal-stage";

    var thumbs = document.createElement("div");
    thumbs.className = "gal-thumbs";

    var slides = [];
    shots.forEach(function (s, i) {
      var big = document.createElement("img");
      big.src = s.src;
      big.alt = s.alt;
      big.loading = i === 0 ? "eager" : "lazy";
      big.decoding = "async";
      stage.appendChild(big);

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gal-thumb";
      btn.setAttribute("aria-label", "Show image " + (i + 1) + " of " + shots.length);
      var t = document.createElement("img");
      t.src = s.src; t.alt = ""; t.loading = "lazy"; t.decoding = "async";
      btn.appendChild(t);
      btn.addEventListener("click", function () { show(i); restart(); });
      thumbs.appendChild(btn);

      slides.push({ big: big, thumb: btn });
    });

    wrap.appendChild(stage);
    wrap.appendChild(thumbs);
    grid.parentNode.replaceChild(wrap, grid);

    // --- behaviour ---
    var idx = 0, timer = null, paused = false;

    function show(n) {
      idx = ((n % slides.length) + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        s.big.classList.toggle("is-active", k === idx);
        s.thumb.classList.toggle("is-active", k === idx);
        s.thumb.setAttribute("aria-current", k === idx ? "true" : "false");
      });
    }

    function start() { if (!timer) timer = setInterval(function () { if (!paused) show(idx + 1); }, CFG.hold); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    wrap.addEventListener("mouseenter", function () { paused = true; });
    wrap.addEventListener("mouseleave", function () { paused = false; });
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });

    show(0);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { e[0].isIntersecting ? start() : stop(); }, { threshold: 0.2 }).observe(wrap);
      setTimeout(function () { if (!timer) start(); }, 1200);   // safety net
    } else { start(); }

    log("[gallery] viewer with", slides.length, "images @", CFG.hold + "ms");
  }

  function init() {
    var grids = document.querySelectorAll(".gallery-grid");
    Array.prototype.forEach.call(grids, Viewer);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
