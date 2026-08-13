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
      sub:  "Celebrating India\u2019s 79th Independence Day."
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
@media(max-width:1079px){.theme-id .id-badge{display:none}}

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
