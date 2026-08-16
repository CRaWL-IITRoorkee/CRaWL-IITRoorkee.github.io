/* ==========================================================
   CRaWL — home page behaviour
   1. Featured Research carousel   2. Panel tickers
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

      if (reduceMotion) {
        box.classList.remove("is-ticking");   // reader asked for stillness
        return;
      }

      var height = track.scrollHeight;
      if (height < 40) return;                // nothing worth rolling

      /* Wrap the list and enough identical copies in a reel that the
         reel is always taller than the panel. Sliding the reel up by
         exactly one list-height lands back at the start, so the loop
         has no visible seam. A short list that already fits still
         rolls — it simply needs more copies to fill the panel.
         Copies are hidden from screen readers and skipped by the
         keyboard. */
      var reel = document.createElement("div");
      reel.className = "ticker-reel";
      track.parentNode.insertBefore(reel, track);
      reel.appendChild(track);

      var copies = Math.max(1, Math.ceil(box.clientHeight / height));
      for (var i = 0; i < copies; i++) {
        var copy = track.cloneNode(true);
        copy.classList.add("ticker-copy");
        copy.setAttribute("aria-hidden", "true");
        [].forEach.call(copy.querySelectorAll("a"), function (a) { a.tabIndex = -1; });
        reel.appendChild(copy);
      }
      box.style.setProperty("--ticker-shift", height + "px");

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

})();
