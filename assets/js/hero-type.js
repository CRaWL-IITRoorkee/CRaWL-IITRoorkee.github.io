/* ============================================================
   CRaWL — Home hero kinetic headline
   Place at: assets/js/hero-type.js
   Markup expected in index.html:
     <h1 class="kinetic">
       <span class="kinetic-eyebrow">CRaWL working on</span>
       <span class="kinetic-line" id="heroRotate" aria-hidden="true"></span>
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
      "Human Health Risks from Contaminated Flood",
      "Glacial Outburst Flood",
      "Multi-Hazard Assessment using Deep Learning",
      "Water Security under Climate Change",
      "Hydroclimatic Extremes"
    ],

    /* "reveal" — characters rise + unblur in sequence, then peel away (recommended)
       "type"   — classic typewriter with a caret
       "fade"   — whole phrase swaps at once                                        */
    mode: "reveal",

    hold: 2200,        // ms the finished phrase stays fully visible
    stagger: 26,       // ms between characters coming in   (reveal mode)
    outStagger: 12,    // ms between characters going out   (reveal mode)
    typeSpeed: 45,     // ms per character                  (type mode)
    eraseSpeed: 25,
    swap: 320,         // ms cross-fade                     (fade mode)

    shuffle: false,
    debug: false
  };

  var el, i = 0, timers = [], alive = true, mode;

  function log() { if (CFG.debug && window.console) console.log.apply(console, arguments); }
  function next() { i = (i + 1) % CFG.phrases.length; }
  function wait(ms, fn) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearAll() { timers.forEach(clearTimeout); timers = []; }

  /* ---------------- reveal: per-character choreography ---------------- */

  var GRADIENT = "linear-gradient(96deg,#8fdcff 0%,#4da3ff 42%,#9db8ff 100%)";

  /* Paint one continuous gradient across the whole line by giving every
     character the same background image, sized to the line box, and offset by
     that character's own position. Each character therefore carries its own
     background and survives being promoted to a compositing layer — unlike a
     background-clip:text set on the parent, which silently renders nothing
     once a descendant has a filter or will-change on it.

     Positions come from offsetLeft/offsetTop, NOT getBoundingClientRect():
     the characters are measured while still transformed (translateY + scale)
     for the reveal, and a client rect reports the transformed box. That shifts
     every background up by ~0.42em and shears the bottom off the glyphs on the
     last line. Offset values are layout positions and ignore transforms. */
  function paintGradient(chars) {
    if (!chars.length) return;
    var w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return;                           // not laid out yet — keep solid colour

    var pad = Math.round(parseFloat(getComputedStyle(el).fontSize) * 0.4) || 12;
    var bgH = h + pad;                              // headroom so descenders never clip
    var x0 = el.offsetLeft, y0 = el.offsetTop;

    for (var k = 0; k < chars.length; k++) {
      var s = chars[k];
      s.style.backgroundImage = GRADIENT;
      s.style.backgroundSize = w + "px " + bgH + "px";
      s.style.backgroundPosition = -(s.offsetLeft - x0) + "px " + -(s.offsetTop - y0) + "px";
      s.style.backgroundRepeat = "no-repeat";
      s.classList.add("grad");
    }
  }

  function splitInto(text) {
    el.textContent = "";
    var chars = [];
    text.split(/(\s+)/).forEach(function (chunk) {
      if (/^\s+$/.test(chunk)) { el.appendChild(document.createTextNode(" ")); return; }
      var word = document.createElement("span");
      word.className = "kw";                       // keeps words from breaking mid-air
      chunk.split("").forEach(function (c) {
        var s = document.createElement("span");
        s.className = "kc";
        s.textContent = c;
        word.appendChild(s);
        chars.push(s);
      });
      el.appendChild(word);
    });
    return chars;
  }

  function revealCycle() {
    if (!alive) return;
    var chars = splitInto(CFG.phrases[i]);

    chars.forEach(function (s, k) { s.style.transitionDelay = (k * CFG.stagger) + "ms"; });
    paintGradient(chars);                       // measure once, while still invisible
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        chars.forEach(function (s) { s.classList.add("in"); });
      });
    });

    var inDone = chars.length * CFG.stagger + 620;
    wait(inDone + CFG.hold, function () {
      if (!alive) return;
      chars.forEach(function (s, k) {
        s.style.transitionDelay = (k * CFG.outStagger) + "ms";
        s.classList.remove("in");
        s.classList.add("out");
      });
      wait(chars.length * CFG.outStagger + 420, function () { next(); revealCycle(); });
    });
  }

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
      var m = text.length;
      (function back() {
        if (!alive) return;
        el.textContent = text.slice(0, --m);
        if (m > 0) return wait(CFG.eraseSpeed, back);
        next(); wait(160, typeCycle);
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

  function run() { (mode === "type" ? typeCycle : mode === "fade" ? fadeCycle : revealCycle)(); }

  function init() {
    el = document.getElementById("heroRotate");
    if (!el) { log("[hero-type] #heroRotate not found"); return; }

    if (CFG.shuffle) {
      for (var k = CFG.phrases.length - 1; k > 0; k--) {
        var j = Math.floor(Math.random() * (k + 1));
        var t = CFG.phrases[k]; CFG.phrases[k] = CFG.phrases[j]; CFG.phrases[j] = t;
      }
    }

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    mode = reduce ? "fade" : CFG.mode;
    if (reduce) CFG.hold = Math.max(CFG.hold, 2800);

    el.classList.add(mode + "-mode");
    run();
    log("[hero-type]", mode, "mode,", CFG.phrases.length, "phrases");

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { alive = false; clearAll(); }
      else if (!alive) { alive = true; run(); }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
