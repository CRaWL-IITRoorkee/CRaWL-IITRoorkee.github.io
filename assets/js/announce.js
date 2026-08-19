/* ============================================================
   CRaWL — Announcement popup
   Place at: assets/js/announce.js
   Load with:  <script src="assets/js/announce.js"></script>
   (already added to index.html, just before analytics.js)

   Shows one image announcement over the page on load, closes
   itself after 10 seconds, and can be closed by hand at any
   time — the × button, Esc, or a click on the dark backdrop.

   TO CHANGE THE ANNOUNCEMENT, edit the NOTICE block below.
   To retire it, comment out the <script> tag in index.html.
   Nothing else on the page needs touching.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- the announcement ---------- */
  var NOTICE = {
    title: "Congratulations!",
    text:  "Many congratulations to Mr. Hrishikesh on receiving the " +
           "Institute-Level High-Impact Journal Award in recognition " +
           "of his outstanding research.",
    image: "assets/images/Latest/Latest.jpg",
    alt:   "Institute-Level High-Impact Journal Award — Mr. Hrishikesh",
    href:  "",          /* optional: a page the image should link to, e.g. "news.html" */
    seconds: 10,        /* auto-close delay */
    oncePerSession: false  /* true = show only on the first page view of a visit */
  };

  /* ---------- don't fight the reader ---------- */
  var KEY = "crawl-notice-seen";
  try {
    if (NOTICE.oncePerSession && sessionStorage.getItem(KEY)) return;
  } catch (e) { /* private mode — just show it */ }

  var reduced = window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- styles ---------- */
  var css = document.createElement("style");
  css.textContent = [
    ".notice-back{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;",
    "  justify-content:center;padding:24px;background:rgba(8,38,74,.62);",
    "  -webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);",
    "  opacity:0;transition:opacity .28s ease}",
    ".notice-back.is-open{opacity:1}",

    ".notice{position:relative;width:min(560px,100%);max-height:92vh;overflow:auto;",
    "  background:var(--white,#fff);border-radius:14px;",
    "  box-shadow:0 30px 70px -25px rgba(3,17,40,.75);",
    "  transform:translateY(14px) scale(.985);transition:transform .3s cubic-bezier(.2,.8,.3,1)}",
    ".notice-back.is-open .notice{transform:none}",

    ".notice-head{padding:26px 30px 18px;text-align:center;",
    "  border-bottom:1px solid var(--line-soft,#EAF0F5)}",
    ".notice-head h2{margin:0;font-size:clamp(24px,3.4vw,32px);line-height:1.15;",
    "  letter-spacing:-.01em;color:var(--navy-800,#0C2D57)}",
    ".notice-head p{margin:10px 0 0;font-size:14.5px;line-height:1.65;",
    "  color:var(--body,#465A6E)}",

    ".notice-fig{margin:0;background:var(--panel,#EDF3F8)}",
    ".notice-fig img{display:block;width:100%;height:auto;max-height:52vh;object-fit:contain}",
    ".notice-fig a{display:block}",

    ".notice-close{position:absolute;top:12px;right:12px;width:38px;height:38px;",
    "  display:flex;align-items:center;justify-content:center;",
    "  border:1px solid var(--line,#DCE5ED);border-radius:50%;background:#fff;",
    "  color:var(--navy-800,#0C2D57);font-size:22px;line-height:1;cursor:pointer;",
    "  transition:background .16s ease,transform .16s ease}",
    ".notice-close:hover{background:var(--panel,#EDF3F8);transform:scale(1.06)}",
    ".notice-close:focus-visible{outline:2px solid var(--blue-600,#1B7FD4);outline-offset:2px}",

    /* the bar drains for the length of the auto-close, so the countdown
       is visible rather than a surprise */
    ".notice-timer{height:3px;background:var(--line-soft,#EAF0F5)}",
    ".notice-timer i{display:block;height:100%;width:100%;",
    "  background:var(--blue-600,#1B7FD4);transform-origin:left center}",
    ".notice-timer i.run{animation:noticeDrain linear forwards}",
    ".notice-back.paused .notice-timer i{animation-play-state:paused}",
    "@keyframes noticeDrain{from{transform:scaleX(1)}to{transform:scaleX(0)}}",

    "@media (max-width:520px){.notice-head{padding:22px 20px 16px}}",
    "@media (prefers-reduced-motion: reduce){",
    "  .notice-back,.notice,.notice-timer i{transition:none;animation:none}}"
  ].join("");
  document.head.appendChild(css);

  /* ---------- markup ---------- */
  var back = document.createElement("div");
  back.className = "notice-back";
  back.setAttribute("role", "dialog");
  back.setAttribute("aria-modal", "true");
  back.setAttribute("aria-labelledby", "noticeTitle");

  var img = '<img src="' + NOTICE.image + '" alt="' + NOTICE.alt + '">';
  back.innerHTML =
    '<div class="notice">' +
      '<button type="button" class="notice-close" aria-label="Close announcement">&times;</button>' +
      '<div class="notice-head">' +
        '<h2 id="noticeTitle">' + NOTICE.title + '</h2>' +
        '<p>' + NOTICE.text + '</p>' +
      '</div>' +
      '<figure class="notice-fig">' +
        (NOTICE.href ? '<a href="' + NOTICE.href + '">' + img + '</a>' : img) +
      '</figure>' +
      '<div class="notice-timer"><i></i></div>' +
    '</div>';

  var timerBar = back.querySelector(".notice-timer i");
  var closeBtn = back.querySelector(".notice-close");
  var lastFocus = document.activeElement;
  var timer = null, closed = false;

  function open() {
    document.body.appendChild(back);
    document.body.style.overflow = "hidden";

    requestAnimationFrame(function () {
      back.classList.add("is-open");
      closeBtn.focus();
    });

    if (!reduced) {
      timerBar.style.animationDuration = NOTICE.seconds + "s";
      timerBar.classList.add("run");
    }
    timer = setTimeout(close, NOTICE.seconds * 1000);

    try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
  }

  function close() {
    if (closed) return;
    closed = true;
    clearTimeout(timer);
    back.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(function () {
      if (back.parentNode) back.parentNode.removeChild(back);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }, reduced ? 0 : 300);
  }

  /* ---------- interaction ---------- */
  closeBtn.addEventListener("click", close);

  back.addEventListener("click", function (e) {
    if (e.target === back) close();          /* backdrop only, not the card */
  });

  document.addEventListener("keydown", function (e) {
    if (closed) return;
    if (e.key === "Escape") close();
    /* keep Tab inside the dialog — there is only one control, so hold it */
    if (e.key === "Tab") { e.preventDefault(); closeBtn.focus(); }
  });

  /* reading shouldn't be interrupted: hovering the card holds the countdown */
  var card = back.querySelector(".notice");
  var remaining = NOTICE.seconds * 1000, startedAt = 0;

  card.addEventListener("mouseenter", function () {
    if (closed) return;
    clearTimeout(timer);
    remaining -= (Date.now() - startedAt);
    back.classList.add("paused");
  });
  card.addEventListener("mouseleave", function () {
    if (closed) return;
    startedAt = Date.now();
    back.classList.remove("paused");
    timer = setTimeout(close, Math.max(remaining, 1200));
  });

  /* ---------- go ---------- */
  function boot() { startedAt = Date.now(); open(); }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
