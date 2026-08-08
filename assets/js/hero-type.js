/* ============================================================
   CRaWL — Home hero kinetic headline
   Place at: assets/js/hero-type.js
   Requires in index.html:
     <h1 class="kinetic">CRaWL working on
       <span class="kinetic-line">
         <span class="kinetic-text" id="heroRotate"></span><span class="kinetic-caret" id="heroCaret"></span>
       </span>
     </h1>
   ============================================================ */
(function () {
  "use strict";

  var CFG = {
    phrases: [
      "Urban Flooding",
      "Digital Twin Flood Modelling",
      "AI–ML Flood Assessment",
      "Drought–Flood Compound Risk",
      "Multi-Hazard Assessment using Deep Learning",
      "Water Security under Climate Change",
      "Hydroclimatic Extremes"
    ],

    /* "type"  — typewriter: writes the phrase out, pauses, erases, next
       "fade"  — whole phrase swaps at once (use this for very fast cycling) */
    mode: "type",

    typeSpeed: 45,     // ms per character while writing   (type mode)
    eraseSpeed: 25,    // ms per character while erasing   (type mode)
    hold: 1600,        // ms the finished phrase stays on screen
    swap: 300,         // ms cross-fade duration           (fade mode)

    shuffle: false,    // true = random order instead of the list order
    debug: false
  };

  var el, caret, i = 0, timer = null, alive = true;

  function log() { if (CFG.debug && window.console) console.log.apply(console, arguments); }
  function next() { i = (i + 1) % CFG.phrases.length; }
  function wait(ms, fn) { timer = setTimeout(fn, ms); }

  /* ---------------- typewriter ---------------- */
  function typeCycle() {
    if (!alive) return;
    var text = CFG.phrases[i], n = 0;

    (function write() {
      if (!alive) return;
      el.textContent = text.slice(0, ++n);
      if (n < text.length) return wait(CFG.typeSpeed, write);
      wait(CFG.hold, erase);
    })();

    function erase() {
      if (!alive) return;
      var m = text.length;
      (function back() {
        if (!alive) return;
        el.textContent = text.slice(0, --m);
        if (m > 0) return wait(CFG.eraseSpeed, back);
        next();
        wait(160, typeCycle);
      })();
    }
  }

  /* ---------------- fade swap ---------------- */
  function fadeCycle() {
    if (!alive) return;
    el.textContent = CFG.phrases[i];
    el.classList.add("is-in");
    wait(CFG.hold, function () {
      el.classList.remove("is-in");
      wait(CFG.swap, function () { next(); fadeCycle(); });
    });
  }

  function init() {
    el = document.getElementById("heroRotate");
    caret = document.getElementById("heroCaret");
    if (!el) { log("[hero-type] #heroRotate not found"); return; }

    if (CFG.shuffle) {
      for (var k = CFG.phrases.length - 1; k > 0; k--) {
        var j = Math.floor(Math.random() * (k + 1));
        var t = CFG.phrases[k]; CFG.phrases[k] = CFG.phrases[j]; CFG.phrases[j] = t;
      }
    }

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var mode = reduce ? "fade" : CFG.mode;
    if (reduce) CFG.hold = Math.max(CFG.hold, 2500);

    if (mode === "fade") {
      el.classList.add("fade-mode");
      if (caret) caret.style.display = "none";
      fadeCycle();
    } else {
      el.classList.add("type-mode");
      typeCycle();
    }
    log("[hero-type] running in", mode, "mode over", CFG.phrases.length, "phrases");

    // stop the timers while the tab is hidden
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { alive = false; clearTimeout(timer); }
      else if (!alive) { alive = true; (mode === "fade" ? fadeCycle : typeCycle)(); }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
