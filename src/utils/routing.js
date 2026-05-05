// In-app driving directions via OSRM (Open Source Routing Machine).
// The public demo server at router.project-osrm.org is free, no API key,
// rate-limited per-IP. Good enough for hackathon-grade traffic.

const OSRM_BASE = "https://router.project-osrm.org/route/v1";

const PROFILE_MAP = {
  driving: "driving",
  walking: "foot",
  cycling: "bike",
};

// Returns:
// {
//   distanceMeters, durationSeconds,
//   geometry: [{lat, lng}, ...]   // dense polyline of the route
//   steps: [{ instruction, distanceMeters, durationSeconds, name }]
// }
// or null if the route can't be found / network fails.
export const fetchRoute = async (from, to, profile = "driving") => {
  if (!from || !to) return null;
  const p = PROFILE_MAP[profile] || "driving";
  const url = `${OSRM_BASE}/${p}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true&annotations=false`;
  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    console.warn("OSRM fetch failed:", err);
    return null;
  }
  if (!res.ok) return null;
  const data = await res.json();
  const route = data.routes && data.routes[0];
  if (!route) return null;

  const geometry = (route.geometry?.coordinates || []).map(([lng, lat]) => ({ lat, lng }));
  const steps = [];
  for (const leg of route.legs || []) {
    for (const s of leg.steps || []) {
      steps.push({
        instruction: synthesizeInstruction(s),
        distanceMeters: s.distance,
        durationSeconds: s.duration,
        name: s.name || "",
      });
    }
  }
  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry,
    steps,
  };
};

// OSRM doesn't include English narrative — only structured maneuver objects.
// We compose a short, human-readable line per step here.
const synthesizeInstruction = (s) => {
  const m = s.maneuver || {};
  const type = m.type || "continue";
  const modifier = m.modifier;
  const street = s.name || "";
  const verb = {
    depart: "Start",
    arrive: "Arrive",
    "new name": "Continue on",
    turn: modifier ? `Turn ${modifier}` : "Turn",
    "end of road": modifier ? `Turn ${modifier}` : "Turn",
    merge: modifier ? `Merge ${modifier}` : "Merge",
    "on ramp": modifier ? `Take the ramp ${modifier}` : "Take the ramp",
    "off ramp": modifier ? `Take the ramp ${modifier}` : "Take the ramp",
    fork: modifier ? `Keep ${modifier}` : "Keep going",
    roundabout: m.exit ? `Take exit ${m.exit} at the roundabout` : "Enter the roundabout",
    rotary: m.exit ? `Take exit ${m.exit} at the roundabout` : "Enter the roundabout",
    "roundabout turn": modifier ? `Roundabout, ${modifier}` : "Roundabout",
    notification: "Continue",
    continue: modifier ? `Continue ${modifier}` : "Continue",
  }[type] || "Continue";

  if (type === "depart") return street ? `Head along ${street}` : "Start your trip";
  if (type === "arrive") return "You have arrived";
  return street ? `${verb} onto ${street}` : verb;
};

export const formatDuration = (sec) => {
  if (!sec) return "—";
  const mins = Math.round(sec / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
};

export const formatRouteDistance = (m) => {
  if (m == null) return "—";
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
};
