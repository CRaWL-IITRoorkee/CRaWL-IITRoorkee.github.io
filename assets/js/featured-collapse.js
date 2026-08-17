/* ==========================================================
   CRaWL — FEATURED RESEARCH, COLLAPSED BY DEFAULT
   File: assets/js/featured-collapse.js
   ----------------------------------------------------------
   The hero card now opens as one slim bar:

       Featured Research   Water Research X · 2025      ⌄

   The bar keeps cycling with the carousel, so the journal,
   the year and the study title change every few seconds even
   while the card is shut. Clicking the bar (anywhere on it)
   opens the full card — figure, findings, "Explore the Study"
   — and clicking again shuts it.

   It does not touch home.js. The bar reads whichever slide
   carries .is-active and refreshes itself when that changes.

   START_OPEN = true if you would rather the card be open on
   arrival and collapsible by the reader.
   ========================================================== */
(function () {
  "use strict";

  var START_OPEN = false;
  var REMEMBER = true;          /* keep the reader's choice for this tab */

  var deck = document.querySelector(".featured-deck");
  if (!deck) return;

  var slides = [].slice.call(deck.querySelectorAll(".fslide"));
  if (!slides.length) return;

  var CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M6 9l6 6 6-6"/></svg>';

  var peek = document.createElement("button");
  peek.type = "button";
  peek.className = "fpeek";
  peek.setAttribute("aria-expanded", "false");
  peek.innerHTML =
    '<span class="fpeek-kicker">Featured Research</span>' +
    '<span class="fpeek-meta">' +
      '<span class="fpeek-ref"></span>' +
      '<span class="fpeek-title"></span>' +
    '</span>' +
    '<span class="fpeek-ic">' + CHEV + '</span>' +
    '<span class="sr fpeek-sr">Show the full study</span>';
  deck.insertBefore(peek, deck.firstChild);

  var elRef = peek.querySelector(".fpeek-ref");
  var elTitle = peek.querySelector(".fpeek-title");
  var elSr = peek.querySelector(".fpeek-sr");

  /* ---- keep the bar in step with the carousel ---- */
  function flatten(node) {
    if (!node) return "";
    var tmp = document.createElement("div");
    tmp.innerHTML = node.innerHTML.replace(/<br\s*\/?>/gi, " \u2014 ");
    return tmp.textContent.replace(/\s+/g, " ").trim();
  }

  function sync() {
    var active = deck.querySelector(".fslide.is-active") || slides[0];
    var ref = active.querySelector(".featured-head .ref");
    var h2 = active.querySelector(".featured-title-row h2");
    elRef.textContent = ref ? ref.textContent.replace(/\s+/g, " ").trim() : "";
    elTitle.textContent = flatten(h2);
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

  /* ---- open / shut ---- */
  function setOpen(open) {
    deck.classList.toggle("is-collapsed", !open);
    peek.setAttribute("aria-expanded", open ? "true" : "false");
    elSr.textContent = open ? "Hide the full study" : "Show the full study";
    if (REMEMBER) {
      try { sessionStorage.setItem("crawl-featured-open", open ? "1" : "0"); }
      catch (e) { /* private mode — the choice simply is not kept */ }
    }
    /* home.js measures all five studies to one shared height on resize;
       nudge it so the card is sized correctly the moment it opens */
    window.dispatchEvent(new Event("resize"));
  }

  peek.addEventListener("click", function () {
    setOpen(deck.classList.contains("is-collapsed"));
  });

  var start = START_OPEN;
  if (REMEMBER) {
    try {
      var saved = sessionStorage.getItem("crawl-featured-open");
      if (saved !== null) start = saved === "1";
    } catch (e) { /* ignore */ }
  }
  setOpen(start);
})();
