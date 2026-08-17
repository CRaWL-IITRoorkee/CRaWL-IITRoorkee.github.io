/* ==========================================================
   CRaWL — central site data
   ----------------------------------------------------------
   EDIT THIS FILE ONLY. Nothing here is duplicated elsewhere.

   1. analytics — the footer "Website analytics" panel
   ========================================================== */

window.CRAWL = window.CRAWL || {};

/* ---------------------------------------------------------
   1. ANALYTICS  (footer panel)
   ---------------------------------------------------------
   The footer shows REAL numbers or nothing at all. It never
   invents a figure and never calls a page view a "click".

   To switch it on:
     1. Create a free site at https://www.goatcounter.com
        (privacy-first, no cookies, no consent banner needed).
     2. Put your site code below — the "MYCODE" part of
        https://MYCODE.goatcounter.com
     3. Commit. Visitor counts appear within a few hours.

   Leave `code` empty and the footer panel simply stays hidden.

   Page views are a separate metric and need the authenticated
   API. The workflow in .github/workflows/analytics.yml writes
   them to assets/data/analytics.json once a month; the footer
   picks that file up automatically if it exists.
   --------------------------------------------------------- */
window.CRAWL.analytics = {
  provider: "goatcounter",
  code: "",                               // e.g. "crawl-iitr"
  dataFile: "assets/data/analytics.json"  // written by the monthly workflow
};

/* ---------------------------------------------------------
   3. SEASONAL THEME  (Independence Day)
   ---------------------------------------------------------
   Runs ONLY between `from` and `to` (inclusive, local time),
   then the site returns to normal on its own. Nothing to undo.

   To switch it off early : set enabled to false.
   To reuse it next year  : change the two dates to 2027.
   To retire it for good  : delete this block, theme.js,
                            theme-independence.css and the two
                            tags in each page's HTML.
   --------------------------------------------------------- */
window.CRAWL.theme = {
  enabled: true,
  from: "2026-08-13",
  to:   "2026-08-16",
  badge: { date: "15 August", text: "Happy Independence Day" },
  hero: {
    line: 'Proud of <span class="n">our Nation</span>. Committed to <span class="p">our Planet</span>.',
    sub:  "Celebrating India's 80th Independence Day."
  },
  footerArt: true
};

/* ---------------------------------------------------------
   4. PAGE VISIT COUNTER  (footer strip)
   ---------------------------------------------------------
   provider "countapi"    — no account, live the moment you
                            commit. Keep the key unique to you.
   provider "goatcounter" — free account, unique visitors;
                            reuses CRAWL.analytics.code above.

   One visit is counted per browser session, so a reload does
   not inflate the number. If the count cannot be fetched the
   strip stays hidden — a made-up figure is never shown.
   --------------------------------------------------------- */
window.CRAWL.visits = {
  provider: "countapi",
  key: "crawl-iitr-wrdm-2026",
  label: "page visits"
};
