/* ============================================================
   CRaWL — Automatic gallery loader
   Place at: assets/js/gallery-auto.js

   HOW IT WORKS
   ------------
   You never edit HTML to add a photo. Just drop the file into
   assets/images/gallery/ using the naming convention below and
   it appears on the site automatically. No caption, no
   description, no <figure> tag to write.

       conf-1.jpg,  conf-2.jpg,  conf-3.jpg  ...  -> Conferences & Training
       lab-1.jpg,   lab-2.jpg,   lab-3.jpg   ...  -> Lab Life
       field-1.jpg, field-2.jpg, field-3.jpg ...  -> Field Campaigns

   Numbers must start at 1 and should be roughly consecutive.
   A gap of up to 8 missing numbers is tolerated; after that the
   scan stops, so don't jump from conf-4 straight to conf-40.

   Accepted extensions: .jpg .JPG .jpeg .JPEG .png .PNG .webp

   MARKUP
   ------
   In the page, leave the grid empty and tag it:

       <div class="gallery-grid photo-grid"
            data-gallery="conf"          <- prefix, required
            data-limit="4"               <- optional, max photos
            data-order="desc"></div>     <- optional, newest first

   ============================================================ */
(function () {
  "use strict";

  var BASE = "assets/images/gallery/";
  var EXTS = [".jpg", ".JPG", ".jpeg", ".JPEG", ".png", ".PNG", ".webp"];
  var BATCH = 8;      // how many numbers to test at once
  var MAX_INDEX = 400; // hard safety stop

  /* Try every extension for one number; call back with the URL or null. */
  function findAt(prefix, n, done) {
    var i = 0;
    (function next() {
      if (i >= EXTS.length) { done(null); return; }
      var url = BASE + prefix + "-" + n + EXTS[i++];
      var im = new Image();
      im.onload = function () { done(url); };
      im.onerror = next;
      im.src = url;
    })();
  }

  /* Walk 1,2,3... in batches until a whole batch comes back empty. */
  function scan(prefix, done) {
    var found = {};
    var start = 1;

    function round() {
      var pending = BATCH;
      var any = false;

      for (var k = 0; k < BATCH; k++) {
        (function (n) {
          findAt(prefix, n, function (url) {
            if (url) { found[n] = url; any = true; }
            if (--pending === 0) {
              start += BATCH;
              if (!any || start > MAX_INDEX) {
                var nums = Object.keys(found).map(Number).sort(function (a, b) { return a - b; });
                done(nums.map(function (n) { return found[n]; }));
              } else {
                round();
              }
            }
          });
        })(start + k);
      }
    }

    round();
  }

  function render(grid, urls) {
    var order = (grid.getAttribute("data-order") || "asc").toLowerCase();
    var limit = parseInt(grid.getAttribute("data-limit"), 10);

    if (order === "desc") urls = urls.slice().reverse();
    if (limit > 0) urls = urls.slice(0, limit);

    grid.innerHTML = "";
    grid.removeAttribute("data-loading");

    if (!urls.length) {
      grid.setAttribute("hidden", "");
      return;
    }
    grid.removeAttribute("hidden");

    urls.forEach(function (url, i) {
      var fig = document.createElement("figure");
      fig.className = "g-item";

      var img = document.createElement("img");
      img.src = url;
      img.alt = "";                       // no description by design
      img.loading = i < 4 ? "eager" : "lazy";
      img.decoding = "async";

      fig.appendChild(img);
      grid.appendChild(fig);
    });

    // Re-wire the full-screen viewer now that the photos exist.
    if (window.CRaWLLightbox && window.CRaWLLightbox.refresh) {
      window.CRaWLLightbox.refresh();
    }
  }

  function init() {
    var grids = document.querySelectorAll("[data-gallery]");
    Array.prototype.forEach.call(grids, function (grid) {
      var prefix = grid.getAttribute("data-gallery");
      if (!prefix) return;
      grid.setAttribute("data-loading", "");
      scan(prefix, function (urls) { render(grid, urls); });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
