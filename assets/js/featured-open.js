/* ==========================================================
   CRaWL — FEATURED RESEARCH, ALWAYS OPEN
   File: assets/js/featured-open.js
   Replaces the old assets/js/featured-collapse.js.
   ----------------------------------------------------------
   The hero card is now permanently open. This file no longer
   collapses anything — all it does is draw the slim header
   strip that sits on top of the card:

       Featured Research        Water Research X · 2025

   The strip is a plain <div>: no chevron, no click, nothing
   to expand. It keeps cycling with the carousel, so the
   journal and year change together with the study below it.

   It exists only so the card keeps the two-part look it had
   before (strip on top, card body beneath). Delete this file
   and the <script> tag in index.html and the card still
   works — it just loses the strip and shows the card's own
   .featured-head instead.
   ========================================================== */
(function () {
  "use strict";

  var deck = document.querySelector(".featured-deck");
  if (!deck) return;

  var slides = [].slice.call(deck.querySelectorAll(".fslide"));
  if (!slides.length) return;

  /* the card is open, permanently — nothing ever sets .is-collapsed */
  deck.classList.remove("is-collapsed");

  var strip = document.createElement("div");
  strip.className = "fpeek";
  strip.innerHTML =
    '<span class="fpeek-kicker">Featured Research</span>' +
    '<span class="fpeek-meta"><span class="fpeek-ref"></span></span>';
  deck.insertBefore(strip, deck.firstChild);

  var elRef = strip.querySelector(".fpeek-ref");

  /* ---- keep the strip in step with the carousel ---- */
  function sync() {
    var active = deck.querySelector(".fslide.is-active") || slides[0];
    var ref = active.querySelector(".featured-head .ref");
    elRef.textContent = ref ? ref.textContent.replace(/\s+/g, " ").trim() : "";
  }

  if (window.MutationObserver) {
    var mo = new MutationObserver(sync);
    slides.forEach(function (s) {
      mo.observe(s, { attributes: true, attributeFilter: ["class"] });
    });
  } else {
    setInterval(sync, 1000);
  }
  sync();

  /* home.js sizes every study to one shared height on resize; nudge it
     once now that the strip has been added above the card */
  window.dispatchEvent(new Event("resize"));
})();
