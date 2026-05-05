import React from "react";
import { tokens } from "../theme";
import LeafletMap from "./LeafletMap";

// Compact live-location preview card. Renders a real Leaflet map with the
// user's pulsing position marker, plus a coordinate readout strip. Used
// inside the SOS card so people can verify what'll be sent.
export default function LocationMap({ location, accuracy, compact = false, status = "live" }) {
  const height = compact ? 180 : 320;

  if (!location) {
    return (
      <div style={{
        height,
        background: tokens.color.surfaceSubtle,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.md,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: tokens.color.textSubtle,
        fontSize: "13px",
        flexDirection: "column",
        gap: 8,
      }}>
        <div style={{ fontSize: 22 }}>📡</div>
        Acquiring GPS…
      </div>
    );
  }

  return (
    <div style={{
      position: "relative",
      borderRadius: tokens.radius.md,
      overflow: "hidden",
      border: `1px solid ${tokens.color.border}`,
      height,
      background: tokens.color.surfaceSubtle,
    }}>
      <LeafletMap
        center={[location.lat, location.lng]}
        zoom={16}
        userLocation={{ ...location, accuracy: accuracy || location.accuracy }}
        height="100%"
        view="standard"
        showRoute={false}
      />
      {/* Live indicator overlay */}
      <div style={{
        position: "absolute",
        top: 10,
        left: 10,
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(8px)",
        padding: "5px 10px",
        borderRadius: tokens.radius.pill,
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.04em",
        color: status === "live" ? tokens.color.success : tokens.color.textMuted,
        boxShadow: tokens.shadow.sm,
        pointerEvents: "none",
      }}>
        <span style={{
          width: 7,
          height: 7,
          borderRadius: tokens.radius.pill,
          background: status === "live" ? tokens.color.success : tokens.color.textSubtle,
          boxShadow: status === "live" ? "0 0 0 3px rgba(22,163,74,0.25)" : undefined,
          animation: status === "live" ? "loc-pulse 1.4s ease-in-out infinite" : "none",
        }} />
        {status === "live" ? "LIVE" : "STALE"}
      </div>
      {/* Coordinate readout */}
      <div style={{
        position: "absolute",
        bottom: 10,
        left: 10,
        right: 10,
        zIndex: 500,
        background: "rgba(15,23,42,0.88)",
        color: "#fff",
        padding: "6px 10px",
        borderRadius: tokens.radius.sm,
        fontSize: "11px",
        fontFamily: tokens.font.mono,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        pointerEvents: "none",
      }}>
        <span>{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
        {accuracy && (
          <span style={{ opacity: 0.7 }}>±{Math.round(accuracy)}m</span>
        )}
      </div>
      <style>{`
        @keyframes loc-pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(22,163,74,0.25); }
          50% { box-shadow: 0 0 0 6px rgba(22,163,74,0); }
        }
      `}</style>
    </div>
  );
}
