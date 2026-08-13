/* ==========================================================
   CRaWL — shared site behaviour (every page loads this file)
   Header dropdowns, mobile menu, footer year.
   ========================================================== */
(function(){
  function closeMenus(){
    document.querySelectorAll(".nav .has-menu.open").forEach(function(li){
      li.classList.remove("open");
      var btn = li.querySelector("button.top");
      if(btn) btn.setAttribute("aria-expanded","false");
    });
  }

  document.querySelectorAll(".nav .has-menu").forEach(function(li){
    var btn = li.querySelector("button.top");
    if(!btn) return;
    btn.addEventListener("click", function(e){
      e.stopPropagation();
      var open = li.classList.contains("open");
      closeMenus();
      li.classList.toggle("open", !open);
      btn.setAttribute("aria-expanded", String(!open));
    });
  });
  document.addEventListener("click", closeMenus);
  document.addEventListener("keydown", function(e){ if(e.key === "Escape") closeMenus(); });

  var burger = document.getElementById("burger");
  var header = document.getElementById("header");
  if(burger && header){
    burger.addEventListener("click", function(e){
      e.stopPropagation();
      var open = header.classList.toggle("nav-open");
      burger.setAttribute("aria-expanded", String(open));
    });
  }

  var yr = document.getElementById("yr");
  if(yr) yr.textContent = new Date().getFullYear();
})();


/* ==========================================================
   CRaWL — seasonal theme (Independence Day)
   ----------------------------------------------------------
   Deliberately lives inside nav.js, which every page already
   loads, so enabling the theme is a ONE-FILE change — no edits
   to any .html file are required.

   It is fully self-contained: the styling below is injected at
   runtime, and the dates/wording fall back to the defaults here
   if assets/js/site-data.js is absent or older.

   Runs ONLY inside the date window, then the site returns to
   normal on its own. Nothing to undo afterwards.

   Preview outside the window:  ?theme=on   /  ?theme=off
   Turn off early: set enabled:false in site-data.js, or change
   DEFAULTS.enabled below to false.
   ========================================================== */
(function () {
  "use strict";

  var DEFAULTS = {
    enabled: true,
    from: "2026-08-13",
    to:   "2026-08-16",
    badge: { date: "15 August", text: "Happy Independence Day" },
    hero: {
      line: 'Proud of <span class="n">our Nation</span>. Committed to <span class="p">our Planet</span>.',
      sub:  "Celebrating India\u2019s 80th Independence Day."
    },
    footerArt: true
  };

  var cfg = (window.CRAWL && window.CRAWL.theme) ? window.CRAWL.theme : DEFAULTS;
  if (!cfg.enabled) return;
  if (!cfg.from) cfg.from = DEFAULTS.from;
  if (!cfg.to) cfg.to = DEFAULTS.to;
  if (!cfg.badge) cfg.badge = DEFAULTS.badge;
  if (!cfg.hero) cfg.hero = DEFAULTS.hero;

  /* ---- is the theme active right now? ---- */
  var force = null;
  try {
    var q = (window.location.search || "").match(/[?&]theme=(on|off)/);
    if (q) force = q[1];
  } catch (e) {}

  if (force !== "on") {
    if (force === "off") return;
    function parse(d) { var p = String(d).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
    var n = new Date();
    var today = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    var to = parse(cfg.to); to.setHours(23, 59, 59, 999);
    if (today < parse(cfg.from) || today > to) return;   // outside the window
  }

  /* ---- inject the styling (no external CSS file needed) ---- */
  var style = document.createElement("style");
  style.id = "id-theme-css";
  style.textContent = `/* ==========================================================
   CRaWL — Independence Day theme
   ----------------------------------------------------------
   Every rule here is scoped to html.theme-id. That class is
   added by assets/js/theme.js only inside the date window set
   in assets/js/site-data.js. Outside the window nothing below
   applies and the site renders exactly as normal.

   Nothing in style.css is modified. To remove the theme
   permanently, delete the two <script>/<link> lines and this
   file — the site is untouched underneath.
   ========================================================== */

:root{
  --tri-saffron:#FF9933;
  --tri-green:#138808;
  --tri-navy:#000080;
  /* deeper tints for TEXT — pure saffron on white fails contrast */
  --tri-saffron-ink:#B4530A;
  --tri-green-ink:#0E6E0E;
}

/* ---- 1. tricolour rule along the top of the header ---- */
.theme-id .site-header{position:relative}
.theme-id .site-header::before{
  content:"";position:absolute;top:0;left:0;right:0;height:4px;z-index:5;
  background:linear-gradient(90deg,
    var(--tri-saffron) 0 33.33%,
    #fff 33.33% 66.66%,
    var(--tri-green) 66.66% 100%);
}
.theme-id .site-header{border-top:0}

/* ---- 2. date badge in the header ---- */
.theme-id .id-badge{
  display:inline-flex;align-items:center;gap:9px;
  margin-left:16px;padding:6px 13px 6px 11px;
  border:1px solid #E7D9C4;border-radius:999px;
  background:linear-gradient(180deg,#FFFDF8,#FFF7EC);
  line-height:1.2;white-space:nowrap;
}
.theme-id .id-badge .ribbon{
  width:16px;height:16px;border-radius:3px;flex:none;
  background:linear-gradient(180deg,
    var(--tri-saffron) 0 33.33%,
    #fff 33.33% 66.66%,
    var(--tri-green) 66.66% 100%);
  border:1px solid rgba(0,0,0,.10);
}
.theme-id .id-badge b{
  display:block;font-size:10px;font-weight:800;letter-spacing:.08em;
  text-transform:uppercase;color:var(--tri-saffron-ink);
}
.theme-id .id-badge span{
  display:block;font-size:11px;font-weight:600;color:var(--tri-green-ink);margin-top:1px;
}
/* the header is tight below 1080px — the badge would crowd the nav */
@media(max-width:1365px){.theme-id .id-badge{display:none}}

/* ---- 3. hero line ---- */
.theme-id .id-hero{
  margin-top:18px;padding-top:16px;position:relative;
  font-size:15px;font-weight:600;letter-spacing:-.01em;color:#EAF2FA;
}
.theme-id .id-hero::before{
  content:"";position:absolute;top:0;left:0;width:96px;height:3px;border-radius:2px;
  background:linear-gradient(90deg,var(--tri-saffron) 0 33.33%,#fff 33.33% 66.66%,var(--tri-green) 66.66%);
}
.theme-id .id-hero .n{color:#FFB366}
.theme-id .id-hero .p{color:#7FD37F}
.theme-id .id-hero small{
  display:block;margin-top:5px;font-size:12.5px;font-weight:400;color:#A8C4DD;
}

/* ---- 4. tricolour accent on section headings ---- */
.theme-id .impact-head::before,
.theme-id .panel-head h2::after{
  content:"";display:inline-block;vertical-align:middle;
  width:26px;height:3px;border-radius:2px;
  background:linear-gradient(90deg,var(--tri-saffron) 0 33.33%,#D8D8D8 33.33% 66.66%,var(--tri-green) 66.66%);
}
.theme-id .panel-head h2::after{margin-left:9px}
.theme-id .impact-head::before{margin-right:4px}

/* ---- 5. footer artwork band ---- */
.theme-id .site-footer{position:relative;overflow:hidden}
.theme-id .id-footer-art{
  width:100%;height:clamp(96px,15.5vw,220px);
  background:url("assets/images/independence-footer.png") no-repeat center bottom;
  background-size:cover;
  margin-top:26px;pointer-events:none;
}
/* the copyright bar sits below the artwork on solid navy, always legible */
.theme-id .foot-bottom{border-top:0;margin-top:0}

@media(max-width:760px){
  .theme-id .id-footer-art{margin-top:18px}
}

/* respect reduced-motion / print: theme is decorative only */
@media print{
  .theme-id .id-footer-art,.theme-id .id-badge{display:none}
}
`;
  document.head.appendChild(style);

  document.documentElement.classList.add("theme-id");

  /* ---- add the three pieces ---- */
  function build() {
    if (document.querySelector(".id-badge, .id-hero, .id-footer-art")) return;

    var brand = document.querySelector(".header-in .brand");
    if (brand && cfg.badge) {
      var badge = document.createElement("div");
      badge.className = "id-badge";
      badge.innerHTML = '<span class="ribbon" aria-hidden="true"></span>' +
        '<span><b>' + cfg.badge.date + '</b><span>' + cfg.badge.text + '</span></span>';
      brand.parentNode.insertBefore(badge, brand.nextSibling);
    }

    /* the hero has been redesigned once already — try several anchors */
    var anchor = document.querySelector(".hero-in h1") ||
                 document.querySelector(".hero-in .lede") ||
                 document.querySelector(".hero-in > div > *:last-child");
    if (anchor && cfg.hero) {
      var line = document.createElement("p");
      line.className = "id-hero";
      line.innerHTML = cfg.hero.line + (cfg.hero.sub ? "<small>" + cfg.hero.sub + "</small>" : "");
      anchor.parentNode.insertBefore(line, anchor.nextSibling);
    }

    var footer = document.querySelector(".site-footer");
    if (footer && cfg.footerArt !== false) {
      var art = document.createElement("div");
      art.className = "id-footer-art";
      art.setAttribute("aria-hidden", "true");
      art.setAttribute("role", "presentation");
      footer.insertBefore(art, footer.querySelector(".foot-bottom") || null);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();


/* ==========================================================
   CRaWL — Independence Day fireworks (home page only)
   ----------------------------------------------------------
   Tricolour bursts over the hero image. Deliberately sparse:
   one rocket at a time, so it reads as a touch of celebration
   rather than a screensaver.

   Runs only when ALL of these are true:
     • the seasonal theme is active (same date window)
     • the page has a .hero section (i.e. the home page)
     • the hero is actually on screen
     • the tab is visible
     • the visitor has not asked for reduced motion

   Turn it off: set fireworks:false in the theme config in
   assets/js/site-data.js, or FW_ENABLED below.
   ========================================================== */
(function () {
  "use strict";

  var FW_ENABLED = true;

  if (!document.documentElement.classList.contains("theme-id")) return;

  var cfg = (window.CRAWL && window.CRAWL.theme) || {};
  if (cfg.fireworks === false || !FW_ENABLED) return;

  if (window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  function start() {
    var hero = document.querySelector(".hero");           // home page only
    if (!hero || hero.querySelector(".id-fw")) return;

    var canvas = document.createElement("canvas");
    canvas.className = "id-fw";
    canvas.setAttribute("aria-hidden", "true");
    hero.appendChild(canvas);

    var css = document.createElement("style");
    css.textContent =
      ".theme-id .hero{position:relative}" +
      ".theme-id .id-fw{position:absolute;inset:0;width:100%;height:100%;" +
      "pointer-events:none;z-index:1;opacity:1}" +
      ".theme-id .hero-in{position:relative;z-index:2}";
    document.head.appendChild(css);

    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    function size() {
      var r = hero.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt); rt = setTimeout(size, 200);
    });

    /* saffron, white, green — plus the chakra blue as an accent */
    var COLOURS = ["255,153,51", "255,255,255", "19,136,8", "255,153,51", "19,136,8", "80,140,220"];

    var rockets = [], sparks = [], last = 0, nextLaunch = 600, raf = null;
    var GRAVITY = 0.046, FRICTION = 0.984;

    function launch() {
      /* keep bursts over open sky — the featured card fills the right
         side on desktop, so bias launches to the left of it */
      var wide = W > 1000;
      var lo = 0.06, hi = wide ? 0.60 : 0.92;
      var targetY = H * (0.06 + Math.random() * 0.20);
      var x = W * (lo + Math.random() * (hi - lo));
      rockets.push({
        x: x, y: H + 8, px: x, py: H + 8,
        vy: -(Math.sqrt(2 * GRAVITY * (H - targetY)) * 1.02),
        vx: (Math.random() - 0.5) * 0.5,
        colour: COLOURS[(Math.random() * COLOURS.length) | 0],
        targetY: targetY
      });
    }

    function burst(r) {
      /* a single burst is one colour most of the time, and occasionally
         a full tricolour — mixing every time looks muddy */
      var tri = Math.random() < 0.42;
      var n = 34 + ((Math.random() * 18) | 0);
      for (var i = 0; i < n; i++) {
        var a = (Math.PI * 2 * i) / n + Math.random() * 0.22;
        var sp = 2.0 + Math.random() * 3.0;
        sparks.push({
          x: r.x, y: r.y, px: r.x, py: r.y,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: 1, decay: 0.009 + Math.random() * 0.009,
          colour: tri ? ["255,153,51", "255,255,255", "19,136,8"][i % 3] : r.colour
        });
      }
    }

    function frame(ts) {
      raf = requestAnimationFrame(frame);
      var dt = last ? Math.min(ts - last, 48) : 16;
      last = ts;
      var k = dt / 16.67;                     // normalise to 60fps

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";

      nextLaunch -= dt;
       if (nextLaunch <= 0 && rockets.length < 3) {
        launch();
        nextLaunch = 700 + Math.random() * 900;
      }

      var i, p;
      for (i = rockets.length - 1; i >= 0; i--) {
        p = rockets[i];
        p.px = p.x; p.py = p.y;
        p.vy += GRAVITY * k;
        p.x += p.vx * k; p.y += p.vy * k;
        ctx.strokeStyle = "rgba(" + p.colour + ",0.95)";
        ctx.lineWidth = 2.4;
        ctx.shadowBlur = 8; ctx.shadowColor = "rgba(" + p.colour + ",0.8)";
        ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
        if (p.vy >= -0.6 || p.y <= p.targetY) { burst(p); rockets.splice(i, 1); }
      }

      for (i = sparks.length - 1; i >= 0; i--) {
        p = sparks[i];
        p.px = p.x; p.py = p.y;
        p.vx *= FRICTION; p.vy = p.vy * FRICTION + GRAVITY * k;
        p.x += p.vx * k; p.y += p.vy * k;
        p.life -= p.decay * k;
        if (p.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.strokeStyle = "rgba(" + p.colour + "," + Math.min(1, p.life * 1.15).toFixed(3) + ")";
        ctx.lineWidth = 2.4 * p.life + 0.5;
        ctx.shadowBlur = 7 * p.life; ctx.shadowColor = "rgba(" + p.colour + ",0.7)";
        ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
      }

      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "source-over";
    }

    /* ---- only animate when it is actually being looked at ---- */
    var running = false, onScreen = true;
    function run() {
      if (running || !onScreen || document.hidden) return;
      running = true; last = 0; raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      ctx.clearRect(0, 0, W, H);
      rockets.length = 0; sparks.length = 0;
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) {
        onScreen = e[0].isIntersecting;
        onScreen ? run() : stop();
      }, { threshold: 0.08 }).observe(hero);
    }
    document.addEventListener("visibilitychange", function () {
      document.hidden ? stop() : run();
    });

    run();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else { start(); }
})();
