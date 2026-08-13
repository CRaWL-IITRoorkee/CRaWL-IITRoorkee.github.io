/* ==========================================================
   CRaWL — central site data
   ----------------------------------------------------------
   EDIT THIS FILE ONLY. Nothing here is duplicated elsewhere.

   1. metrics   — the impact strip on the home page
   2. analytics — the footer "Website analytics" panel
   ========================================================== */

window.CRAWL = window.CRAWL || {};

/* ---------------------------------------------------------
   1. IMPACT METRICS  (home page strip)
   ---------------------------------------------------------
   value  : the number, as a plain number (no commas)
   label  : the caption under the number
   note   : small source line — keep it honest and short
   prefix : optional, e.g. "~"  |  suffix : optional, e.g. "+"
   icon   : quote | paper | scholar | project  (see metrics.js)

   Last verified: August 2026
     • citations   — Google Scholar profile
     • papers      — publications.html (49 journal articles)
     • scholars    — research-scholars.html (12 scholars)
     • projects    — projects.html (12 marked "Ongoing")
   --------------------------------------------------------- */
window.CRAWL.metrics = [
  { value: 1984, label: "Citations",        note: "Google Scholar", icon: "quote"   },
  { value: 49,   label: "Journal papers",   note: "Peer-reviewed",  icon: "paper"   },
  { value: 12,   label: "Doctoral scholars",note: "Current cohort", icon: "scholar" },
  { value: 12,   label: "Ongoing projects", note: "Sponsored",      icon: "project" }
];

/* ---------------------------------------------------------
   2. ANALYTICS  (footer panel)
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
    sub:  "Celebrating India's 79th Independence Day."
  },
  footerArt: true
};
