/* ==========================================================
   CRaWL — HERO WATER  (v3, WebGL surface with splashes)
   File: assets/js/hero-water.js
   ----------------------------------------------------------
   A real water surface, not a drawing of one.

   Every pixel of the hero casts a ray from a camera 2.35 m
   above open water and hits the surface somewhere between
   about 2 m and 15 m away. The wave field is evaluated at
   that point, the normal is taken from it, and the pixel is
   lit: sky reflected through a Fresnel term, sun broken into
   glints on the crests, deep water showing through where the
   surface faces you. That is what gives the perspective and
   the depth — the near water is coarse and dark, the far
   water compresses and hazes out into the page.

   Splashes land continuously: rings spread outward from each
   impact, deform the surface, throw a crown of foam, and die
   away. They are also thrown wherever the pointer moves over
   the hero, so the water answers the reader.

   The wave machinery — ridged noise, anisotropy along the
   wind, drifting octaves on non-doubling frequencies, gusts,
   domain warp, distance LOD — is the same approach as the
   water.js in the flood viewer, so the two look like the same
   substance.

   No dependencies, no three.js, no textures. If WebGL is
   unavailable the file falls back to a layered 2D canvas
   surface at the bottom of this file.

   TUNING: the block of constants at the top of the shader.
   ========================================================== */
(function () {
  "use strict";

  var hero = document.querySelector(".hero");
  if (!hero) return;

  var canvas = document.getElementById("heroWater");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "heroWater";
    canvas.className = "hero-water";
    canvas.setAttribute("aria-hidden", "true");
    hero.insertBefore(canvas, hero.firstChild);
  }

  var still = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- camera, shared by the shader and by the pointer maths ---- */
  var CAM_H = 2.35;      /* metres above the surface        */
  var PITCH = 0.64;      /* radians below horizontal        */
  var FOV   = 1.05;      /* larger = wider                  */
  var MAXS  = 6;         /* splashes alive at once          */

  var VERT =
    "attribute vec2 aPos;" +
    "void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }";

  var FRAG = [
    "precision highp float;",
    "uniform vec2  uRes;",
    "uniform float uTime;",
    "uniform vec4  uSplash[" + MAXS + "];",   /* x, z, birth time, strength */

    /* ---------------- tuning ---------------- */
    "const float CAM_H = " + CAM_H.toFixed(3) + ";",
    "const float PITCH = " + PITCH.toFixed(3) + ";",
    "const float FOV   = " + FOV.toFixed(3) + ";",
    "const float SCALE = 2.00;",   /* ripple size: higher = finer      */
    "const float SPEED = 0.55;",   /* how fast crests travel downwind  */
    "const float ANISO = 2.40;",   /* crests drawn out across the wind */
    "const float WARP  = 0.75;",   /* how much crests bend             */
    "const float GUST  = 0.30;",   /* depth of calm / rough patching   */
    "const float CHOP  = 0.22;",   /* steepness of the normals         */
    "const float NEAR  = 6.5;",    /* haze starts                      */
    "const float FAR   = 15.0;",   /* water has faded out entirely     */
    "const vec2  WIND  = vec2(0.9285, 0.3714);",
    "const vec3  SUN   = vec3(-0.34, 0.40, -0.85);",
    "const vec3  DEEP  = vec3(0.031, 0.129, 0.243);",
    "const vec3  BODY  = vec3(0.086, 0.325, 0.518);",
    "const vec3  SHAL  = vec3(0.239, 0.541, 0.741);",
    "const vec3  FOAM  = vec3(0.870, 0.945, 1.000);",
    "const vec3  HAZE  = vec3(0.043, 0.169, 0.322);",

    /* ---------------- noise ---------------- */
    /* hash without sin(): mobile drivers band badly on the sin trick */
    "float hash(vec2 p){",
    "  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));",
    "  q += dot(q, q.yzx + 33.33);",
    "  return fract((q.x + q.y) * q.z);",
    "}",
    "float noise(vec2 p){",
    "  vec2 i = floor(p), f = fract(p);",
    "  vec2 u = f * f * (3.0 - 2.0 * f);",
    "  return mix(mix(hash(i), hash(i + vec2(1.0,0.0)), u.x),",
    "             mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);",
    "}",
    /* abs() around signed noise: sharp crests, broad troughs — the
       asymmetry the eye reads as liquid rather than as hills */
    "float ridge(vec2 p){ return 1.0 - abs(noise(p) * 2.0 - 1.0); }",

    /* world into wind space: along the wind, and squashed across it */
    "vec2 windSpace(vec2 p){",
    "  return vec2(dot(p, WIND), dot(p, vec2(-WIND.y, WIND.x)) / ANISO);",
    "}",

    /* frequencies deliberately not powers of two, weights flatter than
       a halving series — real ripple keeps energy at the fine end */
    "const vec4 OCT_F = vec4(1.00, 2.11, 4.33, 8.69);",
    "const vec4 OCT_W = vec4(0.32, 0.27, 0.23, 0.18);",

    "float waves(vec2 q, float t, vec4 lod){",
    "  vec2 p = windSpace(q);",
    "  vec2 d = vec2(t, 0.0);",
    "  float s = 0.0;",
    "  s += ridge(p * OCT_F.x + d * 0.55)        * OCT_W.x * lod.x;",
    "  s += ridge(p * OCT_F.y - d * 0.33 + 17.3) * OCT_W.y * lod.y;",
    "  s += ridge(p * OCT_F.z + d * 0.92 + 41.7) * OCT_W.z * lod.z;",
    "  s += ridge(p * OCT_F.w - d * 1.45 + 73.1) * OCT_W.w * lod.w;",
    "  return s;",
    "}",

    /* octaves retire with distance, or they alias into shimmer */
    "vec4 lodW(float dist){",
    "  vec4 cut = 70.0 / (SCALE * OCT_F);",
    "  return 1.0 - smoothstep(cut * 0.6, cut * 1.7, vec4(dist));",
    "}",

    /* ---------------- splashes ---------------- */
    /* an expanding ring, steepest at the front, decaying with age */
    "float splashH(vec2 p, float t){",
    "  float h = 0.0;",
    "  for(int i = 0; i < " + MAXS + "; i++){",
    "    vec4 s = uSplash[i];",
    "    float age = max(t - s.z, 0.0);",
    "    float live = step(0.001, s.w) * step(age, 3.2);",
    "    float d = distance(p, s.xy);",
    "    float front = age * 1.55;",
    "    float band = exp(-abs(d - front) * 3.4) * exp(-age * 0.85);",
    "    h += sin((d - front) * 13.0) * band * s.w * 0.80 * live;",
    "    h -= exp(-d * 6.0) * exp(-age * 5.0) * s.w * 0.35 * live;",   /* the pit */
    "  }",
    "  return h;",
    "}",
    /* white water: the crown at the impact, then foam riding the ring */
    "float splashFoam(vec2 p, float t){",
    "  float f = 0.0;",
    "  for(int i = 0; i < " + MAXS + "; i++){",
    "    vec4 s = uSplash[i];",
    "    float age = max(t - s.z, 0.0);",
    "    float live = step(0.001, s.w) * step(age, 2.4);",
    "    float d = distance(p, s.xy);",
    "    float front = age * 1.55;",
    "    f += exp(-abs(d - front) * 7.0) * exp(-age * 2.1) * s.w * 0.75 * live;",
    "    f += smoothstep(0.34, 0.0, d) * exp(-age * 5.5) * s.w * live;",
    "  }",
    "  return f;",
    "}",

    /* ---------------- surface ---------------- */
    /* The warp and the gust are sampled once and shared by all three
       taps below: six noise lookups saved per pixel, for a derivative
       that is very slightly wrong and that nobody can see. */
    "void surf3(vec2 pw, float t, vec4 lod, float e,",
    "           out float h0, out float hx, out float hz){",
    "  vec2 q = pw * SCALE;",
    "  vec2 warp = vec2(noise(q * 0.21 + vec2( t * 0.05, -t * 0.03)),",
    "                   noise(q * 0.19 + vec2(-t * 0.04,  t * 0.06) + 53.7)) - 0.5;",
    "  q += warp * WARP;",
    "  float gust = noise(q * 0.06 + WIND * t * 0.03);",
    "  float amp = mix(1.0 - GUST, 1.0 + GUST, gust);",
    "  float wsum = max(dot(OCT_W, lod), 0.02);",
    "  float k = smoothstep(0.0, 0.06, dot(OCT_W, lod));",
    "  vec2 ex = vec2(e * SCALE, 0.0);",
    "  vec2 ez = vec2(0.0, e * SCALE);",
    "  h0 = mix(0.5, waves(q,      t, lod) * amp / wsum, k) + splashH(pw, uTime);",
    "  hx = mix(0.5, waves(q + ex, t, lod) * amp / wsum, k) + splashH(pw + vec2(e, 0.0), uTime);",
    "  hz = mix(0.5, waves(q + ez, t, lod) * amp / wsum, k) + splashH(pw + vec2(0.0, e), uTime);",
    "}",

    "vec3 sky(vec3 rd){",
    "  float u = clamp(rd.y * 0.5 + 0.5, 0.0, 1.0);",
    "  vec3 c = mix(vec3(0.36, 0.56, 0.75), vec3(0.07, 0.22, 0.42),",
    "               smoothstep(0.50, 0.98, u));",
    "  float s = max(dot(rd, normalize(SUN)), 0.0);",
    "  c += vec3(1.00, 0.94, 0.82) * pow(s, 260.0) * 1.7;",
    "  c += vec3(0.50, 0.68, 0.88) * pow(s, 7.0) * 0.10;",
    "  return c;",
    "}",

    "void main(){",
    "  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;",

    /* camera basis: pitched down, no roll */
    "  vec3 f = normalize(vec3(0.0, -sin(PITCH), -cos(PITCH)));",
    "  vec3 r = vec3(1.0, 0.0, 0.0);",
    "  vec3 up = cross(r, f);",
    "  vec3 rd = normalize(f + uv.x * FOV * r + uv.y * FOV * up);",

    /* above the horizon there is no water — let the page show through */
    "  if(rd.y > -0.004){ gl_FragColor = vec4(0.0); return; }",

    "  float dist = CAM_H / -rd.y;",
    "  vec3  p = vec3(0.0, CAM_H, 0.0) + rd * dist;",
    "  float t = uTime * SPEED;",
    "  vec4  lod = lodW(dist);",

    "  float e = 0.030;",
    "  float h0, hx, hz;",
    "  surf3(p.xz, t, lod, e, h0, hx, hz);",
    "  vec3 n = normalize(vec3(-(hx - h0) * CHOP / e, 1.0, -(hz - h0) * CHOP / e));",

    "  vec3 V = -rd;",
    "  vec3 L = normalize(SUN);",
    "  vec3 H = normalize(L + V);",
    "  float ndh = max(dot(n, H), 0.0);",
    "  float crest = smoothstep(0.58, 0.85, h0);",

    /* body colour: three stops, because water spends most of its area
       in the mid tone with crests and troughs as the exceptions */
    "  vec3 base = mix(DEEP, BODY, smoothstep(0.30, 0.58, h0));",
    "  base = mix(base, SHAL, smoothstep(0.62, 0.85, h0));",

    "  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(n, V), 0.0), 5.0);",
    "  vec3 col = mix(base, sky(reflect(rd, n)), clamp(fres, 0.0, 1.0) * 0.88);",

    "  col += pow(ndh,  90.0) * 0.22 * vec3(1.00, 0.96, 0.90) * lod.y;",
    "  col += pow(ndh, 900.0) * 2.40 * crest * vec3(1.00, 0.97, 0.90) * lod.z;",

    /* whitecaps where the surface is both high and steep, broken up so
       the foam has an edge rather than an outline */
    "  float grain = noise(p.xz * 9.0 + t * 0.6);",
    "  float caps = smoothstep(0.74, 0.92, h0) * smoothstep(0.25, 0.85, grain) * 0.50;",
    "  float foam = clamp(caps + splashFoam(p.xz, uTime) * (0.55 + 0.45 * grain), 0.0, 1.0);",
    "  col = mix(col, FOAM, foam * lod.y);",

    /* haze into the page, then out entirely — no hard horizon line */
    "  float far = smoothstep(NEAR, FAR, dist);",
    "  col = mix(col, HAZE, far * 0.92);",
    "  float a = 1.0 - smoothstep(NEAR + 2.0, FAR, dist);",
    "  gl_FragColor = vec4(col, a);",
    "}"
  ].join("\n");

  /* ==========================================================
     WebGL setup
     ========================================================== */
  var gl = null;
  try {
    gl = canvas.getContext("webgl", {
      alpha: true, premultipliedAlpha: false, antialias: false,
      depth: false, stencil: false, powerPreference: "low-power"
    }) || canvas.getContext("experimental-webgl", { alpha: true, premultipliedAlpha: false });
  } catch (e) { gl = null; }

  if (!gl) { fallback2D(); return; }

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      if (window.console) console.warn("hero water:", gl.getShaderInfoLog(sh));
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
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, "uRes");
  var uTime = gl.getUniformLocation(prog, "uTime");
  var uSplash = gl.getUniformLocation(prog, "uSplash");

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  /* ---------- size ---------- */
  var W = 0, H = 0;

  function resize() {
    var rect = hero.getBoundingClientRect();
    var cssW = Math.max(320, Math.round(rect.width));
    var cssH = Math.max(300, Math.round(rect.height));
    /* a fragment-heavy shader gains nothing from a retina buffer, and
       water upscales invisibly — so render at 1x, less on big screens */
    var scale = Math.min(window.devicePixelRatio || 1, 1.0);
    if (cssW * cssH * scale * scale > 1500000) scale *= 0.75;
    W = Math.round(cssW * scale);
    H = Math.round(cssH * scale);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    gl.viewport(0, 0, W, H);
  }

  /* ---------- splashes ---------- */
  var splash = new Float32Array(MAXS * 4);
  var slot = 0;

  function addSplash(x, z, strength, now) {
    var i = slot * 4;
    splash[i] = x; splash[i + 1] = z; splash[i + 2] = now; splash[i + 3] = strength;
    slot = (slot + 1) % MAXS;
  }

  /* screen point (uv in the shader's units) onto the water plane */
  function planeAt(ux, uy) {
    var f = [0, -Math.sin(PITCH), -Math.cos(PITCH)];
    var up = [0, Math.cos(PITCH), -Math.sin(PITCH)];
    var d = [ux * FOV, f[1] + uy * FOV * up[1], f[2] + uy * FOV * up[2]];
    var len = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
    d[0] /= len; d[1] /= len; d[2] /= len;
    if (d[1] > -0.02) return null;
    var t = CAM_H / -d[1];
    return [d[0] * t, d[2] * t];
  }

  function randomSplash(now) {
    var p = planeAt((Math.random() - 0.5) * 1.5, Math.random() * 0.72 - 0.5);
    if (p) addSplash(p[0], p[1], 0.55 + Math.random() * 0.85, now);
  }

  var lastPointer = 0;
  hero.addEventListener("pointermove", function (ev) {
    if (still) return;
    var now = clock;
    if (now - lastPointer < 0.10) return;
    lastPointer = now;
    var rect = hero.getBoundingClientRect();
    var ux = (ev.clientX - rect.left - rect.width / 2) / rect.height;
    var uy = (rect.height - (ev.clientY - rect.top) - rect.height / 2) / rect.height;
    var p = planeAt(ux, uy);
    if (p) addSplash(p[0], p[1], 0.5, now);
  }, { passive: true });

  /* ---------- loop ---------- */
  var running = false, visible = true, last = 0, clock = 0, raf = 0, nextDrop = 0;

  function render() {
    gl.uniform2f(uRes, W, H);
    gl.uniform1f(uTime, clock);
    gl.uniform4fv(uSplash, splash);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now) {
    if (!running) return;
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;
    clock += dt;
    if (clock > nextDrop) {
      randomSplash(clock);
      nextDrop = clock + 0.35 + Math.random() * 0.85;
    }
    render();
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
  if (still) { render(); } else { start(); }

  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { resize(); if (still) render(); }, 160);
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

  /* ==========================================================
     FALLBACK — layered 2D surface, for anything without WebGL
     ========================================================== */
  function fallback2D() {
    var ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx) {
      /* a canvas keeps the first context type it was given, so if WebGL
         already claimed this one, swap in a fresh element */
      var fresh = document.createElement("canvas");
      fresh.id = canvas.id;
      fresh.className = canvas.className;
      fresh.setAttribute("aria-hidden", "true");
      canvas.parentNode.replaceChild(fresh, canvas);
      canvas = fresh;
      ctx = canvas.getContext("2d");
      if (!ctx) return;
    }

    var L = [
      { b: 0.30, a: [17, 9, 4], l: [900, 400, 170], s: [11, -7, 5],
        top: "rgba(66,150,208,0.22)", bot: "rgba(10,46,86,0.03)" },
      { b: 0.48, a: [23, 12, 6], l: [690, 300, 130], s: [-17, 11, -8],
        top: "rgba(44,124,190,0.30)", bot: "rgba(8,38,74,0.12)" },
      { b: 0.68, a: [26, 13, 6], l: [520, 230, 100], s: [22, -14, 10],
        top: "rgba(26,92,158,0.40)", bot: "rgba(6,30,60,0.28)" },
      { b: 0.87, a: [22, 10, 4], l: [400, 175, 80], s: [-30, 18, -12],
        top: "rgba(14,62,114,0.55)", bot: "rgba(5,22,48,0.50)" }
    ];
    var w = 0, h = 0, g = [], t0 = 0;

    function size() {
      var r = hero.getBoundingClientRect();
      var d = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(320, Math.round(r.width));
      h = Math.max(300, Math.round(r.height));
      canvas.width = Math.round(w * d);
      canvas.height = Math.round(h * d);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(d, 0, 0, d, 0, 0);
      g = L.map(function (y) {
        var gr = ctx.createLinearGradient(0, y.b * h - 40, 0, h);
        gr.addColorStop(0, y.top); gr.addColorStop(1, y.bot);
        return gr;
      });
    }
    function y(ly, x, t) {
      return ly.b * h +
        ly.a[0] * Math.sin((x + t * ly.s[0]) / ly.l[0]) +
        ly.a[1] * Math.sin((x + t * ly.s[1]) / ly.l[1] + 1.7) +
        ly.a[2] * Math.sin((x + t * ly.s[2]) / ly.l[2] + 3.9);
    }
    function paint(t) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < L.length; i++) {
        var ly = L[i], x;
        ctx.beginPath();
        ctx.moveTo(0, y(ly, 0, t));
        for (x = 8; x <= w + 8; x += 8) ctx.lineTo(x, y(ly, x, t));
        ctx.lineTo(w + 8, h); ctx.lineTo(0, h); ctx.closePath();
        ctx.fillStyle = g[i]; ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, y(ly, 0, t));
        for (x = 8; x <= w + 8; x += 8) ctx.lineTo(x, y(ly, x, t));
        ctx.strokeStyle = "rgba(190,228,252,0.18)"; ctx.lineWidth = 1.3; ctx.stroke();
      }
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
