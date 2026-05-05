import React, { useEffect, useRef, useMemo } from "react";
import { tokens } from "../theme";

// We import Leaflet on demand so the bundle stays lean and we have full
// control over the marker icon HTML (we use circular HTML divs styled via
// our theme rather than the default blue pin PNGs).

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

const ensureLeafletCss = () => {
  if (document.getElementById("__leaflet_css")) return;
  const link = document.createElement("link");
  link.id = "__leaflet_css";
  link.rel = "stylesheet";
  link.href = LEAFLET_CSS;
  document.head.appendChild(link);
};

// Tile providers
const TILES = {
  standard: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19,
  },
  // Hybrid: satellite + transparent labels overlay
  hybridLabels: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    attribution: '',
    maxZoom: 19,
  },
};

export default function LeafletMap({
  center,
  zoom = 14,
  userLocation,
  places = [],
  selectedId = null,
  onSelectPlace,
  view = "standard", // standard | satellite | hybrid
  height = "100%",
  showRoute = true,
  routeGeometry = null,    // [{lat,lng}, ...] — drawn as a thick blue polyline
  fitRouteOnUpdate = false,
  className,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const userAccuracyRef = useRef(null);
  const placeMarkersRef = useRef([]);
  const tileLayerRef = useRef(null);
  const labelLayerRef = useRef(null);
  const routeLineRef = useRef(null);
  const LRef = useRef(null);

  // Initialise the map once.
  useEffect(() => {
    let cancelled = false;
    ensureLeafletCss();
    (async () => {
      const Lmod = await import("leaflet");
      const L = Lmod.default || Lmod;
      LRef.current = L;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
      }).setView(center || [28.6139, 77.209], zoom);
      mapRef.current = map;

      const tile = TILES[view] || TILES.standard;
      tileLayerRef.current = L.tileLayer(tile.url, {
        attribution: tile.attribution,
        maxZoom: tile.maxZoom,
      }).addTo(map);
      if (view === "hybrid") {
        labelLayerRef.current = L.tileLayer(TILES.hybridLabels.url, {
          attribution: "",
          maxZoom: TILES.hybridLabels.maxZoom,
        }).addTo(map);
      }
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap tiles when view changes.
  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    const tile = TILES[view] || TILES.standard;
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(tile.url);
    }
    // Manage label overlay for hybrid mode.
    if (view === "hybrid" && !labelLayerRef.current) {
      labelLayerRef.current = L.tileLayer(TILES.hybridLabels.url, {
        attribution: "",
        maxZoom: TILES.hybridLabels.maxZoom,
      }).addTo(map);
    } else if (view !== "hybrid" && labelLayerRef.current) {
      map.removeLayer(labelLayerRef.current);
      labelLayerRef.current = null;
    }
  }, [view]);

  // Centre / zoom updates.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center) return;
    map.setView(center, zoom, { animate: true });
  }, [center, zoom]);

  // User location marker — pulsing blue dot like Google Maps.
  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    if (!userLocation) {
      if (userMarkerRef.current) { map.removeLayer(userMarkerRef.current); userMarkerRef.current = null; }
      if (userAccuracyRef.current) { map.removeLayer(userAccuracyRef.current); userAccuracyRef.current = null; }
      return;
    }
    const ll = [userLocation.lat, userLocation.lng];
    const icon = L.divIcon({
      className: "resq-user-marker",
      html: `
        <div class="resq-user-pulse"></div>
        <div class="resq-user-core"></div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(ll);
    } else {
      userMarkerRef.current = L.marker(ll, { icon, zIndexOffset: 1000 }).addTo(map);
    }
    if (userLocation.accuracy && userLocation.accuracy < 500) {
      if (userAccuracyRef.current) {
        userAccuracyRef.current.setLatLng(ll);
        userAccuracyRef.current.setRadius(userLocation.accuracy);
      } else {
        userAccuracyRef.current = L.circle(ll, {
          radius: userLocation.accuracy,
          color: "#2563EB",
          weight: 1,
          fillColor: "#2563EB",
          fillOpacity: 0.08,
          interactive: false,
        }).addTo(map);
      }
    }
  }, [userLocation]);

  // Place markers.
  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    // Remove old markers.
    placeMarkersRef.current.forEach((m) => map.removeLayer(m));
    placeMarkersRef.current = [];

    places.forEach((p) => {
      const isSelected = p.id === selectedId;
      const color = p.color || tokens.color.danger;
      const icon = L.divIcon({
        className: "resq-place-marker",
        html: `
          <div style="
            background:${color};
            color:#fff;
            width:${isSelected ? 36 : 28}px;
            height:${isSelected ? 36 : 28}px;
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-weight:800;
            font-size:${isSelected ? 16 : 13}px;
            box-shadow:0 2px 8px rgba(0,0,0,0.25), 0 0 0 2px #fff;
            border:${isSelected ? "2px solid #fff" : "none"};
            transform:translateY(0);
            font-family:${tokens.font.family};
          ">${p.icon || "H"}</div>
        `,
        iconSize: [isSelected ? 36 : 28, isSelected ? 36 : 28],
        iconAnchor: [isSelected ? 18 : 14, isSelected ? 18 : 14],
      });
      const marker = L.marker([p.lat, p.lng], { icon, zIndexOffset: isSelected ? 800 : 100 });
      if (p.name) {
        marker.bindTooltip(p.name, {
          direction: "top",
          offset: [0, -10],
          className: "resq-tooltip",
        });
      }
      marker.on("click", () => onSelectPlace && onSelectPlace(p));
      marker.addTo(map);
      placeMarkersRef.current.push(marker);
    });
  }, [places, selectedId, onSelectPlace]);

  // Route line: prefer real route geometry (from OSRM); fall back to a
  // straight dashed line between user and selected place.
  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    if (routeLineRef.current) {
      // Remove all layers from the route group
      if (Array.isArray(routeLineRef.current)) {
        routeLineRef.current.forEach((l) => map.removeLayer(l));
      } else {
        map.removeLayer(routeLineRef.current);
      }
      routeLineRef.current = null;
    }
    if (routeGeometry && routeGeometry.length >= 2) {
      const latlngs = routeGeometry.map((p) => [p.lat, p.lng]);
      // Outer "halo" line for contrast against any tile
      const halo = L.polyline(latlngs, {
        color: "#FFFFFF",
        weight: 7,
        opacity: 0.9,
        interactive: false,
      });
      const main = L.polyline(latlngs, {
        color: "#2563EB",
        weight: 5,
        opacity: 0.95,
        interactive: false,
        lineCap: "round",
        lineJoin: "round",
      });
      halo.addTo(map);
      main.addTo(map);
      routeLineRef.current = [halo, main];
      if (fitRouteOnUpdate) {
        const bounds = main.getBounds();
        if (userLocation) bounds.extend([userLocation.lat, userLocation.lng]);
        map.fitBounds(bounds, { padding: [40, 40] });
      }
      return;
    }
    if (!showRoute || !userLocation || !selectedId) return;
    const sel = places.find((p) => p.id === selectedId);
    if (!sel) return;
    routeLineRef.current = L.polyline(
      [[userLocation.lat, userLocation.lng], [sel.lat, sel.lng]],
      { color: tokens.color.text, weight: 3, opacity: 0.5, dashArray: "8 8", interactive: false }
    ).addTo(map);
  }, [selectedId, userLocation, places, showRoute, routeGeometry, fitRouteOnUpdate]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height, background: tokens.color.surfaceSubtle }}
    >
      <style>{`
        .resq-user-marker { position: relative; }
        .resq-user-pulse {
          position: absolute; inset: -8px;
          background: rgba(37,99,235,0.25);
          border-radius: 50%;
          animation: resq-user-pulse 1.6s ease-out infinite;
        }
        .resq-user-core {
          position: absolute; inset: 0;
          background: #2563EB;
          border: 2px solid #fff;
          border-radius: 50%;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
        @keyframes resq-user-pulse {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        .resq-tooltip {
          background: ${tokens.color.text} !important;
          color: #fff !important;
          border: none !important;
          border-radius: ${tokens.radius.sm} !important;
          padding: 4px 9px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          box-shadow: ${tokens.shadow.md} !important;
          font-family: ${tokens.font.family} !important;
        }
        .resq-tooltip:before { display: none !important; }
        .leaflet-control-zoom a {
          color: ${tokens.color.text} !important;
          font-weight: 600 !important;
        }
        .leaflet-control-attribution {
          font-size: 10px !important;
          background: rgba(255,255,255,0.85) !important;
        }
      `}</style>
    </div>
  );
}

// Geo math: haversine distance in metres between two {lat, lng} points.
export const distanceMeters = (a, b) => {
  if (!a || !b) return null;
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export const formatDistance = (m) => {
  if (m == null) return "—";
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
};
