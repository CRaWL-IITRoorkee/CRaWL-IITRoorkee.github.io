/* ==========================================================
   CRaWL — HERO WATER
   File: assets/js/hero-water.js
   ----------------------------------------------------------
   A living water surface behind the hero: four sine-composed
   wave layers moving at different speeds, rising bubbles and
   a light spray of droplets over the crest.

   Nothing to configure. It finds <canvas id="heroWater"> in
   .hero, or creates one if the tag is missing, and paints
   behind the headline and the Featured Research card.

   It stops itself when the hero scrolls out of view or the
   tab is hidden, and paints a single still frame for readers
   who have asked for reduced motion.

   Tuning: the LAYERS array below. `top` is the layer's rest
   line as a fraction of hero height, `amp` its wave height in
   px, `len` the wavelength in px, `speed` the drift in px per
   second (negative drifts the other way).
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

  /* ---------- wave layers, back to front ---------- */
  var LAYERS = [
    { top: 0.50, amp: 22, len: 620, speed:  26, len2: 210, amp2: 7,
      fill: "rgba(23, 88, 150, 0.26)", crest: "rgba(158, 212, 248, 0.13)" },
    { top: 0.60, amp: 18, len: 480, speed: -34, len2: 165, amp2: 6,
      fill: "rgba(18, 72, 128, 0.30)", crest: "rgba(158, 212, 248, 0.17)" },
    { top: 0.71, amp: 15, len: 360, speed:  46, len2: 130, amp2: 5,
      fill: "rgba(13, 57, 105, 0.34)", crest: "rgba(170, 220, 250, 0.20)" },
    { top: 0.82, amp: 12, len: 260, speed: -58, len2:  95, amp2: 4,
      fill: "rgba(9, 42, 80, 0.40)",  crest: "rgba(190, 230, 252, 0.22)" }
  ];

  var W = 0, H = 0, dpr = 1, bubbles = [], drops = [];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function surface(layer, x, t) {
    return layer.top * H +
      layer.amp * Math.sin((x + t * layer.speed) / layer.len) +
      layer.amp2 * Math.sin((x - t * layer.speed * 0.6) / layer.len2);
  }

  /* ---------- particles ---------- */
  function seed() {
    var nB = Math.max(26, Math.min(90, Math.round(W / 18)));
    var nD = Math.max(10, Math.min(34, Math.round(W / 52)));
    bubbles = [];
    drops = [];
    for (var i = 0; i < nB; i++) {
      bubbles.push({
        x: rand(0, W), y: rand(H * 0.45, H),
        r: rand(0.9, 3.4), vy: rand(9, 30), sway: rand(6, 20),
        phase: rand(0, Math.PI * 2), a: rand(0.06, 0.24)
      });
    }
    for (var j = 0; j < nD; j++) {
      drops.push({
        x: rand(0, W), y: rand(H * 0.18, H * 0.55),
        r: rand(0.7, 1.9), vy: rand(-16, -5), vx: rand(-9, 9),
        a: rand(0.10, 0.30)
      });
    }
  }

  function resize() {
    var rect = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(320, Math.round(rect.width));
    H = Math.max(280, Math.round(rect.height));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  /* ---------- one frame ---------- */
  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    var step = W > 1200 ? 10 : 7, i, x, y;

    for (i = 0; i < LAYERS.length; i++) {
      var L = LAYERS[i];

      ctx.beginPath();
      ctx.moveTo(0, surface(L, 0, t));
      for (x = step; x <= W; x += step) ctx.lineTo(x, surface(L, x, t));
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fillStyle = L.fill;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, surface(L, 0, t));
      for (x = step; x <= W; x += step) ctx.lineTo(x, surface(L, x, t));
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = L.crest;
      ctx.stroke();

      /* bubbles ride between the second and third layer, so they read
         as being inside the water rather than painted on top of it */
      if (i === 1) paintBubbles(t);
    }

    paintDrops(t);
  }

  function paintBubbles(t) {
    for (var i = 0; i < bubbles.length; i++) {
      var b = bubbles[i];
      var x = b.x + Math.sin(t * 0.7 + b.phase) * b.sway;
      ctx.beginPath();
      ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(203, 232, 252, " + b.a.toFixed(3) + ")";
      ctx.fill();
      if (b.r > 2.3) {
        ctx.beginPath();
        ctx.arc(x, b.y, b.r + 1.2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(203, 232, 252, " + (b.a * 0.5).toFixed(3) + ")";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }

  function paintDrops(t) {
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      ctx.beginPath();
      ctx.ellipse ? ctx.ellipse(d.x, d.y, d.r, d.r * 1.5, 0, 0, Math.PI * 2)
                  : ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(224, 243, 255, " + d.a.toFixed(3) + ")";
      ctx.fill();
    }
  }

  /* ---------- movement ---------- */
  function advance(dt, t) {
    var i, b, d;
    for (i = 0; i < bubbles.length; i++) {
      b = bubbles[i];
      b.y -= b.vy * dt;
      if (b.y + b.r < surface(LAYERS[0], b.x, t) - 6) {
        b.y = H + b.r;
        b.x = rand(0, W);
        b.r = rand(0.9, 3.4);
        b.vy = rand(9, 30);
        b.a = rand(0.06, 0.24);
      }
    }
    for (i = 0; i < drops.length; i++) {
      d = drops[i];
      d.y += d.vy * dt;
      d.x += d.vx * dt;
      d.vy += 11 * dt;                       /* gravity pulls them back down */
      if (d.y > H * 0.9 || d.x < -20 || d.x > W + 20) {
        d.x = rand(0, W);
        d.y = surface(LAYERS[1], d.x, t) - rand(2, 26);
        d.vy = rand(-16, -5);
        d.vx = rand(-9, 9);
        d.a = rand(0.10, 0.30);
      }
    }
  }

  /* ---------- loop ---------- */
  var running = false, visible = true, last = 0, clock = 0, raf = 0;

  function frame(now) {
    if (!running) return;
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;
    clock += dt;
    advance(dt, clock);
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
  if (still) { draw(0); } else { start(); }

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
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start(); else stop();
    }, { threshold: 0 }).observe(hero);
  }
})();
