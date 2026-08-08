/* ============================================================
   CRaWL — Year filter + pagination for timeline lists
   Place at: assets/js/list-filter.js

   Markup: add data-list and data-label to any <ul class="timeline">
     <ul class="timeline" data-list data-label="presentations">…</ul>
   The filter bar and pager are created automatically around it.
   Year is read from the .when line of each <li>.
   ============================================================ */
(function () {
  "use strict";

  var PER_PAGE = 5;      // entries shown at a time

  function yearOf(li) {
    var when = li.querySelector(".when");
    var text = when ? when.textContent : li.textContent;
    var hits = text.match(/(19|20)\d{2}/g);          // last year mentioned wins
    return hits ? parseInt(hits[hits.length - 1], 10) : 0;
  }

  function setup(ul) {
    var items = Array.prototype.slice.call(ul.children);
    if (!items.length) return;

    var label = ul.getAttribute("data-label") || "entries";
    items.forEach(function (li) { li.dataset.year = yearOf(li); });

    // newest first, original order preserved inside a year
    items.forEach(function (li, i) { li.dataset.idx = i; });
    items.sort(function (a, b) {
      return (b.dataset.year - a.dataset.year) || (a.dataset.idx - b.dataset.idx);
    });
    items.forEach(function (li) { ul.appendChild(li); });

    var years = [];
    items.forEach(function (li) {
      var y = li.dataset.year;
      if (y !== "0" && years.indexOf(y) === -1) years.push(y);
    });

    // ---- filter bar ----
    var bar = document.createElement("div");
    bar.className = "list-bar";
    var id = "yr-" + Math.random().toString(36).slice(2, 7);
    bar.innerHTML =
      '<label class="list-field"><span>Year</span>' +
      '<select id="' + id + '"><option value="all">All years</option>' +
      years.map(function (y) { return '<option value="' + y + '">' + y + '</option>'; }).join("") +
      '</select></label>' +
      '<span class="list-count"></span>';
    ul.parentNode.insertBefore(bar, ul);

    // ---- pager ----
    var pager = document.createElement("nav");
    pager.className = "pager";
    pager.setAttribute("aria-label", "Pages of " + label);
    ul.parentNode.insertBefore(pager, ul.nextSibling);

    var select = bar.querySelector("select");
    var count = bar.querySelector(".list-count");
    var page = 1;

    function matching() {
      var y = select.value;
      return items.filter(function (li) { return y === "all" || li.dataset.year === y; });
    }

    function pagerHTML(pages) {
      if (pages <= 1) return "";
      var btn = function (n) {
        return '<button class="pg' + (n === page ? " on" : "") + '" data-p="' + n + '"' +
               (n === page ? ' aria-current="page"' : "") + ">" + n + "</button>";
      };
      var mid = [], s = Math.max(2, page - 1), e = Math.min(pages - 1, page + 1);
      if (s > 2) mid.push('<span class="gap">&hellip;</span>');
      for (var n = s; n <= e; n++) mid.push(btn(n));
      if (e < pages - 1) mid.push('<span class="gap">&hellip;</span>');
      return '<button class="pg" data-p="' + (page - 1) + '"' + (page === 1 ? " disabled" : "") +
             ' aria-label="Previous page">&lsaquo;</button>' +
             btn(1) + mid.join("") + btn(pages) +
             '<button class="pg" data-p="' + (page + 1) + '"' + (page === pages ? " disabled" : "") +
             ' aria-label="Next page">&rsaquo;</button>';
    }

    function render() {
      var rows = matching();
      var pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
      if (page > pages) page = pages;
      var from = (page - 1) * PER_PAGE;
      var shown = rows.slice(from, from + PER_PAGE);

      items.forEach(function (li) { li.hidden = true; });
      shown.forEach(function (li) { li.hidden = false; });

      pager.innerHTML = pagerHTML(pages);
      count.textContent = rows.length
        ? (from + 1) + "\u2013" + (from + shown.length) + " of " + rows.length + " " + label
        : "No " + label + " for that year";
    }

    select.addEventListener("change", function () { page = 1; render(); });
    pager.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-p]");
      if (!b || b.disabled) return;
      var n = +b.dataset.p;
      if (n === page) return;
      page = n;
      render();
      var top = bar.getBoundingClientRect().top + window.pageYOffset - 110;
      window.scrollTo({ top: top, behavior: "smooth" });
    });

    render();
  }

  function init() {
    var lists = document.querySelectorAll("ul[data-list]");
    Array.prototype.forEach.call(lists, setup);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
