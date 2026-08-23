/* ============================================================
   CRaWL — Lab in Pictures, sliding photo card
   Place at: assets/js/lab-slider.js

   HOW TO ADD A PHOTO
   ------------------
   Drop it into  assets/images/gallery/  using the same naming
   the gallery already uses:

       lab-1.jpg,   lab-2.jpg,   lab-3.jpg   ...  lab life
       field-1.jpg, field-2.jpg, field-3.jpg ...  field campaigns
       conf-1.jpg,  conf-2.jpg,  conf-3.jpg  ...  conferences

   No HTML editing — the card finds them on its own. Which
   prefixes it uses is set in the markup:

       <div class="photo-slider" data-photo-slider
            data-photos="lab,field,conf"   <- prefixes, in order
            data-hold="3000">              <- ms each photo shows
         <div class="pslide-track"></div>
         <div class="pslide-dots"></div>
       </div>

   TIMING
   ------
   data-hold is how long each photo sits still, in milliseconds.
   3000 = three seconds. The slide itself takes SLIDE_MS below.
   The strip moves left, so each new photo enters from the right.
   Hovering the card pauses it; it resumes when the pointer
   leaves. It also pauses when the tab is in the background, so
   you never come back to a card that has raced through fifty
   photos into a blank frame.
   ============================================================ */
(function () {
  "use strict";

  var BASE = "assets/images/gallery/";
  var EXTS = [".jpg", ".JPG", ".jpeg", ".JPEG", ".png", ".PNG", ".webp"];
  var BATCH = 6;            /* numbers probed per round */
  var MAX_INDEX = 200;
  var CACHE_KEY = "crawl-labpix-";
  var SLIDE_MS = 700;      /* how long the sliding motion itself takes */
  var MAX_PHOTOS = 24;     /* keep the card light; oldest beyond this are dropped */

  /* The extension that worked last is tried first, so an existing photo
     usually costs ONE request instead of up to seven. */
  var hotExt = null;

  function findAt(prefix, n, done) {
    var list = hotExt
      ? [hotExt].concat(EXTS.filter(function (e) { return e !== hotExt; }))
      : EXTS.slice();
    var i = 0;
    (function next() {
      if (i >= list.length) { done(null); return; }
      var ext = list[i++];
      var url = BASE + prefix + "-" + n + ext;
      var im = new Image();
      im.onload = function () { hotExt = ext; done(url); };
      im.onerror = next;
      im.src = url;
    })();
  }

  function scanPrefix(prefix, done) {
    var found = {}, start = 1;
    (function round() {
      var pending = BATCH, any = false;
      for (var k = 0; k < BATCH; k++) {
        (function (n) {
          findAt(prefix, n, function (url) {
            if (url) { found[n] = url; any = true; }
            if (--pending === 0) {
              start += BATCH;
              if (!any || start > MAX_INDEX) {
                var nums = Object.keys(found).map(Number)
                  .sort(function (a, b) { return a - b; });
                done(nums.map(function (n) { return found[n]; }));
              } else { round(); }
            }
          });
        })(start + k);
      }
    })();
  }

  function scanAll(prefixes, done) {
    var out = [], left = prefixes.length;
    if (!left) { done([]); return; }
    prefixes.forEach(function (pre, idx) {
      scanPrefix(pre, function (urls) {
        out[idx] = urls;
        if (--left === 0) {
          done(out.reduce(function (a, b) { return a.concat(b || []); }, []));
        }
      });
    });
  }

  function build(box, urls) {
    var track = box.querySelector(".pslide-track");
    var dots = box.querySelector(".pslide-dots");
    if (!track) return;
    if (!urls.length) { box.setAttribute("hidden", ""); return; }

    if (urls.length > MAX_PHOTOS) urls = urls.slice(0, MAX_PHOTOS);

    track.innerHTML = "";
    urls.forEach(function (url, i) {
      var fig = document.createElement("figure");
      fig.className = "pslide";
      var img = document.createElement("img");
      img.src = url;
      img.alt = "";
      img.decoding = "async";
      if (i > 1) img.loading = "lazy";   /* first two eager so nothing flashes */
      fig.appendChild(img);
      track.appendChild(fig);
    });

    if (dots) {
      dots.innerHTML = "";
      urls.forEach(function () {
        dots.appendChild(document.createElement("i"));
      });
    }

    var n = urls.length;
    if (n < 2) return;                       /* one photo needs no slider */

    var hold = parseInt(box.getAttribute("data-hold"), 10) || 3000;
    var at = 0, timer = null, paused = false;

    track.style.transitionDuration = SLIDE_MS + "ms";

    function show(i) {
      at = (i + n) % n;
      track.style.transform = "translateX(" + (-at * 100) + "%)";
      if (dots) {
        [].forEach.call(dots.children, function (d, k) {
          d.className = k === at ? "on" : "";
        });
      }
    }

    function tick() { if (!paused) show(at + 1); }

    function start() {
      stop();
      timer = setInterval(tick, hold + SLIDE_MS);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    box.addEventListener("mouseenter", function () { paused = true; });
    box.addEventListener("mouseleave", function () { paused = false; });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });

    var reduced = window.matchMedia &&
                  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    show(0);
    box.classList.add("is-ready");
    if (!reduced) start();
  }

  /* Scanning costs a failed request for every number that does not exist,
     so the answer is remembered for the tab: the first page view scans, and
     every later view in the same visit fills the card straight away. */
  function readCache(key) {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY + key);
      if (!raw) return null;
      var list = JSON.parse(raw);
      return (list && list.length) ? list : null;
    } catch (e) { return null; }
  }

  function writeCache(key, urls) {
    try { sessionStorage.setItem(CACHE_KEY + key, JSON.stringify(urls)); }
    catch (e) { /* private mode — just scan again next time */ }
  }

  function init() {
    var boxes = [].slice.call(document.querySelectorAll("[data-photo-slider]"));
    boxes.forEach(function (box) {
      var key = box.getAttribute("data-photos") || "lab";
      var list = key.split(",").map(function (s) { return s.trim(); }).filter(Boolean);

      var cached = readCache(key);
      if (cached) { build(box, cached); return; }

      scanAll(list, function (urls) {
        if (urls.length) writeCache(key, urls);
        build(box, urls);
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
