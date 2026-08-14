/* ============================================================================
   CRaWL — Theme Engine
   Drop this in once and forget it. All content lives in
   assets/data/theme-calendar.js

   Install: add ONE line to each page, just before </body>

     <script src="scripts/theme-engine.js" defer></script>

   Preview any theme on any day:  yourpage.html?theme=diwali
   Turn everything off for a day: yourpage.html?theme=off
   ========================================================================= */

(function () {
  "use strict";

  var TZ = "Asia/Kolkata";

  var self = document.currentScript || (function () {
    var s = document.getElementsByTagName("script");
    return s[s.length - 1];
  })();

  // Resolve assets/data/ relative to this script's own location, so the
  // engine works from any page depth without editing paths.
  var dataUrl = self.getAttribute("data-calendar") ||
                self.src.replace(/scripts\/[^\/]*$/, "") + "assets/data/theme-calendar.js";

  loadScript(dataUrl, function () {
    try { run(window.THEME_CALENDAR); } catch (e) { /* never break the page */ }
  });

  /* ---------------------------------------------------------------- utils */

  function loadScript(src, done) {
    var s = document.createElement("script");
    s.src = src;
    s.onload = done;
    s.onerror = function () { /* no calendar, no theme — site stays normal */ };
    document.head.appendChild(s);
  }

  function todayISO() {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit"
      }).format(new Date());
    } catch (e) {
      var d = new Date();
      return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    }
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function expand(token, year) {
    return token.length === 5 ? year + "-" + token : token;
  }

  function matches(ev, today) {
    var year = today.slice(0, 4);
    var startTok = ev.on || ev.from;
    if (!startTok) return false;
    var endTok = ev.to || startTok;

    var start = expand(startTok, year);
    var end = expand(endTok, year);

    if (end < start) {                       // window crosses new year
      return today >= start || today <= end;
    }
    return today >= start && today <= end;
  }

  /* ----------------------------------------------------------------- main */

  function run(cal) {
    if (!cal || !cal.events) return;
    var cfg = cal.settings || {};

    var forced = new URLSearchParams(location.search).get("theme");
    if (forced === "off") return;

    var event = null;

    if (forced) {
      for (var i = 0; i < cal.events.length; i++) {
        if (cal.events[i].id === forced) { event = cal.events[i]; break; }
      }
    } else {
      var today = todayISO();
      var best = -1;
      for (var j = 0; j < cal.events.length; j++) {
        var ev = cal.events[j];
        if (matches(ev, today)) {
          var p = ev.priority || 0;
          if (p > best) { best = p; event = ev; }
        }
      }
    }

    if (!event) return;
    apply(event, cfg);
  }

  function apply(ev, cfg) {
    var v = ev.vars || {};
    var accent = v.accent || "#0B6FA4";
    var soft = v.accentSoft || "#E6F1F8";
    var ink = v.ink || "#10243A";

    document.documentElement.setAttribute("data-theme", ev.id);
    document.documentElement.style.setProperty("--theme-accent", accent);
    document.documentElement.style.setProperty("--theme-accent-soft", soft);
    document.documentElement.style.setProperty("--theme-ink", ink);

    inject(BASE_CSS + (cfg.globalCss || "") + (ev.css || ""));

    if (cfg.showRibbon === false) return;
    ready(function () { ribbon(ev, cfg); });
  }

  function inject(css) {
    var s = document.createElement("style");
    s.id = "theme-engine-style";
    s.textContent = css;
    document.head.appendChild(s);
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else { fn(); }
  }

  function ribbon(ev, cfg) {
    var key = "theme-dismissed:" + ev.id;
    try { if (sessionStorage.getItem(key)) return; } catch (e) {}

    var bar = document.createElement("div");
    bar.className = "crawl-theme-bar" + (cfg.placement === "bottom" ? " is-bottom" : "");
    bar.setAttribute("role", "note");

    var motif = document.createElement("span");
    motif.className = "crawl-theme-motif motif-" + (ev.motif || "none");
    motif.setAttribute("aria-hidden", "true");
    for (var k = 0; k < 7; k++) motif.appendChild(document.createElement("i"));

    var text = document.createElement("p");
    text.className = "crawl-theme-text";
    var strong = document.createElement("strong");
    strong.textContent = ev.name;
    text.appendChild(strong);
    if (ev.tagline) {
      text.appendChild(document.createTextNode(" \u2014 " + ev.tagline));
    }

    bar.appendChild(motif);
    bar.appendChild(text);

    if (ev.link && ev.link.href) {
      var a = document.createElement("a");
      a.className = "crawl-theme-link";
      a.href = ev.link.href;
      a.textContent = ev.link.label || "Read more";
      bar.appendChild(a);
    }

    if (cfg.dismissible !== false) {
      var btn = document.createElement("button");
      btn.className = "crawl-theme-close";
      btn.type = "button";
      btn.setAttribute("aria-label", "Hide the " + ev.name + " banner");
      btn.textContent = "\u00D7";
      btn.onclick = function () {
        bar.remove();
        try { sessionStorage.setItem(key, "1"); } catch (e) {}
      };
      bar.appendChild(btn);
    }

    if (cfg.placement === "bottom") {
      document.body.appendChild(bar);
    } else {
      document.body.insertBefore(bar, document.body.firstChild);
    }
  }

  /* ------------------------------------------------------------- ribbon CSS
     Confined to the ribbon on purpose: the rest of the site keeps its own
     layout, and only the accent variables change underneath it.            */

  var BASE_CSS = [
    ".crawl-theme-bar{position:relative;display:flex;align-items:center;gap:.75rem;",
    "padding:.6rem 2.6rem .6rem 1rem;background:var(--theme-accent-soft);",
    "color:var(--theme-ink);border-bottom:3px solid var(--theme-accent);",
    "font-size:.92rem;line-height:1.35;overflow:hidden;z-index:9999;",
    "font-family:inherit;}",

    ".crawl-theme-bar.is-bottom{position:fixed;left:0;right:0;bottom:0;",
    "border-bottom:0;border-top:3px solid var(--theme-accent);",
    "box-shadow:0 -2px 12px rgba(0,0,0,.12);}",

    ".crawl-theme-text{margin:0;flex:1 1 auto;}",
    ".crawl-theme-text strong{color:var(--theme-accent);letter-spacing:.01em;}",

    ".crawl-theme-link{flex:0 0 auto;padding:.28rem .7rem;border-radius:999px;",
    "background:var(--theme-accent);color:#fff;text-decoration:none;",
    "font-size:.82rem;white-space:nowrap;}",
    ".crawl-theme-link:hover{filter:brightness(1.1);}",

    ".crawl-theme-close{position:absolute;top:50%;right:.5rem;transform:translateY(-50%);",
    "width:1.6rem;height:1.6rem;border:0;border-radius:50%;background:transparent;",
    "color:var(--theme-ink);font-size:1.2rem;line-height:1;cursor:pointer;opacity:.55;}",
    ".crawl-theme-close:hover{opacity:1;background:rgba(0,0,0,.07);}",
    ".crawl-theme-close:focus-visible,.crawl-theme-link:focus-visible{",
    "outline:2px solid var(--theme-accent);outline-offset:2px;}",

    /* motif strip */
    ".crawl-theme-motif{flex:0 0 auto;display:flex;align-items:center;gap:.35rem;height:1.1rem;}",
    ".crawl-theme-motif i{display:block;border-radius:50%;background:var(--theme-accent);}",
    ".motif-none{display:none;}",

    ".motif-ripple i{width:.4rem;height:.4rem;opacity:.35;",
    "animation:crawl-ripple 2.4s ease-in-out infinite;}",
    "@keyframes crawl-ripple{0%,100%{transform:translateY(0);opacity:.3}",
    "50%{transform:translateY(-.3rem);opacity:.9}}",

    ".motif-drops i{width:.28rem;height:.5rem;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;",
    "animation:crawl-drop 1.8s ease-in infinite;}",
    "@keyframes crawl-drop{0%{transform:translateY(-.5rem);opacity:0}",
    "40%{opacity:1}100%{transform:translateY(.5rem);opacity:0}}",

    ".motif-diyas i{width:.38rem;height:.38rem;box-shadow:0 0 .45rem var(--theme-accent);",
    "animation:crawl-flame 1.6s ease-in-out infinite;}",
    "@keyframes crawl-flame{0%,100%{opacity:.45;transform:scale(.85)}",
    "50%{opacity:1;transform:scale(1.15)}}",

    ".motif-lamp i{width:.34rem;height:.34rem;box-shadow:0 0 .4rem var(--theme-accent);opacity:.8;}",

    ".motif-colours i{width:.42rem;height:.42rem;animation:crawl-pop 2s ease-in-out infinite;}",
    ".motif-colours i:nth-child(1){background:#e63946}.motif-colours i:nth-child(2){background:#f4a261}",
    ".motif-colours i:nth-child(3){background:#2a9d8f}.motif-colours i:nth-child(4){background:#457b9d}",
    ".motif-colours i:nth-child(5){background:#9d4edd}.motif-colours i:nth-child(6){background:#ffb703}",
    ".motif-colours i:nth-child(7){background:#06d6a0}",
    "@keyframes crawl-pop{0%,100%{transform:scale(.7);opacity:.6}50%{transform:scale(1.2);opacity:1}}",

    ".motif-snow i{width:.3rem;height:.3rem;background:#fff;",
    "box-shadow:0 0 0 1px var(--theme-accent);animation:crawl-drift 3s ease-in-out infinite;}",
    "@keyframes crawl-drift{0%,100%{transform:translateY(-.2rem)}50%{transform:translateY(.2rem)}}",

    ".motif-sun i{width:.34rem;height:.34rem;opacity:.7;",
    "animation:crawl-glow 2.8s ease-in-out infinite;}",
    "@keyframes crawl-glow{0%,100%{opacity:.35}50%{opacity:1}}",

    ".motif-leaves i{width:.4rem;height:.4rem;border-radius:0 60% 0 60%;",
    "animation:crawl-sway 3.2s ease-in-out infinite;}",
    "@keyframes crawl-sway{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(12deg)}}",

    ".motif-tricolour i{width:.4rem;height:.4rem;border-radius:2px;}",
    ".motif-tricolour i:nth-child(3n+1){background:#FF9933}",
    ".motif-tricolour i:nth-child(3n+2){background:#FFFFFF;box-shadow:0 0 0 1px #ccc}",
    ".motif-tricolour i:nth-child(3n+3){background:#138808}",

    /* stagger every motif */
    ".crawl-theme-motif i:nth-child(2){animation-delay:.15s}",
    ".crawl-theme-motif i:nth-child(3){animation-delay:.3s}",
    ".crawl-theme-motif i:nth-child(4){animation-delay:.45s}",
    ".crawl-theme-motif i:nth-child(5){animation-delay:.6s}",
    ".crawl-theme-motif i:nth-child(6){animation-delay:.75s}",
    ".crawl-theme-motif i:nth-child(7){animation-delay:.9s}",

    "@media (max-width:640px){.crawl-theme-bar{font-size:.82rem;padding:.55rem 2.2rem .55rem .75rem}",
    ".crawl-theme-motif i:nth-child(n+5){display:none}}",

    "@media (prefers-reduced-motion:reduce){.crawl-theme-motif i{animation:none!important}}"
  ].join("");

})();
