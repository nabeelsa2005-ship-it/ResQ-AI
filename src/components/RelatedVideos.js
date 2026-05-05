import React, { useEffect, useState } from "react";
import { tokens } from "../theme";
import { searchVideos, embedUrl, isYouTubeConfigured } from "../utils/youtube";

// Show the top N YouTube videos for `query`. Click → embedded player modal
// (still inside the app, no leaving the site).
//
// `compact` switches the grid for a horizontal-scrollable strip — used
// inline in chat threads where space is tight.
export default function RelatedVideos({ query, label = "Watch demonstrations", max = 4, accentColor, compact = false }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState(null);
  const [configured] = useState(isYouTubeConfigured());

  useEffect(() => {
    if (!query || !configured) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    searchVideos(query, max)
      .then((items) => { if (!cancelled) setVideos(items); })
      .catch((err) => {
        if (cancelled) return;
        console.warn("YouTube search failed:", err);
        setError(err.message || "Couldn't load videos.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [query, max, configured]);

  if (!configured) {
    return (
      <div style={emptyCard}>
        <div style={emptyTitle}>📺 {label}</div>
        <p style={emptyHint}>
          Set <code style={code}>REACT_APP_RAPIDAPI_KEY</code> in <code style={code}>.env.local</code> to enable
          YouTube tutorial suggestions.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <div style={sectionLabel}>{label}</div>
        <div style={grid}>
          {[1, 2, 3, 4].slice(0, max).map((i) => (
            <div key={i} style={skel}>
              <div style={skelThumb} />
              <div style={skelLineLong} />
              <div style={skelLineShort} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={emptyCard}>
        <div style={emptyTitle}>📺 {label}</div>
        <p style={{ ...emptyHint, color: tokens.color.warning }}>{error}</p>
      </div>
    );
  }

  if (!videos.length) return null;

  const containerStyle = compact ? compactStrip : grid;
  const itemStyle = compact ? compactCard : card;

  return (
    <div style={compact ? compactWrap : null}>
      <div style={compact ? compactLabel : sectionLabel}>📺 {label}</div>
      <div style={containerStyle}>
        {videos.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setActive(v)}
            style={itemStyle}
            aria-label={`Play ${v.title}`}
          >
            <div style={compact ? compactThumbWrap : thumbWrap}>
              <img src={v.thumbnail} alt={v.title} style={thumbImg} loading="lazy" />
              <div style={{ ...playBtn, background: accentColor || tokens.color.danger }}>▶</div>
            </div>
            <div style={compact ? compactMeta : meta}>
              <div style={compact ? compactTitle : titleStyle}>{v.title}</div>
              <div style={channelStyle}>{v.channel}</div>
            </div>
          </button>
        ))}
      </div>

      {active && (
        <div style={modalOverlay} onClick={() => setActive(null)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={modalHead}>
              <div style={modalTitle}>{active.title}</div>
              <button
                style={closeBtn}
                onClick={() => setActive(null)}
                aria-label="Close"
              >×</button>
            </div>
            <div style={iframeWrap}>
              <iframe
                title={active.title}
                src={embedUrl(active.id, { autoplay: true })}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={iframeStyle}
              />
            </div>
            <div style={modalFoot}>
              <span style={modalChannel}>{active.channel}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const sectionLabel = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: tokens.color.textSubtle,
  margin: "0 0 10px",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  gap: 12,
};

// Compact = horizontal scroll strip used inline in chat threads.
const compactWrap = {
  marginTop: 10,
};

const compactLabel = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: tokens.color.textSubtle,
  margin: "0 0 8px 4px",
};

const compactStrip = {
  display: "flex",
  gap: 8,
  overflowX: "auto",
  paddingBottom: 4,
  scrollbarWidth: "thin",
};

const compactCard = {
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.md,
  padding: 0,
  cursor: "pointer",
  fontFamily: tokens.font.family,
  textAlign: "left",
  overflow: "hidden",
  flex: "0 0 200px",
  width: 200,
  transition: "transform 0.12s, box-shadow 0.12s, border-color 0.12s",
};

const compactThumbWrap = {
  position: "relative",
  width: "100%",
  aspectRatio: "16 / 9",
  background: tokens.color.surfaceSubtle,
  overflow: "hidden",
};

const compactMeta = {
  padding: "8px 10px 10px",
};

const compactTitle = {
  fontSize: 12,
  fontWeight: 700,
  color: tokens.color.text,
  lineHeight: 1.3,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const card = {
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.lg,
  padding: 0,
  cursor: "pointer",
  fontFamily: tokens.font.family,
  textAlign: "left",
  overflow: "hidden",
  transition: "transform 0.12s, box-shadow 0.12s, border-color 0.12s",
};

const thumbWrap = {
  position: "relative",
  width: "100%",
  aspectRatio: "16 / 9",
  background: tokens.color.surfaceSubtle,
  overflow: "hidden",
};

const thumbImg = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const playBtn = {
  position: "absolute",
  bottom: 8,
  right: 8,
  width: 36,
  height: 36,
  borderRadius: tokens.radius.pill,
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  paddingLeft: 3, // optical centring of the triangle
};

const meta = {
  padding: "10px 12px 12px",
};

const titleStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: tokens.color.text,
  lineHeight: 1.35,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const channelStyle = {
  fontSize: 11,
  color: tokens.color.textSubtle,
  marginTop: 4,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

// Skeletons
const skel = {
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.lg,
  padding: 0,
  overflow: "hidden",
};

const skelThumb = {
  width: "100%",
  aspectRatio: "16 / 9",
  background: `linear-gradient(90deg, ${tokens.color.surfaceSubtle} 0%, ${tokens.color.divider} 50%, ${tokens.color.surfaceSubtle} 100%)`,
  backgroundSize: "200% 100%",
  animation: "shimmer 1.4s infinite linear",
};

const skelLineLong = {
  height: 10,
  margin: "10px 12px 6px",
  background: tokens.color.surfaceSubtle,
  borderRadius: tokens.radius.sm,
};

const skelLineShort = {
  height: 8,
  width: "60%",
  margin: "0 12px 12px",
  background: tokens.color.surfaceSubtle,
  borderRadius: tokens.radius.sm,
};

const emptyCard = {
  background: tokens.color.surface,
  border: `1px dashed ${tokens.color.border}`,
  borderRadius: tokens.radius.lg,
  padding: 16,
};

const emptyTitle = {
  fontSize: 13,
  fontWeight: 700,
  color: tokens.color.text,
  marginBottom: 6,
};

const emptyHint = {
  fontSize: 12,
  color: tokens.color.textMuted,
  margin: 0,
  lineHeight: 1.5,
};

const code = {
  background: tokens.color.surfaceSubtle,
  padding: "1px 6px",
  borderRadius: tokens.radius.sm,
  fontFamily: tokens.font.mono,
  fontSize: 11,
};

// Modal
const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.7)",
  backdropFilter: "blur(6px)",
  zIndex: 200,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const modal = {
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.xl,
  width: "100%",
  maxWidth: 880,
  boxShadow: tokens.shadow.lg,
  fontFamily: tokens.font.family,
  overflow: "hidden",
};

const modalHead = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "14px 18px",
  borderBottom: `1px solid ${tokens.color.border}`,
  gap: 12,
};

const modalTitle = {
  fontSize: 14,
  fontWeight: 700,
  color: tokens.color.text,
  flex: 1,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const closeBtn = {
  width: 30,
  height: 30,
  borderRadius: tokens.radius.pill,
  border: `1px solid ${tokens.color.border}`,
  background: tokens.color.surfaceSubtle,
  color: tokens.color.textMuted,
  fontSize: 18,
  cursor: "pointer",
  fontFamily: tokens.font.family,
};

const iframeWrap = {
  position: "relative",
  width: "100%",
  aspectRatio: "16 / 9",
  background: "#000",
};

const iframeStyle = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  border: 0,
};

const modalFoot = {
  padding: "12px 18px",
  fontSize: 12,
  color: tokens.color.textMuted,
};

const modalChannel = {
  fontWeight: 600,
};
