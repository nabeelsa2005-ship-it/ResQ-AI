// Fetch real nearby places from OpenStreetMap via the Overpass API.
// Free, no API key, queries the live OSM database.

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// Per-category Overpass queries. Use a 5km radius by default.
// We deliberately union node + way + relation so we catch hospitals stored
// as building polygons too — Overpass returns their centroid via `out center`.
const buildQuery = (category, lat, lng, radius = 5000) => {
  const filters = {
    hospitals: [
      `node["amenity"="hospital"](around:${radius},${lat},${lng});`,
      `way["amenity"="hospital"](around:${radius},${lat},${lng});`,
      `node["healthcare"="hospital"](around:${radius},${lat},${lng});`,
      `way["healthcare"="hospital"](around:${radius},${lat},${lng});`,
    ],
    police: [
      `node["amenity"="police"](around:${radius},${lat},${lng});`,
      `way["amenity"="police"](around:${radius},${lat},${lng});`,
    ],
    fire: [
      `node["amenity"="fire_station"](around:${radius},${lat},${lng});`,
      `way["amenity"="fire_station"](around:${radius},${lat},${lng});`,
    ],
    pharmacy: [
      `node["amenity"="pharmacy"](around:${radius},${lat},${lng});`,
      `way["amenity"="pharmacy"](around:${radius},${lat},${lng});`,
    ],
    clinic: [
      `node["amenity"="clinic"](around:${radius},${lat},${lng});`,
      `node["healthcare"="clinic"](around:${radius},${lat},${lng});`,
      `node["healthcare"="doctor"](around:${radius},${lat},${lng});`,
    ],
  };
  const body = (filters[category] || filters.hospitals).join("\n");
  return `
    [out:json][timeout:15];
    (
      ${body}
    );
    out center tags 30;
  `;
};

const haversine = (a, b) => {
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

export const fetchNearbyPlaces = async (category, location, radius = 5000) => {
  if (!location) return [];
  const query = buildQuery(category, location.lat, location.lng, radius);
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
  const data = await res.json();

  const seen = new Set();
  const places = [];
  for (const el of data.elements || []) {
    const center = el.type === "node"
      ? { lat: el.lat, lng: el.lon }
      : el.center
      ? { lat: el.center.lat, lng: el.center.lon }
      : null;
    if (!center) continue;
    const tags = el.tags || {};
    const name = tags.name || tags["name:en"] || tags.operator || tags.brand;
    if (!name) continue;
    const key = `${center.lat.toFixed(5)}-${center.lng.toFixed(5)}-${name}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // Build a short address line.
    const addr = [
      tags["addr:housename"],
      tags["addr:street"],
      tags["addr:suburb"] || tags["addr:neighbourhood"],
      tags["addr:city"] || tags["addr:town"] || tags["addr:village"],
    ].filter(Boolean).join(", ");

    places.push({
      id: `${el.type}/${el.id}`,
      name,
      lat: center.lat,
      lng: center.lng,
      address: addr || tags["addr:full"] || "",
      phone: tags.phone || tags["contact:phone"] || tags["phone:emergency"] || null,
      website: tags.website || tags["contact:website"] || null,
      openingHours: tags.opening_hours || null,
      emergency: tags.emergency === "yes" || tags["emergency:psychiatric_ward"] === "yes",
      raw: tags,
      distance: haversine(location, center),
    });
  }

  places.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
  return places.slice(0, 50);
};
