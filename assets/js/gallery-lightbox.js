/* ============================================================
   CRaWL — Gallery lightbox
   Place at: assets/js/gallery-lightbox.js

   Wires every image inside a `.gallery-grid.photo-grid` to a
   full-screen lightbox with Close / Previous / Next controls,
   keyboard arrows and Escape. Fully data-driven: add or remove
   a `.g-item` and it just works — no config to edit.
   ============================================================ */
(function () {
  "use strict";

  function init() {
    var items = Array.prototype.slice.call(
      document.querySelectorAll(".gallery-grid.photo-grid .g-item")
    );
    if (!items.length) return;

    // Collect slides (src + caption) in DOM order.
    var slides = items.map(function (el) {
      var img = el.querySelector("img");
      return {
        el: el,
        src: (img && (img.getAttribute("data-full") || img.getAttribute("src"))) || "",
        alt: (img && img.getAttribute("alt")) || "",
        caption: el.getAttribute("data-caption") || (img && img.getAttribute("alt")) || ""
      };
    }).filter(function (s) { return s.src; });
    if (!slides.length) return;

    // --- Build the lightbox once, shared by all grids on the page ---
    var box = document.createElement("div");
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

    var lbImg = box.querySelector("img");
    var lbCap = box.querySelector(".lightbox-caption");
    var btnClose = box.querySelector(".lb-close");
    var btnPrev = box.querySelector(".lb-prev");
    var btnNext = box.querySelector(".lb-next");

    var idx = 0;
    var lastFocus = null;

    function render() {
      var s = slides[idx];
      lbImg.src = s.src;
      lbImg.alt = s.alt;
      lbCap.textContent = s.caption;
      // Hide nav controls when there is only one image.
      var multi = slides.length > 1;
      btnPrev.style.display = multi ? "" : "none";
      btnNext.style.display = multi ? "" : "none";
    }

    function open(i) {
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

    // Make each grid item keyboard-focusable and clickable.
    slides.forEach(function (s, i) {
      s.el.setAttribute("tabindex", "0");
      s.el.setAttribute("role", "button");
      s.el.setAttribute("aria-label", "Open image " + (i + 1) + " of " + slides.length);
      s.el.addEventListener("click", function () { open(i); });
      s.el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); }
      });
    });

    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", function () { step(-1); });
    btnNext.addEventListener("click", function () { step(1); });

    // Click on the dim backdrop (but not the image/controls) closes.
    box.addEventListener("click", function (e) {
      if (e.target === box) close();
    });

    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") { close(); }
      else if (e.key === "ArrowRight") { step(1); }
      else if (e.key === "ArrowLeft") { step(-1); }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
