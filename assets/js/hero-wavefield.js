/* ==========================================================
   CRaWL — page-hero wavefield
   File: assets/js/hero-wavefield.js
   ----------------------------------------------------------
   Ribbons of light running the width of the hero: five curves,
   each built from three sines at unrelated frequencies, drawn
   as a glow rather than a stroke — brightness falls off with
   distance from the curve, and the five add together, so where
   two ribbons cross they burn white.

   Written as a single WebGL fragment shader with no three.js
   behind it. A glow like this is a distance field, and a
   distance field is what a fragment shader is for: no geometry,
   no scene graph, nothing to tessellate. The whole thing is one
   file and one draw call.

   Drop it into any page with <section class="page-hero"> — no
   markup, no CSS. It writes its own stylesheet, inserts its own
   canvas behind the heading, and cleans up after itself.

   The pointer lifts the ribbons nearest it. It stops when the
   hero scrolls away or the tab is hidden, and paints one still
   frame under reduced motion. Without WebGL it falls back to a
   2D canvas version at the foot of this file.

   TUNING: LINES in the shader — each row is
     yOff   where the ribbon sits, 0 = middle of the hero
     freq   how many waves fit across
     speed  drift, sign sets the direction
     amp    wave height
     thick  glow width — small numbers, 0.003 is a fine thread
   ========================================================== */
(function () {
  "use strict";

  var hero = document.querySelector(".page-hero");
  if (!hero) return;

  var still = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var style = document.createElement("style");
  style.textContent =
    ".page-hero{position:relative;overflow:hidden}" +
    ".page-hero > .wrap{position:relative;z-index:2}" +
    ".hero-wavefield{position:absolute;left:0;top:0;width:100%;height:100%;" +
    "z-index:1;display:block;pointer-events:none}";
  document.head.appendChild(style);

  var canvas = document.createElement("canvas");
  canvas.className = "hero-wavefield";
  canvas.setAttribute("aria-hidden", "true");
  hero.insertBefore(canvas, hero.firstChild);

  var VERT = "attribute vec2 aPos;void main(){gl_Position=vec4(aPos,0.0,1.0);}";

  var FRAG = [
    "precision highp float;",
    "uniform vec2  uRes;",
    "uniform float uTime;",
    "uniform vec2  uMouse;",   /* -1..1 across the hero, off-screen when idle */

    /* yOff, freq, speed, amp, thick — one ribbon per row */
    "const int N = 5;",

    "vec3 ribbonColour(int i){",
    "  if(i == 0) return vec3(0.25, 0.75, 1.00);",
    "  if(i == 1) return vec3(0.45, 0.90, 1.00);",
    "  if(i == 2) return vec3(0.55, 0.65, 1.00);",
    "  if(i == 3) return vec3(0.20, 0.95, 0.92);",
    "  return vec3(0.75, 0.85, 1.00);",
    "}",
    "vec4 ribbonShape(int i){",   /* yOff, freq, speed, amp */
    "  if(i == 0) return vec4(-0.15, 0.95,  0.55, 0.085);",
    "  if(i == 1) return vec4(-0.06, 0.70, -0.42, 0.105);",
    "  if(i == 2) return vec4( 0.02, 1.25,  0.72, 0.070);",
    "  if(i == 3) return vec4( 0.10, 0.85, -0.60, 0.092);",
    "  return vec4( 0.18, 1.55,  0.90, 0.055);",
    "}",
    "float ribbonThick(int i){",
    "  if(i == 0) return 0.0042;",
    "  if(i == 1) return 0.0036;",
    "  if(i == 2) return 0.0031;",
    "  if(i == 3) return 0.0038;",
    "  return 0.0027;",
    "}",

    "void main(){",
    "  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;",
    "  float maxx = 0.5 * uRes.x / uRes.y;",
    "  float t = uTime;",

    /* ribbons fade out toward the left and right edges rather than being
       cut off by them */
    "  float q = clamp(abs(uv.x) / maxx, 0.0, 1.0);",
    "  float env = clamp((1.0 - q) / 0.45, 0.0, 1.0);",
    "  env = env * env * (3.0 - 2.0 * env);",

    "  vec3 col = vec3(0.0);",

    "  for(int i = 0; i < N; i++){",
    "    vec4 s = ribbonShape(i);",
    "    float amp = s.w;",

    /* the pointer lifts whichever ribbons are near it — a local swell that
       travels with the cursor, not a global change */
    "    float near = exp(-pow((uv.x - uMouse.x) * 1.6, 2.0)) *",
    "                 exp(-pow((s.x - uMouse.y) * 3.2, 2.0));",
    "    amp *= 1.0 + near * 1.4;",

    /* three sines, no common period, so the ribbon never repeats itself */
    "    float y = amp        * sin(uv.x * s.y        + t * s.z)",
    "            + amp * 0.5  * sin(uv.x * s.y * 1.7  - t * s.z * 0.8 + 1.3)",
    "            + amp * 0.3  * sin(uv.x * s.y * 2.9  + t * s.z * 1.4 + 3.1);",

    /* glow as a distance field: bright at the curve, falling away fast */
    "    float th = ribbonThick(i);",
    "    float d = abs(uv.y - (s.x + y));",
    "    float g = pow(th / (d + th * 0.55), 1.7) * env;",
    "    col += ribbonColour(i) * g;",
    "  }",

    /* the soft bloom the ribbons sit in */
    "  float r = length(vec2(uv.x / 2.6, uv.y / 0.55));",
    "  col += vec3(0.55, 0.72, 1.00) * exp(-r * r * 2.2) * 0.16;",

    "  float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);",
    "  gl_FragColor = vec4(col, a);",
    "}"
  ].join("\n");

  var gl = null;
  try {
    gl = canvas.getContext("webgl", {
      alpha: true, premultipliedAlpha: false, antialias: false,
      depth: false, stencil: false, powerPreference: "low-power"
    });
  } catch (e) { gl = null; }

  if (!gl) { fallback2D(); return; }

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      if (window.console) console.warn("hero wavefield:", gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { fallback2D(); return; }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { fallback2D(); return; }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, "uRes");
  var uTime = gl.getUniformLocation(prog, "uTime");
  var uMouse = gl.getUniformLocation(prog, "uMouse");

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  var W = 0, H = 0, mx = -99, my = -99, tmx = -99, tmy = -99;

  function resize() {
    var rect = hero.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var cw = Math.max(320, Math.round(rect.width));
    var ch = Math.max(90, Math.round(rect.height));
    W = Math.round(cw * dpr);
    H = Math.round(ch * dpr);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = cw + "px";
    canvas.style.height = ch + "px";
    gl.viewport(0, 0, W, H);
  }

  function render(t) {
    mx += (tmx - mx) * 0.12;      /* ease, so the swell follows rather than snaps */
    my += (tmy - my) * 0.12;
    gl.uniform2f(uRes, W, H);
    gl.uniform1f(uTime, t);
    gl.uniform2f(uMouse, mx, my);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  var running = false, visible = true, last = 0, clock = 0, raf = 0;

  function frame(now) {
    if (!running) return;
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;
    clock += dt;
    render(clock);
    raf = window.requestAnimationFrame(frame);
  }
  function start() {
    if (running || still || !visible || document.hidden) return;
    running = true; last = 0;
    raf = window.requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
  }

  resize();
  if (still) render(0); else start();

  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { resize(); if (still) render(clock); }, 160);
  });

  hero.addEventListener("pointermove", function (ev) {
    var rect = hero.getBoundingClientRect();
    tmx = (ev.clientX - rect.left - rect.width / 2) / rect.height;
    tmy = -((ev.clientY - rect.top) / rect.height - 0.5);
  }, { passive: true });
  hero.addEventListener("pointerleave", function () { tmx = -99; tmy = -99; }, { passive: true });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else start();
  });
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      if (visible) start(); else stop();
    }, { threshold: 0 }).observe(hero);
  }

  /* ==========================================================
     FALLBACK — the same ribbons in 2D, for anything without WebGL
     ========================================================== */
  function fallback2D() {
    var c = canvas.getContext && canvas.getContext("2d");
    if (!c) {
      var fresh = document.createElement("canvas");
      fresh.className = canvas.className;
      fresh.setAttribute("aria-hidden", "true");
      canvas.parentNode.replaceChild(fresh, canvas);
      canvas = fresh;
      c = canvas.getContext("2d");
      if (!c) return;
    }

    var L = [
      { off: -0.15, f: 0.95, s: 0.55, a: 0.085, w: 2.6, col: "120,200,255" },
      { off: -0.06, f: 0.70, s: -0.42, a: 0.105, w: 2.2, col: "150,230,255" },
      { off: 0.02, f: 1.25, s: 0.72, a: 0.070, w: 1.9, col: "150,175,255" },
      { off: 0.10, f: 0.85, s: -0.60, a: 0.092, w: 2.3, col: "90,240,235" },
      { off: 0.18, f: 1.55, s: 0.90, a: 0.055, w: 1.7, col: "200,220,255" }
    ];
    var w = 0, h = 0, t0 = 0;

    function size() {
      var r = hero.getBoundingClientRect();
      var d = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(320, Math.round(r.width));
      h = Math.max(90, Math.round(r.height));
      canvas.width = Math.round(w * d);
      canvas.height = Math.round(h * d);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      c.setTransform(d, 0, 0, d, 0, 0);
    }

    function paint(t) {
      c.clearRect(0, 0, w, h);
      c.globalCompositeOperation = "lighter";
      for (var i = 0; i < L.length; i++) {
        var ln = L[i];
        c.beginPath();
        for (var px = 0; px <= w; px += 6) {
          var ux = (px - w / 2) / h;
          var y = ln.a * Math.sin(ux * ln.f + t * ln.s)
                + ln.a * 0.5 * Math.sin(ux * ln.f * 1.7 - t * ln.s * 0.8 + 1.3)
                + ln.a * 0.3 * Math.sin(ux * ln.f * 2.9 + t * ln.s * 1.4 + 3.1);
          var py = h / 2 + (ln.off + y) * h;
          if (px === 0) c.moveTo(px, py); else c.lineTo(px, py);
        }
        /* shadowBlur is the cheapest glow 2D canvas has */
        c.shadowBlur = 14;
        c.shadowColor = "rgba(" + ln.col + ",0.85)";
        c.strokeStyle = "rgba(" + ln.col + ",0.85)";
        c.lineWidth = ln.w;
        c.stroke();
      }
      c.shadowBlur = 0;
      c.globalCompositeOperation = "source-over";
    }

    function tick(now) {
      if (!t0) t0 = now;
      paint((now - t0) / 1000);
      window.requestAnimationFrame(tick);
    }
    size();
    window.addEventListener("resize", size);
    if (still) paint(0); else window.requestAnimationFrame(tick);
  }
})();
