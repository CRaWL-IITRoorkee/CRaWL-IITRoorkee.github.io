/* ==========================================================
   CRaWL — arrows for the Recent Updates list
   File: assets/js/updates-nav.js
   ----------------------------------------------------------
   Puts an up and a down arrow in the panel head. The list
   scrolls on its own until the first arrow is used; from then
   on it is yours — one entry per click, wheel and touch work
   too, and the arrows grey out at the top and bottom.

   Load it AFTER home.js, which is what starts the automatic
   scroll in the first place.

   PANELS lists which panels get the arrows, by their heading.
   Add "Media Coverage" to give the news list the same control.
   ========================================================== */
(function () {
  "use strict";

  var PANELS = ["Recent Updates"];

  var UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>';
  var DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

  function wire(panel) {
    var head = panel.querySelector(".panel-head");
    var box = panel.querySelector("[data-ticker]");
    if (!head || !box || head.querySelector(".tnav")) return;

    var nav = document.createElement("div");
    nav.className = "tnav";

    var up = document.createElement("button");
    up.type = "button";
    up.className = "tnav-btn up";
    up.innerHTML = UP;
    up.setAttribute("aria-label", "Show earlier entries");

    var down = document.createElement("button");
    down.type = "button";
    down.className = "tnav-btn down";
    down.innerHTML = DOWN;
    down.setAttribute("aria-label", "Show later entries");

    nav.appendChild(up);
    nav.appendChild(down);
    head.appendChild(nav);

    var manual = false;

    /* hand the list over to the reader: stop the automatic roll and
       drop the duplicate rows it made, so the list is exactly the
       entries once each and can simply be scrolled */
    function takeOver() {
      if (manual) return;
      manual = true;
      box.classList.remove("is-ticking");
      box.classList.add("is-manual");
      [].forEach.call(box.querySelectorAll(".ticker-copy"), function (c) {
        c.parentNode.removeChild(c);
      });
      var track = box.querySelector(".ticker-track");
      if (track) track.dataset.ready = "1";     /* home.js must not restart it */
      box.scrollTop = 0;
    }

    function step() {
      var row = box.querySelector(".update, .news-item, .pub, .tool");
      return row ? Math.round(row.getBoundingClientRect().height) : 64;
    }

    function move(dir) {
      takeOver();
      var by = step() * dir;
      if (box.scrollBy) box.scrollBy({ top: by, behavior: "smooth" });
      else box.scrollTop += by;
      setTimeout(refresh, 420);
    }

    function refresh() {
      if (!manual) return;
      var max = box.scrollHeight - box.clientHeight - 2;
      up.disabled = box.scrollTop <= 2;
      down.disabled = box.scrollTop >= max;
    }

    up.addEventListener("click", function () { move(-1); });
    down.addEventListener("click", function () { move(1); });
    box.addEventListener("scroll", refresh);
  }

  function run() {
    var heads = document.querySelectorAll(".panel .panel-head h2");
    [].forEach.call(heads, function (h) {
      var title = (h.textContent || "").replace(/\s+/g, " ").trim();
      if (PANELS.indexOf(title) === -1) return;
      var panel = h.closest ? h.closest(".panel") : null;
      if (panel) wire(panel);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
