/* ============================================================================
   3. LEAFLET MAP SETUP (100% FREE OPENSTREETMAP + DARK MODE CSS)
   ============================================================================ */
const map = L.map("map", {
    zoomSnap: 0.25,
    worldCopyJump: true,
    zoomControl: false
}).setView([50.85, 4.35], 5);

L.control.zoom({ position: "bottomleft" }).addTo(map);

// 100% Free Standard OpenStreetMap Tiles (No API Key Required)
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
}).addTo(map);

const shapeLayer = L.layerGroup().addTo(map);
const vectorLayer = L.layerGroup().addTo(map);
const markerLayer = L.layerGroup().addTo(map);
const beaconLayer = L.layerGroup().addTo(map);

map.on("zoomend", () => {
    map.getContainer().classList.toggle("low-zoom", map.getZoom() < 5.2);
});
