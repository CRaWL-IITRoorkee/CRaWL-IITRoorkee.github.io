/* ==========================================================
   CRaWL — home page behaviour
   1. Featured Research carousel   2. Panel tickers
   3. Impact metrics (count-up, reads assets/js/site-data.js)
   Everything degrades to plain, readable HTML without JS.
   ========================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --------------------------------------------------------
     1. FEATURED RESEARCH CAROUSEL
     --------------------------------------------------------
     SLIDE_MS = how long each study stays on screen.
     Set it to 3000 for a 3-second cycle; 6000 gives a reader
     time to take in all four findings before it moves on.
     -------------------------------------------------------- */
  var SLIDE_MS = 6000;

  (function carousel() {
    var deck = document.querySelector(".featured-deck");
    if (!deck) return;

    var slides = [].slice.call(deck.querySelectorAll(".fslide"));
    if (slides.length < 2) return;

    var dotWrap = deck.querySelector(".fdots");
    var live = deck.querySelector(".fstatus");
    var index = 0, timer = null, paused = false;

    var dots = slides.map(function (s, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "fdot";
      b.setAttribute("aria-label", "Show study " + (i + 1) + " of " + slides.length);
      b.addEventListener("click", function () { show(i); restart(); });
      dotWrap.appendChild(b);
      return b;
    });

    function show(next) {
      slides[index].classList.remove("is-active");
      dots[index].removeAttribute("aria-current");
      index = (next + slides.length) % slides.length;
      slides[index].classList.add("is-active");
      dots[index].setAttribute("aria-current", "true");
      if (live) {
        live.textContent = "Study " + (index + 1) + " of " + slides.length + ": " +
          (slides[index].getAttribute("data-title") || "");
      }
    }

    function tick() { if (!paused) show(index + 1); }
    function restart() {
      if (timer) clearInterval(timer);
      if (!reduceMotion) timer = setInterval(tick, SLIDE_MS);
    }

    /* Pause while someone is reading or tabbing through it. */
    ["mouseenter", "focusin"].forEach(function (e) {
      deck.addEventListener(e, function () { paused = true; });
    });
    ["mouseleave", "focusout"].forEach(function (e) {
      deck.addEventListener(e, function () { paused = false; });
    });
    document.addEventListener("visibilitychange", function () {
      paused = document.hidden;
    });

    deck.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { show(index + 1); restart(); }
      if (e.key === "ArrowLeft") { show(index - 1); restart(); }
    });

    var prev = deck.querySelector(".fnav.prev");
    var next = deck.querySelector(".fnav.next");
    if (prev) prev.addEventListener("click", function () { show(index - 1); restart(); });
    if (next) next.addEventListener("click", function () { show(index + 1); restart(); });

    /* All five studies share one height, measured from the tallest, so
       the hero card never resizes as it cycles. */
    function equalise() {
      deck.style.removeProperty("--fslide-h");
      var active = index, tallest = 0;
      slides.forEach(function (s, i) {
        slides[active].classList.remove("is-active");
        s.classList.add("is-active");
        tallest = Math.max(tallest, s.getBoundingClientRect().height);
        s.classList.remove("is-active");
      });
      slides[active].classList.add("is-active");
      deck.style.setProperty("--fslide-h", Math.ceil(tallest) + "px");
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(equalise, 180);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(equalise);
    window.addEventListener("load", equalise);

    show(0);
    equalise();
    restart();
  })();

  /* --------------------------------------------------------
     2. PANEL TICKERS
     --------------------------------------------------------
     Only starts scrolling when the content genuinely overflows,
     so a card with room to spare just sits still.
     -------------------------------------------------------- */
  (function tickers() {
    var scrollers = [].slice.call(document.querySelectorAll("[data-ticker]"));

    function setup(box) {
      var track = box.querySelector(".ticker-track");
      if (!track || track.dataset.ready === "1") return;

      if (track.scrollHeight - box.clientHeight < 10 || reduceMotion) {
        box.classList.remove("is-ticking");         // it fits — leave it still
        return;
      }

      var height = track.scrollHeight;

      /* Wrap the list and one identical copy in a reel. Sliding the
         reel up by half its height lands exactly back at the start,
         so the loop has no visible seam. The copy is hidden from
         screen readers and skipped by the keyboard. */
      var reel = document.createElement("div");
      reel.className = "ticker-reel";
      track.parentNode.insertBefore(reel, track);
      reel.appendChild(track);

      var copy = track.cloneNode(true);
      copy.classList.add("ticker-copy");
      copy.setAttribute("aria-hidden", "true");
      [].forEach.call(copy.querySelectorAll("a"), function (a) { a.tabIndex = -1; });
      reel.appendChild(copy);

      /* Constant, unhurried speed everywhere: ~22px per second. */
      var seconds = Math.max(18, Math.round(height / 22));
      box.style.setProperty("--ticker-duration", seconds + "s");
      box.classList.add("is-ticking");
      track.dataset.ready = "1";
    }

    scrollers.forEach(setup);

    /* Fonts and images change the height — re-measure once settled. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { scrollers.forEach(setup); });
    }
    window.addEventListener("load", function () { scrollers.forEach(setup); });
  })();

  /* --------------------------------------------------------
     3. IMPACT METRICS
     -------------------------------------------------------- */
  (function metrics() {
    var strip = document.getElementById("metrics");
    if (!strip || !window.CRAWL || !window.CRAWL.metrics) return;

    var ICONS = {
      quote: '<path d="M9 7H5a2 2 0 00-2 2v4a2 2 0 002 2h2l-2 4h3l3-6V9a2 2 0 00-2-2zM20 7h-4a2 2 0 00-2 2v4a2 2 0 002 2h2l-2 4h3l3-6V9a2 2 0 00-2-2z"/>',
      paper: '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
      scholar: '<path d="M12 3L2 8l10 5 8-4v6"/><path d="M6 11v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4"/>',
      project: '<path d="M3 20V10M9 20V4M15 20v-7M21 20V7"/>'
    };

    strip.innerHTML = window.CRAWL.metrics.map(function (m) {
      var glyph = ICONS[m.icon] || ICONS.project;
      return '<div class="metric">' +
        '<svg class="metric-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        glyph + '</svg>' +
        '<b class="metric-n" data-to="' + m.value + '" ' +
        'data-prefix="' + (m.prefix || "") + '" data-suffix="' + (m.suffix || "") + '">' +
        (m.prefix || "") + m.value.toLocaleString("en-IN") + (m.suffix || "") + '</b>' +
        '<span class="metric-l">' + m.label + '</span>' +
        (m.note ? '<span class="metric-note">' + m.note + '</span>' : "") +
        '</div>';
    }).join("");

    var nums = [].slice.call(strip.querySelectorAll(".metric-n"));
    if (reduceMotion || !("IntersectionObserver" in window)) return;

    function countUp(el) {
      var to = parseFloat(el.dataset.to);
      var pre = el.dataset.prefix, suf = el.dataset.suffix;
      var dur = 1100, t0 = null;
      el.textContent = pre + "0" + suf;
      function step(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);           // ease-out, no bounce
        el.textContent = pre + Math.round(to * eased).toLocaleString("en-IN") + suf;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        countUp(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.5 });

    nums.forEach(function (n) { io.observe(n); });
  })();
})();
