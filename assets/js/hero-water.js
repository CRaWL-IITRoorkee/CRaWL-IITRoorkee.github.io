/* ==========================================================
   CRaWL — HERO WATER  (v2, natural swell)
   File: assets/js/hero-water.js   — replaces the earlier file
   ----------------------------------------------------------
   No photograph behind it any more: the hero IS the water.

   Six layers of open water, each surface built from three
   sine waves whose wavelengths do not divide into one another,
   so the pattern never visibly repeats. Each layer is filled
   with its own depth gradient, carries a lit crest, and its
   height breathes on a slow swell. Bands of caustic light
   drift under the surface and one broad glare slides across it.

   No bubbles, no droplets, no particles — those are what made
   the first version read as an effect rather than as water.

   Tuning, in LAYERS below:
     base   rest line, as a fraction of hero height
     amp    the three wave heights in px, largest first
     len    their three wavelengths in px
     sp     their three drift speeds, px per second
            (mixing signs is what keeps the surface unsettled)
     swell  how slowly that layer breathes
     top    colour at the crest, bot colour at depth
     crest  the lit line along the surface
   ========================================================== */
(function () {
  "use strict";

  var hero = document.querySelector(".hero");
  if (!hero || !window.requestAnimationFrame) return;

  var canvas = document.getElementById("heroWater");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "heroWater";
    canvas.className = "hero-water";
    canvas.setAttribute("aria-hidden", "true");
    hero.insertBefore(canvas, hero.firstChild);
  }
  var ctx = canvas.getContext && canvas.getContext("2d");
  if (!ctx) return;

  var still = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var LAYERS = [
    { base: 0.20, amp: [17, 9, 4.5], len: [980, 430, 173], sp: [ 11,  -7,   5], swell: 0.07,
      top: "rgba(72,158,214,0.20)", bot: "rgba(10,46,86,0.02)", crest: "rgba(168,216,250,0.13)" },
    { base: 0.34, amp: [21, 11, 5],  len: [820, 355, 149], sp: [-14,   9,  -6], swell: 0.09,
      top: "rgba(58,142,204,0.24)", bot: "rgba(9,42,80,0.05)",  crest: "rgba(176,222,252,0.16)" },
    { base: 0.48, amp: [24, 12, 6],  len: [690, 296, 127], sp: [ 17, -11,   8], swell: 0.11,
      top: "rgba(44,124,190,0.28)", bot: "rgba(8,38,74,0.10)",  crest: "rgba(184,226,253,0.19)" },
    { base: 0.62, amp: [26, 13, 6],  len: [575, 247, 109], sp: [-21,  13,  -9], swell: 0.13,
      top: "rgba(32,104,170,0.34)", bot: "rgba(7,33,66,0.18)",  crest: "rgba(192,230,253,0.22)" },
    { base: 0.76, amp: [26, 12, 5],  len: [478, 205,  91], sp: [ 26, -16,  11], swell: 0.16,
      top: "rgba(22,84,146,0.42)",  bot: "rgba(6,28,58,0.30)",  crest: "rgba(200,234,254,0.24)" },
    { base: 0.89, amp: [22, 10, 4],  len: [396, 171,  77], sp: [-32,  20, -13], swell: 0.19,
      top: "rgba(14,62,114,0.55)",  bot: "rgba(5,22,48,0.52)",  crest: "rgba(206,238,255,0.26)" }
  ];

  var W = 0, H = 0, dpr = 1, grads = [];

  function resize() {
    var rect = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(320, Math.round(rect.width));
    H = Math.max(300, Math.round(rect.height));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    grads = LAYERS.map(function (L) {
      var g = ctx.createLinearGradient(0, L.base * H - 40, 0, H);
      g.addColorStop(0, L.top);
      g.addColorStop(1, L.bot);
      return g;
    });
  }

  function surface(L, x, t) {
    var breathe = 1 + 0.22 * Math.sin(t * L.swell);
    return L.base * H +
      L.amp[0] * breathe * Math.sin((x + t * L.sp[0]) / L.len[0]) +
      L.amp[1] * Math.sin((x + t * L.sp[1]) / L.len[1] + 1.7) +
      L.amp[2] * Math.sin((x + t * L.sp[2]) / L.len[2] + 3.9);
  }

  function trace(L, t, step) {
    ctx.beginPath();
    ctx.moveTo(0, surface(L, 0, t));
    for (var x = step; x <= W + step; x += step) ctx.lineTo(x, surface(L, x, t));
  }

  /* long, soft bands of light travelling under the surface */
  function caustics(t, step) {
    var L = LAYERS[3], k, x, y;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (k = 0; k < 3; k++) {
      var drift = t * (9 + k * 6);
      var depth = 34 + k * 46;
      ctx.beginPath();
      for (x = 0; x <= W + step; x += step) {
        y = surface(L, x + drift, t) + depth +
            9 * Math.sin((x - drift * 1.6) / (180 + k * 70));
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(150,208,246," + (0.05 - k * 0.012).toFixed(3) + ")";
      ctx.lineWidth = 10 + k * 7;
      ctx.stroke();
    }
    ctx.restore();
  }

  /* one broad glare sliding slowly across the water */
  function glare(t) {
    var cx = W * 0.5 + Math.sin(t * 0.06) * W * 0.42;
    var cy = H * 0.46 + Math.sin(t * 0.09) * 26;
    var r = Math.max(W, H) * 0.42;
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, "rgba(140,198,240,0.10)");
    g.addColorStop(1, "rgba(140,198,240,0)");
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    var step = W > 1400 ? 9 : (W > 800 ? 7 : 5);

    for (var i = 0; i < LAYERS.length; i++) {
      var L = LAYERS[i];

      trace(L, t, step);
      ctx.lineTo(W + step, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fillStyle = grads[i];
      ctx.fill();

      trace(L, t, step);
      ctx.strokeStyle = L.crest;
      ctx.lineWidth = i > 3 ? 1.6 : 1.2;
      ctx.stroke();

      if (i === 3) caustics(t, step);
    }

    glare(t);
  }

  /* ---------- loop ---------- */
  var running = false, visible = true, last = 0, clock = 0, raf = 0;

  function frame(now) {
    if (!running) return;
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;
    clock += dt;
    draw(clock);
    raf = window.requestAnimationFrame(frame);
  }
  function start() {
    if (running || still || !visible || document.hidden) return;
    running = true;
    last = 0;
    raf = window.requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
  }

  resize();
  if (still) draw(0); else start();

  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      resize();
      if (still) draw(clock);
    }, 160);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else start();
  });

  if (window.IntersectionObserver) {
    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      if (visible) start(); else stop();
    }, { threshold: 0 }).observe(hero);
  }
})();
