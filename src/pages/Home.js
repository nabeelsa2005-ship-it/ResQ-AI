import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import emergencyData from "../data/emergencyData";
import AIGuide from "../components/AIGuide";
import SOSButton from "../components/SOSButton";
import { TRIAGE_TREES, TRIAGE_BY_CATEGORY } from "../data/triageTrees";
import { tokens, styles as S } from "../theme";
import { transcribeAudio } from "../utils/groqAudio";
import { recordUtterance } from "../utils/recorder";
import { classifyEmergencyImage, triageTreeFor } from "../utils/groqVision";

const Home = () => {
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [vision, setVision] = useState(null); // { state: 'analyzing'|'done'|'error', preview, result, error }
  const fileInputRef = React.useRef(null);
  const navigate = useNavigate();
  const { user, t, isNewUser, setIsNewUser, primaryLang } = useAppContext();

  useEffect(() => {
    if (isNewUser) {
      const timer = setTimeout(() => {
        setGuideOpen(true);
        setIsNewUser(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isNewUser, setIsNewUser]);

  const categories = [
    { id: "medical", icon: "❤", title: t.medical, color: tokens.color.medical },
    { id: "fire", icon: "🔥", title: t.fire, color: tokens.color.fire },
    { id: "accident", icon: "🚗", title: t.accident, color: tokens.color.accident },
    { id: "crime", icon: "🚨", title: t.crime, color: tokens.color.crime },
    { id: "disaster", icon: "🌊", title: t.disaster, color: tokens.color.disaster },
    { id: "home", icon: "⚡", title: t.home, color: tokens.color.home },
  ];

  const handleSearch = (text) => {
    const q = text || inputText;
    if (!q.trim()) {
      setError(t.typeError);
      return;
    }
    navigate("/guidance", { state: { query: q } });
  };

  // Voice input → Groq Whisper → auto-submit. Works on every browser
  // (including iOS Safari) because we never touch SpeechRecognition.
  const recCtrlRef = React.useRef(null);
  const handleVoice = async () => {
    if (isListening && recCtrlRef.current) {
      try { await recCtrlRef.current.stopEarly(); } catch {}
      return;
    }
    setError("");
    setIsListening(true);
    try {
      const ctrl = recordUtterance({});
      recCtrlRef.current = ctrl;
      await ctrl.started;
      const blob = await ctrl.finished;
      recCtrlRef.current = null;
      if (!blob || blob.size < 1000) {
        setIsListening(false);
        return;
      }
      const transcript = await transcribeAudio(blob, primaryLang);
      setIsListening(false);
      if (!transcript) {
        setError(t.voiceFailed || "Couldn't hear that. Try again.");
        return;
      }
      setInputText(transcript);
      handleSearch(transcript);
    } catch (err) {
      console.error("Voice failed:", err);
      setIsListening(false);
      recCtrlRef.current = null;
      const code = err.name === "NotAllowedError" ? "denied"
        : err.name === "NotFoundError" ? "no-mic"
        : "generic";
      const msg = code === "denied"
        ? "Microphone access was blocked. Allow it in browser settings."
        : code === "no-mic"
        ? "No microphone found."
        : t.voiceFailed || "Voice failed. Please type instead.";
      setError(msg);
    }
  };

  const handlePhotoPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file later
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setVision({ state: "analyzing", preview: previewUrl, result: null });
    setError("");

    try {
      const result = await classifyEmergencyImage(file, primaryLang);
      setVision({ state: "done", preview: previewUrl, result });
    } catch (err) {
      console.error("Vision failed:", err);
      setVision({
        state: "error",
        preview: previewUrl,
        result: null,
        error: err.message || "Image analysis failed.",
      });
    }
  };

  const acceptVision = () => {
    if (!vision || vision.state !== "done") return;
    const { result } = vision;
    const treeId = triageTreeFor(result.category);
    setVision(null);
    if (treeId) {
      navigate(`/triage/${treeId}`, { state: { fromVision: result } });
    } else {
      const initialQuery = result.description
        ? `Photo analysis: ${result.description}. ${result.immediateAction || ""}`.trim()
        : "Please analyze this emergency.";
      navigate("/guidance", { state: { query: initialQuery, fromVision: result, imagePreview: vision.preview } });
    }
  };

  const handleCategory = (cat) => {
    const triageIds = TRIAGE_BY_CATEGORY[cat.id];
    if (triageIds && triageIds.length > 0) {
      navigate(`/triage/${triageIds[0]}`);
      return;
    }
    const data = emergencyData[cat.id];
    if (!data) return;
    const sub = Object.values(data.subcategories)[0];
    navigate("/guidance", { state: { query: `${cat.title} emergency - ${sub.title}` } });
  };

  const offlineGuides = Object.values(TRIAGE_TREES);

  const quickNumbers = [
    { num: "112", label: "All emergencies" },
    { num: "102", label: "Ambulance" },
    { num: "101", label: "Fire" },
    { num: "100", label: "Police" },
  ];

  const nearbyQuick = [
    { icon: "🏥", label: "Hospitals", color: tokens.color.medical, key: "hospitals" },
    { icon: "👮", label: "Police", color: tokens.color.disaster, key: "police" },
    { icon: "🚒", label: "Fire", color: tokens.color.fire, key: "fire" },
    { icon: "🚑", label: "Ambulance", color: tokens.color.home, key: "ambulance" },
  ];

  return (
    <div style={page}>
      <style>{`
        .home-tile { transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s; cursor: pointer; }
        .home-tile:hover { transform: translateY(-2px); box-shadow: ${tokens.shadow.md}; border-color: ${tokens.color.borderStrong}; }
        .home-input:focus { border-color: ${tokens.color.primary} !important;
                            box-shadow: 0 0 0 3px rgba(15,23,42,0.06) !important; }
        .home-quick:hover { background: ${tokens.color.surfaceSubtle}; }
        .nearby-row:hover { background: ${tokens.color.surfaceSubtle}; }
        @keyframes vis-spin { to { transform: rotate(360deg); } }
        @media (max-width: 1024px) {
          .grid-main { grid-template-columns: 1fr !important; }
          .side-col { order: 2; }
        }
        @media (max-width: 720px) {
          .offline-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {guideOpen && <AIGuide onClose={() => setGuideOpen(false)} />}

      {/* Image-triage modal */}
      {vision && (
        <div style={visionOverlay} onClick={() => vision.state !== "analyzing" && setVision(null)}>
          <div style={visionCard} onClick={(e) => e.stopPropagation()}>
            <div style={visionHeader}>
              <div style={visionEyebrow}>Photo triage</div>
              {vision.state !== "analyzing" && (
                <button
                  style={visionCloseBtn}
                  onClick={() => setVision(null)}
                  aria-label="Close"
                >×</button>
              )}
            </div>

            {vision.preview && (
              <div style={visionPreviewWrap}>
                <img src={vision.preview} alt="Uploaded" style={visionPreviewImg} />
                {vision.state === "analyzing" && (
                  <div style={visionPreviewOverlay}>
                    <div style={visionSpinner} />
                    <p style={visionAnalyzeText}>Analyzing…</p>
                  </div>
                )}
              </div>
            )}

            {vision.state === "analyzing" && (
              <p style={visionStatusText}>
                AI is looking at your photo to identify the emergency. This takes 2–4 seconds.
              </p>
            )}

            {vision.state === "error" && (
              <>
                <p style={{ ...visionStatusText, color: tokens.color.danger }}>
                  {vision.error}
                </p>
                <div style={visionActions}>
                  <button style={S.secondaryBtn} onClick={() => setVision(null)}>Cancel</button>
                  <button
                    style={S.primaryBtn}
                    onClick={() => fileInputRef.current?.click()}
                  >Try another photo</button>
                </div>
              </>
            )}

            {vision.state === "done" && vision.result && (
              <>
                <div style={visionResultBox}>
                  <div style={visionRow}>
                    <span style={visionLabel}>Detected</span>
                    <span style={{ ...visionPill, ...severityStyle(vision.result.severity) }}>
                      {prettyCategory(vision.result.category)}
                      {vision.result.confidence < 0.5 && " · low confidence"}
                    </span>
                  </div>
                  {vision.result.description && (
                    <div style={visionRow}>
                      <span style={visionLabel}>What I see</span>
                      <span style={visionValue}>{vision.result.description}</span>
                    </div>
                  )}
                  {vision.result.immediateAction && (
                    <div style={visionRow}>
                      <span style={visionLabel}>Do now</span>
                      <span style={{ ...visionValue, fontWeight: 700, color: tokens.color.danger }}>
                        {vision.result.immediateAction}
                      </span>
                    </div>
                  )}
                  {vision.result.callNumber && (
                    <a
                      href={`tel:${vision.result.callNumber}`}
                      style={visionCallBtn}
                    >
                      📞 Call {vision.result.callNumber}
                    </a>
                  )}
                </div>

                <div style={visionActions}>
                  <button style={S.secondaryBtn} onClick={() => setVision(null)}>Cancel</button>
                  <button style={{ ...S.primaryBtn, background: tokens.color.danger }} onClick={acceptVision}>
                    {triageTreeFor(vision.result.category)
                      ? "Open offline guide →"
                      : "Continue with AI →"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div style={container}>
        {/* Greeting hero */}
        <section style={hero}>
          <div>
            <p style={heroEyebrow}>Welcome back</p>
            <h1 style={heroTitle}>Hi, {user?.name || "there"}.</h1>
            <p style={heroSub}>
              In an emergency, hold the SOS button. Help arrives faster when your trusted contacts know where you are.
            </p>
          </div>
          <div style={heroBadge}>
            <span style={{ ...statusDot, background: tokens.color.success }} />
            <span style={heroBadgeText}>System ready · Offline first-aid available</span>
          </div>
        </section>

        {/* Main grid: SOS + side panels */}
        <section className="grid-main" style={gridMain}>
          {/* SOS card occupies the wide column */}
          <div>
            <SOSButton />
          </div>

          {/* Side column: numbers + nearby quick */}
          <div className="side-col" style={sideCol}>
            <div style={{ ...S.card, padding: "8px" }}>
              <div style={{ ...sectionHead, padding: "12px 12px 6px" }}>
                <span>Emergency numbers</span>
              </div>
              {quickNumbers.map((q, i) => (
                <a
                  key={q.num}
                  className="home-quick"
                  href={`tel:${q.num}`}
                  style={{
                    ...quickRow,
                    borderTop: i === 0 ? "none" : `1px solid ${tokens.color.divider}`,
                  }}
                >
                  <span style={quickNum}>{q.num}</span>
                  <span style={quickLabel}>{q.label}</span>
                  <span style={quickArrow}>›</span>
                </a>
              ))}
            </div>

            <div style={{ ...S.card, padding: "8px" }}>
              <div style={{ ...sectionHead, padding: "12px 12px 6px" }}>
                <span>Nearby</span>
                <button
                  onClick={() => navigate("/nearby")}
                  style={viewAllBtn}
                >
                  View all →
                </button>
              </div>
              {nearbyQuick.map((n, i) => (
                <button
                  key={n.key}
                  className="nearby-row"
                  onClick={() => navigate("/nearby")}
                  style={{
                    ...nearbyRow,
                    borderTop: i === 0 ? "none" : `1px solid ${tokens.color.divider}`,
                  }}
                >
                  <span style={{ ...nearbyIcon, background: `${n.color}14`, color: n.color }}>
                    {n.icon}
                  </span>
                  <span style={nearbyLabel}>{n.label}</span>
                  <span style={quickArrow}>›</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Offline first-aid */}
        <section>
          <div style={{ ...sectionHead, marginBottom: "12px" }}>
            <span>Offline first-aid</span>
            <span style={badgeOffline}>● Works without internet</span>
          </div>
          <div className="offline-grid" style={offlineGrid}>
            {offlineGuides.map((g) => (
              <button
                key={g.id}
                className="home-tile"
                onClick={() => navigate(`/triage/${g.id}`)}
                style={{
                  ...S.card,
                  padding: "20px",
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  alignItems: "flex-start",
                  fontFamily: tokens.font.family,
                }}
              >
                <div style={{ ...iconChip, color: g.color, background: `${g.color}14` }}>
                  {g.icon}
                </div>
                <div style={{ width: "100%" }}>
                  <div style={tileTitle}>{g.title[primaryLang] || g.title.English}</div>
                  <div style={tileMeta}>
                    <span style={tileMetaText}>
                      {g.steps[primaryLang]?.length || g.steps.English.length} steps
                    </span>
                    <span style={{ color: tokens.color.borderStrong }}>·</span>
                    <span style={{ ...tileMetaText, color: g.color, fontWeight: 600 }}>
                      {g.severity === "critical" ? "Critical" : "Serious"}
                    </span>
                  </div>
                </div>
                <div style={tileFooter}>Open guide →</div>
              </button>
            ))}
          </div>
        </section>

        {/* Ask AI */}
        <section>
          <div style={{ ...sectionHead, marginBottom: "12px" }}>
            <span>Ask AI</span>
            <span style={badgeOnline}>● Needs internet · multilingual + vision</span>
          </div>
          <div style={{ ...S.card, padding: "20px" }}>
            <div style={askRow}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={handlePhotoPick}
              />
              <input
                className="home-input"
                style={{ ...S.input, fontSize: "15px", flex: 1 }}
                type="text"
                placeholder={t.describeEmergency}
                value={inputText}
                onChange={(e) => { setInputText(e.target.value); setError(""); }}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <button
                style={{
                  ...S.iconBtn,
                  background: tokens.color.surfaceSubtle,
                  borderColor: tokens.color.border,
                  color: tokens.color.textMuted,
                  width: "44px", height: "44px",
                  flexShrink: 0,
                }}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Identify with photo"
                title="Identify with photo"
              >
                📷
              </button>
              <button
                style={{
                  ...S.iconBtn,
                  background: isListening ? tokens.color.dangerBg : tokens.color.surfaceSubtle,
                  borderColor: isListening ? tokens.color.dangerBorder : tokens.color.border,
                  color: isListening ? tokens.color.danger : tokens.color.textMuted,
                  width: "44px", height: "44px",
                  flexShrink: 0,
                }}
                onClick={handleVoice}
                aria-label="Voice input"
                title="Voice input"
              >
                {isListening ? "●" : "🎤"}
              </button>
              <button
                style={{
                  ...S.primaryBtn,
                  padding: "12px 22px",
                  fontSize: "14px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
                onClick={() => handleSearch()}
              >
                Ask AI →
              </button>
            </div>
            {error && <p style={errorText}>{error}</p>}

            <div style={categoryRow}>
              <span style={categoryRowLabel}>Or pick:</span>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategory(cat)}
                  style={{
                    ...categoryPill,
                    color: cat.color,
                    borderColor: `${cat.color}44`,
                  }}
                >
                  <span aria-hidden>{cat.icon}</span> {cat.title}
                </button>
              ))}
            </div>
          </div>
        </section>

        <p style={footerNote}>
          ResQ AI · Hold-to-SOS, offline first-aid, AI triage in 12+ languages.
        </p>
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────

const page = {
  width: "100%",
};

const container = {
  maxWidth: "1600px",
  margin: "0 auto",
  padding: "40px 32px 56px",
  display: "flex",
  flexDirection: "column",
  gap: "32px",
};

const hero = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: "24px",
  flexWrap: "wrap",
};

const heroEyebrow = {
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: tokens.color.textSubtle,
  margin: 0,
};

const heroTitle = {
  fontSize: "36px",
  fontWeight: 800,
  letterSpacing: "-0.025em",
  margin: "4px 0 8px",
  color: tokens.color.text,
};

const heroSub = {
  fontSize: "15px",
  color: tokens.color.textMuted,
  lineHeight: 1.55,
  maxWidth: "560px",
  margin: 0,
};

const heroBadge = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.pill,
  padding: "8px 14px",
};

const heroBadgeText = {
  fontSize: "12px",
  color: tokens.color.textMuted,
  fontWeight: 500,
};

const statusDot = {
  width: "8px",
  height: "8px",
  borderRadius: tokens.radius.pill,
};

const gridMain = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 2fr) minmax(320px, 1fr)",
  gap: "24px",
  alignItems: "start",
};

const sideCol = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const sectionHead = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: tokens.color.textSubtle,
  whiteSpace: "nowrap",
};

const badgeOffline = {
  marginLeft: "auto",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.04em",
  color: tokens.color.success,
  textTransform: "none",
};

const badgeOnline = {
  marginLeft: "auto",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.04em",
  color: tokens.color.textSubtle,
  textTransform: "none",
};

const viewAllBtn = {
  marginLeft: "auto",
  background: "transparent",
  border: "none",
  color: tokens.color.textMuted,
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "none",
  cursor: "pointer",
  fontFamily: tokens.font.family,
  padding: 0,
};

const quickRow = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  padding: "12px 14px",
  textDecoration: "none",
  color: tokens.color.text,
  cursor: "pointer",
  borderRadius: tokens.radius.md,
  minWidth: 0,
};

const quickNum = {
  fontSize: "20px",
  fontWeight: 800,
  fontVariantNumeric: "tabular-nums",
  color: tokens.color.text,
  minWidth: "44px",
  flexShrink: 0,
};

const quickLabel = {
  flex: 1,
  fontSize: "13px",
  fontWeight: 500,
  color: tokens.color.textMuted,
  minWidth: 0,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const quickArrow = {
  fontSize: "20px",
  color: tokens.color.textSubtle,
  fontWeight: 400,
};

const nearbyRow = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 14px",
  background: "transparent",
  border: "none",
  width: "100%",
  cursor: "pointer",
  fontFamily: tokens.font.family,
  borderRadius: tokens.radius.md,
};

const nearbyIcon = {
  width: "32px",
  height: "32px",
  borderRadius: tokens.radius.md,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "16px",
  flexShrink: 0,
};

const nearbyLabel = {
  flex: 1,
  fontSize: "14px",
  fontWeight: 600,
  color: tokens.color.text,
  textAlign: "left",
};

const offlineGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: "14px",
};

const iconChip = {
  width: "44px",
  height: "44px",
  borderRadius: tokens.radius.md,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
};

const tileTitle = {
  fontSize: "15px",
  fontWeight: 700,
  color: tokens.color.text,
  lineHeight: 1.3,
  marginBottom: "4px",
};

const tileMeta = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const tileMetaText = {
  fontSize: "12px",
  color: tokens.color.textSubtle,
  fontWeight: 500,
};

const tileFooter = {
  fontSize: "12px",
  color: tokens.color.textMuted,
  fontWeight: 600,
  letterSpacing: "0.01em",
};

const askRow = {
  display: "flex",
  gap: "10px",
  alignItems: "center",
};

const errorText = {
  fontSize: "12px",
  color: tokens.color.danger,
  marginTop: "10px",
  marginBottom: 0,
};

const categoryRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "16px",
  alignItems: "center",
};

const categoryRowLabel = {
  fontSize: "12px",
  color: tokens.color.textSubtle,
  fontWeight: 600,
  marginRight: "4px",
};

const categoryPill = {
  background: tokens.color.surface,
  border: "1px solid",
  borderRadius: tokens.radius.pill,
  padding: "7px 13px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: tokens.font.family,
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  transition: "transform 0.1s",
};

const footerNote = {
  fontSize: "12px",
  color: tokens.color.textSubtle,
  textAlign: "center",
  margin: "8px 0 0",
};

// Vision modal helpers + styles ────────────────────────────────────────────

const CATEGORY_LABEL = {
  "heart-attack": "Heart attack / chest pain",
  "choking": "Choking",
  "severe-bleeding": "Severe bleeding",
  "burns": "Burn injury",
  "unconscious": "Unconscious / not breathing",
  "fire": "Fire emergency",
  "accident": "Accident",
  "crime": "Crime / assault",
  "disaster": "Natural disaster",
  "medical-other": "Medical emergency",
  "non-emergency": "Not an emergency",
  "unclear": "Unclear — needs more info",
};
const prettyCategory = (c) => CATEGORY_LABEL[c] || c;

const severityStyle = (sev) => {
  if (sev === "critical") return {
    background: tokens.color.dangerBg, color: tokens.color.danger, borderColor: tokens.color.dangerBorder,
  };
  if (sev === "serious") return {
    background: tokens.color.warningBg, color: tokens.color.warning, borderColor: tokens.color.warningBorder,
  };
  return {
    background: tokens.color.surfaceSubtle, color: tokens.color.textMuted, borderColor: tokens.color.border,
  };
};

const visionOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.55)",
  backdropFilter: "blur(4px)",
  zIndex: 100,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const visionCard = {
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.xl,
  padding: 24,
  width: "100%",
  maxWidth: 480,
  boxShadow: tokens.shadow.lg,
  fontFamily: tokens.font.family,
  maxHeight: "90vh",
  overflowY: "auto",
};

const visionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
};

const visionEyebrow = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: tokens.color.textSubtle,
};

const visionCloseBtn = {
  width: 28,
  height: 28,
  borderRadius: tokens.radius.pill,
  border: `1px solid ${tokens.color.border}`,
  background: tokens.color.surfaceSubtle,
  color: tokens.color.textMuted,
  fontSize: 18,
  cursor: "pointer",
  fontFamily: tokens.font.family,
};

const visionPreviewWrap = {
  position: "relative",
  width: "100%",
  borderRadius: tokens.radius.md,
  overflow: "hidden",
  background: tokens.color.surfaceSubtle,
  marginBottom: 14,
};

const visionPreviewImg = {
  width: "100%",
  maxHeight: 260,
  objectFit: "cover",
  display: "block",
};

const visionPreviewOverlay = {
  position: "absolute",
  inset: 0,
  background: "rgba(15,23,42,0.55)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
};

const visionSpinner = {
  width: 36,
  height: 36,
  border: "3px solid rgba(255,255,255,0.25)",
  borderTopColor: "#fff",
  borderRadius: "50%",
  animation: "vis-spin 0.9s linear infinite",
};

const visionAnalyzeText = {
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  margin: 0,
};

const visionStatusText = {
  fontSize: 14,
  color: tokens.color.textMuted,
  textAlign: "center",
  lineHeight: 1.5,
  margin: "0 0 16px",
};

const visionResultBox = {
  background: tokens.color.surfaceSubtle,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.lg,
  padding: 16,
  marginBottom: 16,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const visionRow = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const visionLabel = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: tokens.color.textSubtle,
};

const visionPill = {
  display: "inline-block",
  padding: "5px 12px",
  borderRadius: tokens.radius.pill,
  border: "1px solid",
  fontSize: 13,
  fontWeight: 700,
  alignSelf: "flex-start",
};

const visionValue = {
  fontSize: 14,
  color: tokens.color.text,
  lineHeight: 1.5,
};

const visionCallBtn = {
  display: "block",
  background: tokens.color.danger,
  color: "#fff",
  textAlign: "center",
  textDecoration: "none",
  padding: "12px",
  borderRadius: tokens.radius.md,
  fontSize: 14,
  fontWeight: 700,
  fontVariantNumeric: "tabular-nums",
  marginTop: 4,
};

const visionActions = {
  display: "flex",
  gap: 10,
};

export default Home;
