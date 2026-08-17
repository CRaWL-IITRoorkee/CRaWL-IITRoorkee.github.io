/* ==========================================================
   CRaWL — "New" flag on Recent Updates
   File: assets/js/updates-new.js
   ----------------------------------------------------------
   Reads the <time> in every .update row and marks the ones
   dated within the last MONTHS months with a small New badge.
   Nothing to maintain: the badge appears and disappears on
   its own as the months pass.

   Load this BEFORE home.js — the ticker copies the rows to
   make the loop, and the copies should carry the badge too.
   ========================================================== */
(function () {
  "use strict";

  var MONTHS = 2;

  var NAMES = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };

  var SPARK = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 2.6l1.9 5.1 5.1 1.9-5.1 1.9L12 16.6l-1.9-5.1L5 9.6l5.1-1.9z"/>' +
    '<path d="M18.6 15.2l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8z"/></svg>';

  function when(el) {
    var iso = el.getAttribute("datetime");
    if (iso) {
      var d = new Date(iso.length === 7 ? iso + "-01" : iso);
      if (!isNaN(d.getTime())) return d;
    }
    var m = /([A-Za-z]{3})[A-Za-z.]*\s+(\d{4})/.exec(el.textContent || "");
    if (!m) return null;
    var mi = NAMES[m[1].toLowerCase()];
    if (mi === undefined) return null;
    return new Date(parseInt(m[2], 10), mi, 1);
  }

  function run() {
    var now = new Date();
    var rows = document.querySelectorAll(".update");

    [].forEach.call(rows, function (row) {
      if (row.querySelector(".unew")) return;

      var t = row.querySelector("time");
      var d = t && when(t);
      if (!d) return;

      var age = (now.getFullYear() - d.getFullYear()) * 12 +
                (now.getMonth() - d.getMonth());
      if (age > MONTHS) return;               /* older — no badge */

      var badge = document.createElement("span");
      badge.className = "unew";
      badge.innerHTML = SPARK + "New";
      row.classList.add("is-new");

      var tag = row.querySelector(".utag");
      if (tag && tag.parentNode) tag.parentNode.insertBefore(badge, tag.nextSibling);
      else row.insertBefore(badge, row.firstChild);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
  /* the ticker clones its rows to make the loop — run once more
     afterwards so the copies carry the badge as well */
  window.addEventListener("load", run);
})();
