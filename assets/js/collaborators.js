/* ============================================================
   CRaWL — Collaborator logo marquee
   Place at: assets/js/collaborators.js

   HOW TO ADD A COLLABORATOR
   -------------------------
   Drop the logo into  assets/images/collaborators/  named:

       collab-1.png, collab-2.png, collab-3.png ...

   Numbers start at 1 and run upward; no HTML editing. Same
   convention as the gallery folder.

   Accepted: .png .PNG .jpg .JPG .jpeg .svg .webp
   PNG or SVG with a transparent background looks best — the
   lane sits on white and the logos are shown in grey until
   hovered.

   The lane duplicates itself so the scroll loops seamlessly,
   and only animates when there are enough logos to overflow.
   ============================================================ */
(function () {
  "use strict";

  var BASE = "assets/images/collaborators/";
  var EXTS = [".png", ".PNG", ".jpg", ".JPG", ".jpeg", ".svg", ".webp"];
  var BATCH = 6;
  var MAX = 120;

  function findAt(n, done) {
    var i = 0;
    (function next() {
      if (i >= EXTS.length) { done(null); return; }
      var url = BASE + "collab-" + n + EXTS[i++];
      var im = new Image();
      im.onload = function () { done(url); };
      im.onerror = next;
      im.src = url;
    })();
  }

  function scan(done) {
    var found = {}, start = 1;
    (function round() {
      var pending = BATCH, any = false;
      for (var k = 0; k < BATCH; k++) {
        (function (n) {
          findAt(n, function (url) {
            if (url) { found[n] = url; any = true; }
            if (--pending === 0) {
              start += BATCH;
              if (!any || start > MAX) {
                var nums = Object.keys(found).map(Number).sort(function (a, b) { return a - b; });
                done(nums.map(function (n) { return found[n]; }));
              } else { round(); }
            }
          });
        })(start + k);
      }
    })();
  }

  function build(box, urls) {
    var lane = box.querySelector(".logo-lane");
    if (!lane) return;

    if (!urls.length) { box.setAttribute("hidden", ""); return; }
    lane.innerHTML = "";

    function add(url, clone) {
      var img = document.createElement("img");
      img.src = url;
      img.alt = clone ? "" : "Collaborating institution";
      img.loading = "lazy";
      img.decoding = "async";
      if (clone) img.setAttribute("aria-hidden", "true");
      lane.appendChild(img);
    }

    urls.forEach(function (u) { add(u, false); });

    /* Only roll if the logos actually overrun the box. A short row
       just sits centred instead of sliding pointlessly. */
    if (lane.scrollWidth <= box.clientWidth) {
      lane.style.justifyContent = "center";
      lane.style.width = "100%";
      return;
    }

    var width = lane.scrollWidth;
    urls.forEach(function (u) { add(u, true); });   // second pass = seamless loop
    box.style.setProperty("--logo-duration", Math.max(12, Math.round(width / 90)) + "s");
    box.classList.add("is-rolling");
  }

  function init() {
    var box = document.querySelector("[data-collab-logos]");
    if (!box) return;
    scan(function (urls) { build(box, urls); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
