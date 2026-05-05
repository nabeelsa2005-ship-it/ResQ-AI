import React, { useState, useEffect, useMemo, useCallback } from "react";
import { tokens } from "../theme";
import LeafletMap, { formatDistance } from "../components/LeafletMap";
import { fetchNearbyPlaces } from "../utils/places";
import { watchLocation, getCurrentLocation } from "../utils/native";
import { fetchRoute, formatDuration, formatRouteDistance } from "../utils/routing";

const TABS = [
  { key: "hospitals", label: "Hospitals", icon: "H", emoji: "🏥", color: tokens.color.medical },
  { key: "police",    label: "Police",    icon: "P", emoji: "👮", color: tokens.color.disaster },
  { key: "fire",      label: "Fire",      icon: "F", emoji: "🚒", color: tokens.color.fire },
  { key: "pharmacy",  label: "Pharmacy",  icon: "+", emoji: "💊", color: tokens.color.home },
  { key: "clinic",    label: "Clinics",   icon: "C", emoji: "🩺", color: tokens.color.accident },
];

const HARDCODED_FALLBACK = {
  hospitals: [
    { id: "fb-1", name: "AIIMS", phone: "011-26588500", address: "Ansari Nagar, New Delhi", lat: 28.5672, lng: 77.2100 },
    { id: "fb-2", name: "Safdarjung Hospital", phone: "011-26707444", address: "Ansari Nagar West", lat: 28.5689, lng: 77.2061 },
    { id: "fb-3", name: "Apollo Hospital", phone: "011-26925858", address: "Sarita Vihar", lat: 28.5305, lng: 77.2890 },
  ],
};

export default function Nearby() {
  const [active, setActive] = useState("hospitals");
  const [location, setLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState("standard"); // standard | satellite | hybrid
  const [search, setSearch] = useState("");
  const [profile, setProfile] = useState("driving"); // driving | walking | cycling
  const [route, setRoute] = useState(null);          // OSRM result for the selected place
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [showSteps, setShowSteps] = useState(false);

  const activeTab = TABS.find((t) => t.key === active) || TABS[0];

  // Subscribe to live location.
  useEffect(() => {
    let unsub;
    let cancelled = false;
    getCurrentLocation().then((loc) => {
      if (cancelled) return;
      if (loc) setLocation(loc);
      else setLocation({ lat: 28.6139, lng: 77.209 });
    });
    unsub = watchLocation((loc) => {
      if (cancelled) return;
      setLocation((prev) => prev ? { ...prev, ...loc } : loc);
    });
    return () => {
      cancelled = true;
      try { unsub && unsub(); } catch {}
    };
  }, []);

  // Fetch places whenever the active tab or location (significantly) changes.
  const locationKey = useMemo(
    () => location ? `${location.lat.toFixed(3)},${location.lng.toFixed(3)}` : "",
    [location]
  );

  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    setLoading(true);
    setErrorMsg("");
    setSelectedId(null);
    (async () => {
      try {
        const results = await fetchNearbyPlaces(active, location, 5000);
        if (cancelled) return;
        if (!results.length) {
          // Try a larger radius for sparse areas before giving up.
          const wider = await fetchNearbyPlaces(active, location, 15000);
          if (!cancelled) setPlaces(wider);
        } else {
          setPlaces(results);
        }
      } catch (err) {
        if (cancelled) return;
        console.warn("Overpass fetch failed:", err);
        setErrorMsg("Couldn't reach the live places API. Showing fallback list.");
        setPlaces(HARDCODED_FALLBACK[active] || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [active, locationKey, location]);

  const filtered = useMemo(() => {
    if (!search.trim()) return places;
    const q = search.trim().toLowerCase();
    return places.filter((p) =>
      p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)
    );
  }, [places, search]);

  const placeMarkers = useMemo(
    () => filtered.map((p) => ({
      ...p,
      icon: activeTab.icon,
      color: activeTab.color,
    })),
    [filtered, activeTab]
  );

  const handleSelectPlace = useCallback((p) => {
    setSelectedId(p.id);
    // Selecting a different place clears the existing route — we only fetch
    // a route on explicit "Directions" click.
    setRoute(null);
    setRouteError("");
    setShowSteps(false);
  }, []);

  const selectedPlace = filtered.find((p) => p.id === selectedId);

  // Re-fetch the route when profile changes (only if we already have one for this place).
  const requestDirections = useCallback(async (placeOverride, profileOverride) => {
    const target = placeOverride || selectedPlace;
    const prof = profileOverride || profile;
    if (!location || !target) return;
    setRouteLoading(true);
    setRouteError("");
    try {
      const r = await fetchRoute(location, { lat: target.lat, lng: target.lng }, prof);
      if (!r) {
        setRouteError("No route available — the destination may be unreachable by this mode.");
        setRoute(null);
        return;
      }
      setRoute(r);
    } catch (err) {
      console.warn("Route fetch failed:", err);
      setRouteError("Couldn't compute route. Try again.");
      setRoute(null);
    } finally {
      setRouteLoading(false);
    }
  }, [location, selectedPlace, profile]);

  // Auto-refresh route when user changes profile.
  useEffect(() => {
    if (route && selectedPlace) {
      requestDirections(selectedPlace, profile);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);
  const mapCenter = selectedPlace
    ? [selectedPlace.lat, selectedPlace.lng]
    : location ? [location.lat, location.lng] : null;

  return (
    <div style={page}>
      <style>{`
        .nearby-card { transition: transform 0.12s, box-shadow 0.12s, border-color 0.12s, background 0.12s; }
        .nearby-card:hover { background: ${tokens.color.surfaceSubtle}; }
        .nearby-card.active {
          background: ${tokens.color.surface};
          border-color: ${tokens.color.text} !important;
          box-shadow: ${tokens.shadow.md};
        }
        .tab-pill { transition: all 0.12s; white-space: nowrap; }
        .tab-pill:hover { background: ${tokens.color.surfaceSubtle}; }
        .view-btn { transition: background 0.12s; }
        .view-btn:hover { background: ${tokens.color.surfaceSubtle}; }
        @media (max-width: 1024px) {
          .nearby-shell { grid-template-columns: 1fr !important; }
          .nearby-list { max-height: 50vh !important; }
          .nearby-map { min-height: 50vh !important; }
        }
        .nearby-list::-webkit-scrollbar { width: 8px; }
        .nearby-list::-webkit-scrollbar-thumb { background: ${tokens.color.border}; border-radius: 4px; }
      `}</style>

      <div className="nearby-shell" style={shell}>
        {/* LEFT: search + filters + results list */}
        <aside style={leftCol}>
          <div style={searchHeader}>
            <div style={searchBox}>
              <span style={searchIcon}>⌕</span>
              <input
                style={searchInput}
                placeholder={`Search ${activeTab.label.toLowerCase()} near you`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button style={clearBtn} onClick={() => setSearch("")}>×</button>
              )}
            </div>
            <div style={tabsRow}>
              {TABS.map((tab) => {
                const isActive = tab.key === active;
                return (
                  <button
                    key={tab.key}
                    className="tab-pill"
                    onClick={() => setActive(tab.key)}
                    style={{
                      ...tabPill,
                      background: isActive ? tokens.color.text : tokens.color.surface,
                      color: isActive ? "#fff" : tokens.color.textMuted,
                      borderColor: isActive ? tokens.color.text : tokens.color.border,
                    }}
                  >
                    <span style={{ marginRight: 6 }}>{tab.emoji}</span>{tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={resultsHead}>
            <div>
              <div style={resultsTitle}>
                {loading ? "Loading…" : `${filtered.length} result${filtered.length === 1 ? "" : "s"}`}
              </div>
              {errorMsg && <div style={errorPill}>{errorMsg}</div>}
            </div>
            {location && (
              <div style={locTag}>
                <span style={locDot} />
                <span style={{ fontFamily: tokens.font.mono }}>
                  {location.lat.toFixed(3)}, {location.lng.toFixed(3)}
                </span>
              </div>
            )}
          </div>

          <div className="nearby-list" style={resultsList}>
            {loading && (
              <div style={loadingState}>Searching OpenStreetMap…</div>
            )}
            {!loading && filtered.length === 0 && (
              <div style={emptyState}>
                Nothing matched. Try another category or search term.
              </div>
            )}
            {!loading && filtered.map((p) => {
              const isActive = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  className={`nearby-card ${isActive ? "active" : ""}`}
                  onClick={() => handleSelectPlace(p)}
                  style={{
                    ...resultCard,
                    background: isActive ? tokens.color.surface : tokens.color.surface,
                    borderColor: isActive ? tokens.color.text : tokens.color.border,
                  }}
                >
                  <div style={cardTopRow}>
                    <div style={{ ...iconBadge, color: activeTab.color, background: `${activeTab.color}14` }}>
                      {activeTab.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={cardName}>{p.name}</div>
                      {p.address && <div style={cardAddress}>{p.address}</div>}
                    </div>
                    <div style={{ ...cardDistance, color: activeTab.color }}>
                      {formatDistance(p.distance)}
                    </div>
                  </div>
                  <div style={cardActions}>
                    {p.phone && (
                      <a
                        href={`tel:${p.phone.replace(/\s/g, "")}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ ...cardActionBtn, background: activeTab.color, color: "#fff", borderColor: activeTab.color }}
                      >
                        📞 Call
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPlace(p);
                        requestDirections(p, profile);
                      }}
                      style={{ ...cardActionBtn, cursor: "pointer" }}
                    >
                      ➤ Directions
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* RIGHT: full-bleed map */}
        <section className="nearby-map" style={mapCol}>
          <div style={viewToggle}>
            {[
              { key: "standard", label: "Map" },
              { key: "satellite", label: "Satellite" },
              { key: "hybrid", label: "Hybrid" },
            ].map((v, i) => (
              <button
                key={v.key}
                className="view-btn"
                onClick={() => setView(v.key)}
                style={{
                  ...viewToggleBtn,
                  background: view === v.key ? tokens.color.text : tokens.color.surface,
                  color: view === v.key ? "#fff" : tokens.color.textMuted,
                  borderRight: i < 2 ? `1px solid ${tokens.color.border}` : "none",
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
          <LeafletMap
            center={mapCenter}
            zoom={selectedPlace ? 16 : 13}
            userLocation={location}
            places={placeMarkers}
            selectedId={selectedId}
            onSelectPlace={handleSelectPlace}
            view={view}
            height="100%"
            routeGeometry={route?.geometry || null}
            fitRouteOnUpdate={!!route}
          />

          {/* In-app directions panel */}
          {(route || routeLoading || routeError) && selectedPlace && (
            <div style={dirPanel}>
              <div style={dirPanelHead}>
                <div>
                  <div style={dirPanelEyebrow}>Directions to</div>
                  <div style={dirPanelTitle}>{selectedPlace.name}</div>
                </div>
                <button
                  type="button"
                  onClick={() => { setRoute(null); setRouteError(""); setShowSteps(false); }}
                  style={dirCloseBtn}
                  aria-label="Close directions"
                >
                  ×
                </button>
              </div>

              <div style={dirProfileRow}>
                {[
                  { key: "driving", label: "Drive", icon: "🚗" },
                  { key: "walking", label: "Walk", icon: "🚶" },
                  { key: "cycling", label: "Cycle", icon: "🚴" },
                ].map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setProfile(p.key)}
                    style={{
                      ...dirProfileBtn,
                      background: profile === p.key ? tokens.color.text : tokens.color.surface,
                      color: profile === p.key ? "#fff" : tokens.color.textMuted,
                      borderColor: profile === p.key ? tokens.color.text : tokens.color.border,
                    }}
                  >
                    <span style={{ marginRight: 4 }}>{p.icon}</span>{p.label}
                  </button>
                ))}
              </div>

              {routeLoading && (
                <div style={dirLoading}>Calculating route…</div>
              )}
              {routeError && !routeLoading && (
                <div style={dirError}>{routeError}</div>
              )}
              {route && !routeLoading && (
                <>
                  <div style={dirStats}>
                    <div style={{ ...dirStat, color: activeTab.color }}>
                      <div style={dirStatBig}>{formatDuration(route.durationSeconds)}</div>
                      <div style={dirStatLabel}>ETA</div>
                    </div>
                    <div style={dirStatDivider} />
                    <div style={dirStat}>
                      <div style={{ ...dirStatBig, color: tokens.color.text }}>{formatRouteDistance(route.distanceMeters)}</div>
                      <div style={dirStatLabel}>Distance</div>
                    </div>
                    <div style={dirStatDivider} />
                    <div style={dirStat}>
                      <div style={{ ...dirStatBig, color: tokens.color.text }}>{route.steps.length}</div>
                      <div style={dirStatLabel}>Steps</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSteps((v) => !v)}
                    style={dirStepsToggle}
                  >
                    {showSteps ? "Hide turn-by-turn" : "Show turn-by-turn"} ›
                  </button>

                  {showSteps && (
                    <ol style={dirStepsList}>
                      {route.steps.map((s, i) => (
                        <li key={i} style={dirStepItem}>
                          <span style={dirStepIndex}>{i + 1}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={dirStepText}>{s.instruction}</div>
                            <div style={dirStepMeta}>
                              {formatRouteDistance(s.distanceMeters)} · {formatDuration(s.durationSeconds)}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const page = { width: "100%", height: "calc(100vh - 65px)", background: tokens.color.bg };

const shell = {
  display: "grid",
  gridTemplateColumns: "minmax(360px, 420px) minmax(0, 1fr)",
  height: "100%",
  width: "100%",
};

const leftCol = {
  background: tokens.color.surface,
  borderRight: `1px solid ${tokens.color.border}`,
  display: "flex",
  flexDirection: "column",
  height: "100%",
  overflow: "hidden",
};

const searchHeader = {
  padding: "16px 20px 12px",
  borderBottom: `1px solid ${tokens.color.border}`,
};

const searchBox = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: tokens.color.surfaceSubtle,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.pill,
  padding: "0 12px",
  height: 40,
};

const searchIcon = {
  fontSize: 16,
  color: tokens.color.textSubtle,
};

const searchInput = {
  flex: 1,
  background: "transparent",
  border: "none",
  outline: "none",
  fontSize: 14,
  color: tokens.color.text,
  fontFamily: tokens.font.family,
};

const clearBtn = {
  background: "transparent",
  border: "none",
  color: tokens.color.textSubtle,
  fontSize: 18,
  cursor: "pointer",
  padding: 0,
  width: 22,
  fontFamily: tokens.font.family,
};

const tabsRow = {
  display: "flex",
  gap: 6,
  marginTop: 12,
  overflowX: "auto",
  scrollbarWidth: "none",
};

const tabPill = {
  border: "1px solid",
  padding: "6px 12px",
  borderRadius: tokens.radius.pill,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: tokens.font.family,
  flexShrink: 0,
};

const resultsHead = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 20px",
  gap: 10,
};

const resultsTitle = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: tokens.color.textSubtle,
};

const errorPill = {
  fontSize: 11,
  color: tokens.color.warning,
  marginTop: 4,
};

const locTag = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 11,
  color: tokens.color.textSubtle,
};

const locDot = {
  width: 7,
  height: 7,
  borderRadius: tokens.radius.pill,
  background: tokens.color.success,
  boxShadow: "0 0 0 3px rgba(22,163,74,0.18)",
};

const resultsList = {
  flex: 1,
  overflowY: "auto",
  padding: "0 12px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const resultCard = {
  width: "100%",
  textAlign: "left",
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.lg,
  padding: 14,
  cursor: "pointer",
  fontFamily: tokens.font.family,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const cardTopRow = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
};

const iconBadge = {
  width: 32,
  height: 32,
  borderRadius: tokens.radius.pill,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 800,
  flexShrink: 0,
};

const cardName = {
  fontSize: 14,
  fontWeight: 700,
  color: tokens.color.text,
  lineHeight: 1.3,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const cardAddress = {
  fontSize: 12,
  color: tokens.color.textMuted,
  lineHeight: 1.4,
  marginTop: 2,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const cardDistance = {
  fontSize: 12,
  fontWeight: 700,
  flexShrink: 0,
};

const cardActions = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

const cardActionBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "6px 10px",
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.md,
  fontSize: 12,
  fontWeight: 600,
  textDecoration: "none",
  color: tokens.color.text,
  background: tokens.color.surface,
  fontFamily: tokens.font.family,
};

const loadingState = {
  padding: 24,
  textAlign: "center",
  color: tokens.color.textSubtle,
  fontSize: 13,
};

const emptyState = {
  padding: 24,
  textAlign: "center",
  color: tokens.color.textSubtle,
  fontSize: 13,
};

const mapCol = {
  position: "relative",
  height: "100%",
  width: "100%",
  overflow: "hidden",
};

const viewToggle = {
  position: "absolute",
  top: 12,
  right: 12,
  zIndex: 400,
  display: "flex",
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.md,
  overflow: "hidden",
  boxShadow: tokens.shadow.md,
};

const viewToggleBtn = {
  border: "none",
  padding: "8px 14px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: tokens.font.family,
};

const dirPanel = {
  position: "absolute",
  bottom: 16,
  left: 16,
  right: 16,
  maxWidth: 480,
  marginInline: "auto",
  zIndex: 500,
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.lg,
  boxShadow: tokens.shadow.lg,
  padding: 16,
  fontFamily: tokens.font.family,
  maxHeight: "calc(100% - 80px)",
  overflowY: "auto",
};

const dirPanelHead = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 12,
};

const dirPanelEyebrow = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: tokens.color.textSubtle,
};

const dirPanelTitle = {
  fontSize: 16,
  fontWeight: 700,
  color: tokens.color.text,
  letterSpacing: "-0.01em",
  marginTop: 2,
};

const dirCloseBtn = {
  width: 28,
  height: 28,
  borderRadius: tokens.radius.pill,
  border: `1px solid ${tokens.color.border}`,
  background: tokens.color.surfaceSubtle,
  color: tokens.color.textMuted,
  fontSize: 18,
  cursor: "pointer",
  fontFamily: tokens.font.family,
  flexShrink: 0,
};

const dirProfileRow = {
  display: "flex",
  gap: 6,
  marginBottom: 12,
};

const dirProfileBtn = {
  border: "1px solid",
  padding: "6px 12px",
  borderRadius: tokens.radius.pill,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: tokens.font.family,
};

const dirLoading = {
  padding: "16px 0",
  textAlign: "center",
  color: tokens.color.textSubtle,
  fontSize: 13,
};

const dirError = {
  padding: 12,
  background: tokens.color.warningBg,
  border: `1px solid ${tokens.color.warningBorder}`,
  borderRadius: tokens.radius.md,
  color: tokens.color.warning,
  fontSize: 13,
  fontWeight: 500,
};

const dirStats = {
  display: "flex",
  alignItems: "center",
  background: tokens.color.surfaceSubtle,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.md,
  padding: "12px 8px",
  marginBottom: 10,
};

const dirStat = {
  flex: 1,
  textAlign: "center",
};

const dirStatDivider = {
  width: 1,
  height: 28,
  background: tokens.color.border,
};

const dirStatBig = {
  fontSize: 18,
  fontWeight: 800,
  letterSpacing: "-0.01em",
};

const dirStatLabel = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: tokens.color.textSubtle,
  marginTop: 2,
};

const dirStepsToggle = {
  background: "transparent",
  border: "none",
  color: tokens.color.text,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: tokens.font.family,
  padding: 0,
  marginTop: 4,
};

const dirStepsList = {
  listStyle: "none",
  padding: 0,
  margin: "12px 0 0",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const dirStepItem = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  padding: 10,
  background: tokens.color.surfaceSubtle,
  borderRadius: tokens.radius.md,
};

const dirStepIndex = {
  width: 22,
  height: 22,
  flexShrink: 0,
  borderRadius: tokens.radius.pill,
  background: tokens.color.text,
  color: "#fff",
  fontSize: 11,
  fontWeight: 800,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const dirStepText = {
  fontSize: 13,
  fontWeight: 500,
  color: tokens.color.text,
  lineHeight: 1.4,
};

const dirStepMeta = {
  fontSize: 11,
  color: tokens.color.textSubtle,
  marginTop: 2,
};
