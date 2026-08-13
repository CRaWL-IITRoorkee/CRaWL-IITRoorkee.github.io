/* ==========================================================
   CRaWL — seasonal theme gate
   ----------------------------------------------------------
   Adds class "theme-id" to <html> only while today falls inside
   the window set in assets/js/site-data.js. Outside that window
   this script does nothing at all and the site is its normal
   self — no need to remember to switch anything back.

   Dates are inclusive and compared in the visitor's own local
   time, which is what you want for a national holiday.
   ========================================================== */
(function () {
  "use strict";

  var cfg = (window.CRAWL && window.CRAWL.theme) || null;
  if (!cfg || !cfg.enabled || !cfg.from || !cfg.to) return;

  function parse(d) {                     // "2026-08-14" -> local midnight
    var p = String(d).split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  /* Preview override, for checking the theme outside its dates:
       ...index.html?theme=on   force it on
       ...index.html?theme=off  force it off
     Visitors never see this unless they type it, and it changes
     nothing about the scheduled behaviour. */
  var force = null;
  try {
    var q = (window.location.search || "").match(/[?&]theme=(on|off)/);
    if (q) force = q[1];
  } catch (e) {}

  if (force !== "on") {
    if (force === "off") return;
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var from = parse(cfg.from);
    var to = parse(cfg.to);
    to.setHours(23, 59, 59, 999);         // "to" is inclusive
    if (today < from || today > to) return;  // outside the window — stop here
  }

  var root = document.documentElement;
  root.classList.add("theme-id");

  document.addEventListener("DOMContentLoaded", function () {

    /* 1. header badge -------------------------------------- */
    var brand = document.querySelector(".header-in .brand");
    if (brand && cfg.badge) {
      var badge = document.createElement("div");
      badge.className = "id-badge";
      badge.innerHTML =
        '<span class="ribbon" aria-hidden="true"></span>' +
        '<span><b>' + cfg.badge.date + '</b>' +
        '<span>' + cfg.badge.text + '</span></span>';
      brand.parentNode.insertBefore(badge, brand.nextSibling);
    }

    /* 2. hero line (home page only) ------------------------ */
    var heroCopy = document.querySelector(".hero-in .lede");
    if (heroCopy && cfg.hero) {
      var line = document.createElement("p");
      line.className = "id-hero";
      line.innerHTML = cfg.hero.line +
        (cfg.hero.sub ? "<small>" + cfg.hero.sub + "</small>" : "");
      heroCopy.parentNode.insertBefore(line, heroCopy.nextSibling);
    }

    /* 3. footer artwork ------------------------------------ */
    var footer = document.querySelector(".site-footer");
    var bottomBar = footer && footer.querySelector(".foot-bottom");
    if (footer && cfg.footerArt !== false) {
      var art = document.createElement("div");
      art.className = "id-footer-art";
      art.setAttribute("aria-hidden", "true");
      /* Its own band between the link columns and the copyright bar,
         so no text ever sits on top of the artwork. */
      footer.insertBefore(art, bottomBar || null);
    }
  });
})();
