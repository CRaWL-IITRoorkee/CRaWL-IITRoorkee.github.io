/* ============================================================
   CRaWL — Gallery lightbox
   Place at: assets/js/gallery-lightbox.js

   Wires every image inside a `.gallery-grid.photo-grid` to a
   full-screen viewer with Close / Previous / Next controls,
   keyboard arrows and Escape.

   Fully data-driven: add or remove a `.g-item` and it just
   works. Photos injected later by gallery-auto.js are picked up
   by calling window.CRaWLLightbox.refresh().

   Captions are optional. A photo shows a caption only if its
   figure carries data-caption or its img has a non-empty alt.
   ============================================================ */
(function () {
  "use strict";

  var box = null, lbImg, lbCap, btnClose, btnPrev, btnNext;
  var slides = [];
  var idx = 0;
  var lastFocus = null;

  function buildBox() {
    if (box) return;

    box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Image viewer");
    box.innerHTML =
      '<button type="button" class="lb-btn lb-close" aria-label="Close (Esc)">&times;</button>' +
      '<button type="button" class="lb-btn lb-nav lb-prev" aria-label="Previous image">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>' +
      '<button type="button" class="lb-btn lb-nav lb-next" aria-label="Next image">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>' +
      '<img src="" alt="">' +
      '<p class="lightbox-caption"></p>';
    document.body.appendChild(box);

    lbImg    = box.querySelector("img");
    lbCap    = box.querySelector(".lightbox-caption");
    btnClose = box.querySelector(".lb-close");
    btnPrev  = box.querySelector(".lb-prev");
    btnNext  = box.querySelector(".lb-next");

    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", function () { step(-1); });
    btnNext.addEventListener("click", function () { step(1); });

    // Click on the dim backdrop (but not the image/controls) closes.
    box.addEventListener("click", function (e) { if (e.target === box) close(); });

    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    });
  }

  function render() {
    var s = slides[idx];
    if (!s) return;
    lbImg.src = s.src;
    lbImg.alt = s.alt;
    lbCap.textContent = s.caption;
    lbCap.style.display = s.caption ? "" : "none";
    var multi = slides.length > 1;
    btnPrev.style.display = multi ? "" : "none";
    btnNext.style.display = multi ? "" : "none";
  }

  function open(i) {
    if (!slides.length) return;
    idx = (i + slides.length) % slides.length;
    lastFocus = document.activeElement;
    render();
    box.classList.add("is-open");
    document.body.style.overflow = "hidden";
    btnClose.focus();
  }

  function close() {
    box.classList.remove("is-open");
    document.body.style.overflow = "";
    lbImg.src = "";
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function step(n) {
    idx = (idx + n + slides.length) % slides.length;
    render();
  }

  function onClick() { open(this.__lbIndex); }
  function onKey(e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(this.__lbIndex); }
  }

  /* (Re)collect every .g-item currently in the DOM. Safe to call
     as often as you like — handlers are bound only once per item. */
  function refresh() {
    var items = Array.prototype.slice.call(
      document.querySelectorAll(".gallery-grid.photo-grid .g-item")
    );
    if (!items.length) { slides = []; return; }

    buildBox();

    slides = [];
    items.forEach(function (el) {
      var img = el.querySelector("img");
      var src = (img && (img.getAttribute("data-full") || img.getAttribute("src"))) || "";
      if (!src) return;

      var alt = (img && img.getAttribute("alt")) || "";
      slides.push({
        el: el,
        src: src,
        alt: alt,
        caption: el.getAttribute("data-caption") || alt || ""
      });
    });

    slides.forEach(function (s, i) {
      s.el.__lbIndex = i;
      s.el.setAttribute("tabindex", "0");
      s.el.setAttribute("role", "button");
      s.el.setAttribute("aria-label", "Open image " + (i + 1) + " of " + slides.length);
      if (!s.el.__lbBound) {
        s.el.__lbBound = true;
        s.el.addEventListener("click", onClick);
        s.el.addEventListener("keydown", onKey);
      }
    });
  }

  window.CRaWLLightbox = { refresh: refresh };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", refresh);
  else refresh();
})();
