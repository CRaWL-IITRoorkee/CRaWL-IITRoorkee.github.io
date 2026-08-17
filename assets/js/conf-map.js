/* ============================================================
   CRaWL — Conference & talk hotspot map
   Place at: assets/js/conf-map.js
   Needs Leaflet (loaded from CDN in conferences.html) and:
     <div id="confMap"></div>

   VENUES is derived from the two lists on this page.
   When you add an entry to a list, bump the matching c/t below
   (c = conference presentations, t = invited talks).

   ENGLISH-ONLY LABELS
   The basemap carries no text at all. OpenStreetMap-derived
   tiles label each place in its own language — Wien, Ελλάδα,
   東京, नई दिल्ली — and no setting turns that off, because the
   names are baked into the tile images. So the labels come off
   the map entirely and the only words on it are the ones in
   VENUES below, written by us, in English.

   Place names appear beside each circle from zoom 3 upward,
   and on hover at any zoom.
   ============================================================ */
(function () {
  "use strict";

  var VENUES = [
    // --- Europe ---
    { name: "Vienna, Austria",        lat: 48.21,  lng: 16.37,   c: 10, t: 0 },
    { name: "Trieste, Italy",         lat: 45.65,  lng: 13.78,   c: 4,  t: 0 },
    { name: "Florence, Italy",        lat: 43.77,  lng: 11.26,   c: 1,  t: 0 },
    { name: "Thessaloniki, Greece",   lat: 40.64,  lng: 22.94,   c: 2,  t: 0 },
    { name: "Barcelona, Spain",       lat: 41.39,  lng: 2.17,    c: 1,  t: 1 },
    { name: "Madrid, Spain",          lat: 40.42,  lng: -3.70,   c: 1,  t: 0 },
    { name: "Munich, Germany",        lat: 48.14,  lng: 11.58,   c: 1,  t: 0 },
    { name: "Kiel, Germany",          lat: 54.32,  lng: 10.13,   c: 0,  t: 2 },
    { name: "Stockholm, Sweden",      lat: 59.33,  lng: 18.07,   c: 1,  t: 0 },

    // --- Americas ---
    { name: "New Orleans, USA",       lat: 29.95,  lng: -90.07,  c: 5,  t: 0 },
    { name: "Chicago, USA",           lat: 41.88,  lng: -87.63,  c: 1,  t: 0 },
    { name: "Iowa, USA",              lat: 41.66,  lng: -91.53,  c: 2,  t: 0 },
    { name: "Ontario, Canada",        lat: 43.65,  lng: -79.38,  c: 2,  t: 0 },
    { name: "Florianópolis, Brazil",  lat: -27.60, lng: -48.55,  c: 1,  t: 0 },
    { name: "Lima, Peru",             lat: -12.05, lng: -77.04,  c: 0,  t: 1 },

    // --- Africa ---
    { name: "Kigali, Rwanda",         lat: -1.94,  lng: 30.06,   c: 5,  t: 0 },

    // --- Asia-Pacific ---
    { name: "Tokyo, Japan",           lat: 35.68,  lng: 139.65,  c: 1,  t: 0 },
    { name: "Tsukuba, Japan",         lat: 36.08,  lng: 140.11,  c: 1,  t: 0 },
    { name: "Chiba, Japan",           lat: 35.61,  lng: 140.12,  c: 1,  t: 0 },
    { name: "Beijing, China",         lat: 39.90,  lng: 116.41,  c: 1,  t: 0 },
    { name: "Vietnam",                lat: 21.03,  lng: 105.85,  c: 1,  t: 0 },
    { name: "Tehran, Iran",           lat: 35.69,  lng: 51.39,   c: 0,  t: 1 },

    // --- India ---
    { name: "Roorkee",                lat: 29.87,  lng: 77.89,   c: 6,  t: 1 },
    { name: "New Delhi",              lat: 28.61,  lng: 77.21,   c: 2,  t: 3 },
    { name: "Hyderabad",              lat: 17.39,  lng: 78.49,   c: 1,  t: 0 },
    { name: "Bhopal",                 lat: 23.26,  lng: 77.41,   c: 1,  t: 0 },
    { name: "Guwahati",               lat: 26.14,  lng: 91.74,   c: 1,  t: 0 },
    { name: "Patna",                  lat: 25.59,  lng: 85.14,   c: 0,  t: 2 },
    { name: "Mumbai",                 lat: 19.08,  lng: 72.88,   c: 0,  t: 1 },
    { name: "Chennai",                lat: 13.08,  lng: 80.27,   c: 0,  t: 1 },
    { name: "Pune",                   lat: 18.52,  lng: 73.86,   c: 0,  t: 1 },
    { name: "Jaipur",                 lat: 26.91,  lng: 75.79,   c: 0,  t: 1 },
    { name: "Nagpur",                 lat: 21.15,  lng: 79.09,   c: 0,  t: 1 },
    { name: "Rourkela",               lat: 22.26,  lng: 84.85,   c: 0,  t: 1 },
    { name: "Silchar",                lat: 24.83,  lng: 92.80,   c: 0,  t: 1 },
    { name: "Meerut",                 lat: 28.98,  lng: 77.71,   c: 0,  t: 1 },
    { name: "Surat",                  lat: 21.17,  lng: 72.83,   c: 0,  t: 1 },
    { name: "Goa",                    lat: 15.50,  lng: 73.83,   c: 0,  t: 1 }
    // 1 conference paper (ACS Fall 2024) and 1 talk (ACS Fall 2025 virtual
    // symposia) have no fixed venue, so they are not plotted.
  ];

  var NAVY = "#08264A", BLUE = "#2f7fd4";

  function radius(total) {            // area-proportional, so 10 does not swamp 1
    return 6 + Math.sqrt(total) * 4.2;
  }

  function init() {
    var el = document.getElementById("confMap");
    if (!el || typeof L === "undefined") return;

    var map = L.map(el, {
      scrollWheelZoom: false,          // page scroll keeps working over the map
      worldCopyJump: true,
      minZoom: 1
    }).setView([25, 30], 2);

    /* light_nolabels: coastlines, borders and land only — no place names,
       in any language. Same cartography as before, text removed. */
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 12
    }).addTo(map);

    /* our own labels, in English, kept on their own layer so they can come
       and go with the zoom rather than pile up on top of each other */
    var labels = L.layerGroup();
    var LABEL_FROM = 3;

    var group = [];
    VENUES.forEach(function (v) {
      var total = v.c + v.t;
      if (!total) return;

      var m = L.circleMarker([v.lat, v.lng], {
        radius: radius(total),
        color: NAVY,
        weight: 1.4,
        fillColor: BLUE,
        fillOpacity: 0.55
      }).addTo(map);

      var lines = [];
      if (v.c) lines.push(v.c + (v.c === 1 ? " presentation" : " presentations"));
      if (v.t) lines.push(v.t + (v.t === 1 ? " invited talk" : " invited talks"));

      m.bindPopup("<b>" + v.name + "</b><br>" + lines.join("<br>"));
      m.bindTooltip(v.name + " · " + total, { direction: "top", offset: [0, -4] });

      L.marker([v.lat, v.lng], {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: "conf-label",
          html: '<span>' + v.name + '</span>',
          iconSize: [0, 0],
          iconAnchor: [-(radius(total) + 4), 7]
        })
      }).addTo(labels);
      m.on("mouseover", function () { this.setStyle({ fillOpacity: 0.85 }); });
      m.on("mouseout", function () { this.setStyle({ fillOpacity: 0.55 }); });
      group.push(m);
    });

    if (group.length) {
      map.fitBounds(L.featureGroup(group).getBounds(), { padding: [40, 40] });
    }

    function labelsForZoom() {
      var on = map.getZoom() >= LABEL_FROM;
      if (on && !map.hasLayer(labels)) map.addLayer(labels);
      else if (!on && map.hasLayer(labels)) map.removeLayer(labels);
    }
    map.on("zoomend", labelsForZoom);
    labelsForZoom();

    // click once to enable wheel zoom, so the map does not hijack scrolling
    map.on("click", function () { map.scrollWheelZoom.enable(); });
    map.on("mouseout", function () { map.scrollWheelZoom.disable(); });

    var totals = VENUES.reduce(function (a, v) {
      a.c += v.c; a.t += v.t; a.n += (v.c + v.t) ? 1 : 0; return a;
    }, { c: 0, t: 0, n: 0 });

    var note = document.getElementById("confMapNote");
    if (note) {
      note.textContent = totals.c + " presentations and " + totals.t +
        " invited talks across " + totals.n + " locations. Circle size shows the number at each place; " +
        "zoom in for the place names.";
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
