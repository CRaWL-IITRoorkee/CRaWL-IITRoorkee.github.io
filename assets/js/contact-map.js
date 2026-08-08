/* ============================================================
   CRaWL — Contact page map
   Place at: assets/js/contact-map.js
   Needs Leaflet (loaded from CDN in contact.html) and:
     <div id="wrdmMap"></div>

   TO FINE-TUNE THE PIN: open Google Maps, right-click the exact
   WRD&M entrance, click the lat/long that appears to copy it,
   and paste the two numbers into SITE below.
   ============================================================ */
(function () {
  "use strict";

  var SITE = {
    lat: 29.8656,
    lng: 77.8966,
    zoom: 17,
    title: "Dept. of Water Resources Development &amp; Management",
    sub: "IIT Roorkee, Roorkee, Uttarakhand 247667"
  };

  function init() {
    var el = document.getElementById("wrdmMap");
    if (!el || typeof L === "undefined") return;

    var map = L.map(el, {
      scrollWheelZoom: false,          // page scroll keeps working over the map
      zoomControl: true
    }).setView([SITE.lat, SITE.lng], SITE.zoom);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19
    }).addTo(map);

    var pin = L.divIcon({
      className: "wrdm-pin",
      html: '<span class="wrdm-pin-dot"></span><span class="wrdm-pin-label">WRD&amp;M</span>',
      iconSize: [null, null],
      iconAnchor: [9, 9]
    });

    L.marker([SITE.lat, SITE.lng], { icon: pin, title: "WRD&M, IIT Roorkee" })
      .addTo(map)
      .bindPopup("<b>" + SITE.title + "</b><br>" + SITE.sub)
      .openPopup();

    // click once to enable wheel zoom, so the map does not hijack scrolling
    map.on("click", function () { map.scrollWheelZoom.enable(); });
    map.on("mouseout", function () { map.scrollWheelZoom.disable(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
