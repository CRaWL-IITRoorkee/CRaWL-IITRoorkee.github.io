/* ==========================================================
   CRaWL — page-hero particles  (torus-knot particle system)
   File: assets/js/hero-particles.js
   ----------------------------------------------------------
   A knot drawn entirely out of glowing points, turning slowly
   behind the heading on the People pages.

   The geometry is a (p,q) torus knot: a curve that winds five
   times around the ring while looping four times through it,
   with points scattered around the tube at every step. It is
   the same figure as the three.js TorusKnotGeometry sample,
   and the points are lit the same way — a small radial sprite,
   white at the core through cyan to deep blue, composited
   additively so that overlapping points burn brighter and the
   dense folds of the knot glow from inside.

   Written against plain canvas rather than three.js: the whole
   thing is one file with no CDN behind it, which matters more
   on a static site than a scene graph would help. The camera,
   the rotation and the perspective divide are about thirty
   lines at the bottom.

   Drop it into any page with <section class="page-hero"> — no
   markup and no CSS to add. It writes its own stylesheet and
   inserts its own canvas.

   It stops when the hero scrolls away or the tab is hidden,
   and paints one still frame under reduced motion.
   ========================================================== */
(function () {
  "use strict";

  var CFG = {
    /* the knot */
    radius: 40,       /* ring radius                                   */
    tube: 12,         /* how thick the tube is                         */
    p: 5,             /* times the curve winds around the ring         */
    q: 4,             /* times it loops through the hole               */
    heightScale: 3.0, /* stretch along the axis                        */
    along: 300,       /* points taken along the curve (desktop)        */
    around: 8,        /* points around the tube at each step           */

    /* the view */
    at: 0.74,         /* horizontal placement, 0 = left edge, 1 = right */
    fit: 1.35,        /* share of the hero half-height the knot reaches;
                         above 1 it bleeds a little past the band, which
                         reads as an object caught mid-frame rather than a
                         motif dropped into a box                      */
    spin: 0.30,       /* radians per second                             */
    tilt: 0.42,       /* fixed lean toward the viewer                   */
    dist: 520,        /* camera distance — larger flattens perspective  */

    /* the light */
    sprite: 14,       /* px of the glow sprite at unit depth            */
    gain: 0.55        /* overall brightness                             */
  };

  var hero = document.querySelector(".page-hero");
  if (!hero || !window.requestAnimationFrame) return;

  var still = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var style = document.createElement("style");
  style.textContent =
    ".page-hero{position:relative;overflow:hidden}" +
    ".page-hero > .wrap{position:relative;z-index:2}" +
    ".hero-particles{position:absolute;left:0;top:0;width:100%;height:100%;" +
    "z-index:1;display:block;pointer-events:none}";
  document.head.appendChild(style);

  var canvas = document.createElement("canvas");
  canvas.className = "hero-particles";
  canvas.setAttribute("aria-hidden", "true");
  hero.insertBefore(canvas, hero.firstChild);

  var ctx = canvas.getContext && canvas.getContext("2d");
  if (!ctx) return;

  /* ---------- the sprite every point is drawn with ---------- */
  var glow = document.createElement("canvas");
  glow.width = glow.height = 32;
  (function () {
    var g = glow.getContext("2d");
    var grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0.00, "rgba(255,255,255,1)");
    grad.addColorStop(0.18, "rgba(186,240,255,0.92)");
    grad.addColorStop(0.42, "rgba(56,178,238,0.45)");
    grad.addColorStop(0.72, "rgba(18,86,168,0.16)");
    grad.addColorStop(1.00, "rgba(8,38,74,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 32);
  })();

  /* ---------- geometry ---------- */
  var P = [];          /* flat xyz */
  var maxR = 1;

  function curve(u, out) {
    var cu = Math.cos(u), su = Math.sin(u);
    var qp = CFG.q / CFG.p * u;
    var cs = Math.cos(qp);
    out[0] = CFG.radius * (2 + cs) * 0.5 * cu;
    out[1] = CFG.radius * (2 + cs) * 0.5 * su;
    out[2] = CFG.heightScale * CFG.radius * Math.sin(qp) * 0.5;
    return out;
  }

  function build(along, around) {
    P = [];
    maxR = 1;
    var a = [0, 0, 0], b = [0, 0, 0], c = [0, 0, 0];
    for (var i = 0; i < along; i++) {
      var u = i / along * CFG.p * Math.PI * 2;
      curve(u, a);
      curve(u + 0.01, b);
      curve(u - 0.01, c);

      /* tangent, then any two directions square to it — the frame does
         not need to be parallel-transported, the points only have to sit
         on a circle around the curve */
      var tx = b[0] - c[0], ty = b[1] - c[1], tz = b[2] - c[2];
      var tl = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1;
      tx /= tl; ty /= tl; tz /= tl;

      var rx = 0, ry = 0, rz = 1;
      if (Math.abs(tz) > 0.9) { rx = 0; ry = 1; rz = 0; }

      var nx = ty * rz - tz * ry, ny = tz * rx - tx * rz, nz = tx * ry - ty * rx;
      var nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nx /= nl; ny /= nl; nz /= nl;

      var bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;

      for (var j = 0; j < around; j++) {
        var v = j / around * Math.PI * 2;
        var cv = Math.cos(v) * CFG.tube, sv = Math.sin(v) * CFG.tube;
        var x = a[0] + cv * nx + sv * bx;
        var y = a[1] + cv * ny + sv * by;
        var z = a[2] + cv * nz + sv * bz;
        P.push(x, y, z);
        var r = Math.sqrt(x * x + y * y + z * z);
        if (r > maxR) maxR = r;
      }
    }
  }

  /* ---------- size ---------- */
  var W = 0, H = 0, scale = 1, cx = 0, cy = 0, dpr = 1;

  function resize() {
    var rect = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    W = Math.max(320, Math.round(rect.width));
    H = Math.max(120, Math.round(rect.height));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* a narrow screen gets fewer points and a centred knot, or it fights
       the heading for the same few hundred pixels */
    var narrow = W < 760;
    build(narrow ? 170 : CFG.along, narrow ? 6 : CFG.around);

    cx = (narrow ? 0.5 : CFG.at) * W;
    cy = 0.5 * H;
    /* fit the knot to the band: the furthest point of the geometry, seen
       at the camera distance, should reach `fit` of half the height */
    scale = (H * 0.5 * CFG.fit) / (maxR * (CFG.dist / (CFG.dist - maxR)));
  }

  /* ---------- draw ---------- */
  var ang = 0.9, drift = 0, lean = 0, leanTo = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";

    var ca = Math.cos(ang), sa = Math.sin(ang);
    var t = CFG.tilt + lean + Math.sin(drift * 0.17) * 0.06;
    var ct = Math.cos(t), st = Math.sin(t);
    var D = CFG.dist;
    var s0 = CFG.sprite;

    for (var i = 0; i < P.length; i += 3) {
      var x = P[i], y = P[i + 1], z = P[i + 2];

      /* spin about the vertical axis, then lean the whole thing over */
      var x2 = x * ca + z * sa;
      var z2 = z * ca - x * sa;
      var y2 = y * ct - z2 * st;
      var z3 = y * st + z2 * ct;

      var k = D / (D + z3);
      if (k <= 0) continue;

      var sx = cx + x2 * k * scale;
      var sy = cy - y2 * k * scale;
      var sz = s0 * k * 0.5;

      if (sx < -sz || sx > W + sz || sy < -sz || sy > H + sz) continue;

      /* nearer points are bigger and brighter — with additive blending
         that alone reads as depth, no sorting needed */
      ctx.globalAlpha = Math.min(1, (k * k) * 0.42 * CFG.gain);
      ctx.drawImage(glow, sx - sz, sy - sz, sz * 2, sz * 2);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  /* ---------- loop ---------- */
  var running = false, visible = true, last = 0, raf = 0;

  function frame(now) {
    if (!running) return;
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;
    ang += CFG.spin * dt;
    drift += dt;
    lean += (leanTo - lean) * Math.min(1, dt * 3);   /* ease toward pointer */
    draw();
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
  if (still) draw(); else start();

  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { resize(); if (still) draw(); }, 160);
  });

  /* the pointer tips the knot a little, which is enough to make it feel
     like an object in the page rather than a looping clip */
  hero.addEventListener("pointermove", function (ev) {
    var rect = hero.getBoundingClientRect();
    leanTo = ((ev.clientY - rect.top) / rect.height - 0.5) * 0.5;
  }, { passive: true });
  hero.addEventListener("pointerleave", function () { leanTo = 0; }, { passive: true });

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
