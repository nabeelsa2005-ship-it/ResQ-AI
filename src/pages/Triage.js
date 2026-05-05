import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { getTriageTree, getTriageContent } from "../data/triageTrees";
import SOSButton from "../components/SOSButton";
import RelatedVideos from "../components/RelatedVideos";
import { tokens, styles as S } from "../theme";

// Per-tree YouTube search queries — tuned to surface medical-quality
// demonstration videos rather than vlog content. Including authoritative
// channel hints (Red Cross, St John, AHA) biases YouTube toward verified
// instructional sources.
const VIDEO_QUERIES = {
  "heart-attack":   "heart attack first aid steps demonstration adult",
  "choking":        "Heimlich maneuver adult choking back blows demonstration",
  "severe-bleeding":"severe bleeding control direct pressure tourniquet first aid",
  "burns":          "burn first aid cool running water dressing demonstration",
  "unconscious":    "unconscious not breathing CPR recovery position demonstration",
};

const STEP_META = {
  call:  { label: "Call",    color: tokens.color.danger },
  do:    { label: "Do",      color: tokens.color.success },
  warn:  { label: "Warning", color: tokens.color.warning },
  check: { label: "Check",   color: tokens.color.info },
};

const TXT = {
  English: {
    redFlags: "Critical signs",
    callNow: "Call now",
    nextStep: "Next step →",
    prevStep: "← Back",
    done: "Mark complete",
    cprStart: "Start CPR beat (100/min)",
    cprStop: "Stop CPR beat",
    cprHint: "Push to the beat. \"Stayin' Alive\" tempo — 100 per minute.",
    offlineNotice: "Works offline",
    askAi: "Ask AI for more help",
    stepOf: "Step",
    of: "of",
    completed: "All steps reviewed. Stay with the person until help arrives.",
    stepsLabel: "Steps",
    severityLabel: "Severity",
  },
  Hindi: {
    redFlags: "गंभीर संकेत",
    callNow: "अभी कॉल करें",
    nextStep: "अगला कदम →",
    prevStep: "← पीछे",
    done: "पूरा करें",
    cprStart: "CPR लय शुरू करें (100/मिनट)",
    cprStop: "CPR लय बंद करें",
    cprHint: "लय के साथ दबाएं — प्रति मिनट 100 बार।",
    offlineNotice: "ऑफलाइन काम करता है",
    askAi: "AI से और मदद माँगें",
    stepOf: "कदम",
    of: "/",
    completed: "सभी कदम देख लिए। मदद आने तक उनके साथ रहें।",
    stepsLabel: "कदम",
    severityLabel: "गंभीरता",
  },
};

const tx = (lang) => TXT[lang] || TXT.English;

export default function Triage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { primaryLang } = useAppContext();
  const tree = useMemo(() => getTriageTree(id), [id]);
  const content = useMemo(() => getTriageContent(tree, primaryLang), [tree, primaryLang]);
  const t = tx(primaryLang);

  const [stepIdx, setStepIdx] = useState(0);
  const [cprOn, setCprOn] = useState(false);
  const audioCtxRef = useRef(null);
  const beatTimerRef = useRef(null);

  useEffect(() => () => {
    if (beatTimerRef.current) clearInterval(beatTimerRef.current);
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
    }
  }, []);

  if (!tree || !content) {
    return (
      <div style={notFoundPage}>
        <h2 style={{ fontSize: "20px", margin: "0 0 8px" }}>Guide not found</h2>
        <p style={{ color: tokens.color.textMuted, marginBottom: "16px" }}>That guide is unavailable.</p>
        <button style={S.primaryBtn} onClick={() => navigate("/")}>Go home</button>
      </div>
    );
  }

  const { steps, redFlags, title, callLabel } = content;
  const total = steps.length;
  const isCompleted = stepIdx >= total;
  const step = !isCompleted ? steps[stepIdx] : null;
  const meta = step ? STEP_META[step.type] || STEP_META.do : null;
  const progressPct = ((isCompleted ? total : stepIdx + 1) / total) * 100;

  const next = () => setStepIdx((i) => Math.min(total, i + 1));
  const prev = () => setStepIdx((i) => Math.max(0, i - 1));

  const playBeat = () => {
    try {
      if (!audioCtxRef.current) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {}
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const toggleCpr = () => {
    if (cprOn) {
      if (beatTimerRef.current) { clearInterval(beatTimerRef.current); beatTimerRef.current = null; }
      setCprOn(false);
    } else {
      playBeat();
      beatTimerRef.current = setInterval(playBeat, 600);
      setCprOn(true);
    }
  };

  const stepShortText = (s, lang) => {
    const text = s.text || "";
    const sentence = text.split(/[.।]/)[0];
    return sentence.length > 56 ? sentence.slice(0, 56) + "…" : sentence;
  };

  return (
    <div style={page}>
      <style>{`
        @keyframes cprPulse {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.5); opacity: 0.3; }
        }
        .step-list-row { transition: background 0.15s; }
        .step-list-row:hover { background: ${tokens.color.surfaceSubtle}; }
        @media (max-width: 1024px) {
          .triage-grid { grid-template-columns: 1fr !important; }
          .triage-sidebar { position: static !important; }
        }
      `}</style>

      <div style={container}>
        {/* Page header */}
        <header style={pageHeader}>
          <button onClick={() => navigate(-1)} style={backLink}>← All guides</button>
          <div style={titleRow}>
            <div>
              <div style={severityRow}>
                <span style={{
                  ...severityPill,
                  color: tree.color,
                  background: `${tree.color}14`,
                  borderColor: `${tree.color}33`,
                }}>
                  {tree.severity === "critical" ? "Critical" : "Serious"}
                </span>
                <span style={offlinePill}>● {t.offlineNotice}</span>
              </div>
              <h1 style={pageTitle}>
                <span style={{ marginRight: "12px" }}>{tree.icon}</span>
                {title}
              </h1>
            </div>
            <a
              href={`tel:${tree.callNumber}`}
              style={{
                ...S.primaryBtn,
                background: tokens.color.danger,
                padding: "12px 22px",
                fontSize: "15px",
                fontVariantNumeric: "tabular-nums",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: tokens.shadow.danger,
              }}
            >
              📞 Call {tree.callNumber} — {callLabel}
            </a>
          </div>
        </header>

        {/* Progress */}
        <div style={progressTrack}>
          <div style={{ ...progressFill, width: `${progressPct}%`, background: tree.color }} />
        </div>

        {/* Two-column body */}
        <div className="triage-grid" style={gridBody}>
          {/* Sidebar: step navigator */}
          <aside className="triage-sidebar" style={sidebar}>
            <div style={{ ...S.card, padding: "16px" }}>
              <p style={sidebarLabel}>{t.stepsLabel}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {steps.map((s, i) => {
                  const m = STEP_META[s.type] || STEP_META.do;
                  const status = i < stepIdx ? "done" : i === stepIdx ? "current" : "upcoming";
                  return (
                    <button
                      key={i}
                      className="step-list-row"
                      onClick={() => setStepIdx(i)}
                      style={{
                        ...stepListRow,
                        background: status === "current" ? tokens.color.surfaceSubtle : "transparent",
                        borderLeft: `3px solid ${status === "current" ? m.color : "transparent"}`,
                      }}
                    >
                      <span style={{
                        ...stepListNum,
                        background: status === "done" ? tokens.color.success
                          : status === "current" ? m.color
                          : tokens.color.surfaceSubtle,
                        color: status === "upcoming" ? tokens.color.textSubtle : "#fff",
                        border: status === "upcoming" ? `1px solid ${tokens.color.border}` : "none",
                      }}>
                        {status === "done" ? "✓" : i + 1}
                      </span>
                      <span style={{
                        ...stepListText,
                        color: status === "current" ? tokens.color.text : tokens.color.textMuted,
                        fontWeight: status === "current" ? 600 : 500,
                      }}>
                        {stepShortText(s, primaryLang)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CPR */}
            {tree.cprAssist && (
              <div style={{ ...S.card, padding: "16px" }}>
                <p style={sidebarLabel}>CPR metronome</p>
                <button
                  style={{
                    ...cprBtn,
                    background: cprOn ? tokens.color.danger : tokens.color.text,
                  }}
                  onClick={toggleCpr}
                >
                  <span style={{
                    ...cprPulseDot,
                    animation: cprOn ? "cprPulse 0.6s ease-in-out infinite" : "none",
                  }} />
                  {cprOn ? t.cprStop : t.cprStart}
                </button>
                {cprOn && <p style={cprHintText}>{t.cprHint}</p>}
              </div>
            )}
          </aside>

          {/* Main column */}
          <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Red flags banner */}
            {stepIdx === 0 && (
              <div style={redFlagsBox}>
                <div style={redFlagsTitle}>{t.redFlags}</div>
                <ul style={redFlagsList}>
                  {redFlags.map((rf, i) => (
                    <li key={i} style={redFlagsItem}>{rf}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Step card */}
            {!isCompleted && step && (
              <div style={{
                ...S.card,
                padding: "28px",
                borderLeft: `4px solid ${meta.color}`,
              }}>
                <div style={stepLabelRow}>
                  <span style={{ ...stepBadge, color: meta.color, background: `${meta.color}14` }}>
                    {meta.label}
                  </span>
                  <span style={stepCounter}>
                    {t.stepOf} {stepIdx + 1} {t.of} {total}
                  </span>
                </div>
                <p style={stepBody}>{step.text}</p>

                {step.type === "call" && (
                  <a
                    href={`tel:${tree.callNumber}`}
                    style={{
                      ...S.primaryBtn,
                      background: tokens.color.danger,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      textDecoration: "none",
                      marginTop: "20px",
                      padding: "14px 24px",
                      fontSize: "15px",
                    }}
                  >
                    📞 {t.callNow} — {tree.callNumber}
                  </a>
                )}
              </div>
            )}

            {isCompleted && (
              <div style={{ ...S.card, padding: "48px 24px", textAlign: "center" }}>
                <div style={completedDot}>✓</div>
                <p style={{ fontSize: "16px", fontWeight: 600, color: tokens.color.text, margin: "16px 0 0" }}>
                  {t.completed}
                </p>
              </div>
            )}

            {/* Nav */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                style={{ ...S.secondaryBtn, flex: 1, padding: "14px", opacity: stepIdx === 0 ? 0.4 : 1 }}
                onClick={prev}
                disabled={stepIdx === 0}
              >
                {t.prevStep}
              </button>
              <button
                style={{
                  ...S.primaryBtn,
                  flex: 2,
                  padding: "14px",
                  background: isCompleted ? tokens.color.success : tree.color,
                }}
                onClick={next}
                disabled={isCompleted}
              >
                {stepIdx === total - 1 ? t.done : t.nextStep}
              </button>
            </div>

            <button
              style={{
                ...S.secondaryBtn,
                width: "100%",
                padding: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontWeight: 600,
              }}
              onClick={() => navigate("/guidance", { state: { query: title, fromTriage: id } })}
            >
              <span>🤖</span> {t.askAi}
            </button>

            {/* YouTube demonstrations for this guide. */}
            <RelatedVideos
              query={VIDEO_QUERIES[id] || title}
              label="Watch demonstrations"
              max={4}
              accentColor={tree.color}
            />

            <SOSButton emergencyType={title} />
          </section>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const page = { width: "100%" };

const container = {
  maxWidth: "1400px",
  margin: "0 auto",
  padding: "40px 32px 56px",
};

const pageHeader = { marginBottom: "16px" };

const backLink = {
  background: "transparent",
  border: "none",
  color: tokens.color.textMuted,
  fontSize: "13px",
  fontWeight: 500,
  padding: 0,
  cursor: "pointer",
  fontFamily: tokens.font.family,
  marginBottom: "16px",
};

const titleRow = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: "20px",
  flexWrap: "wrap",
};

const severityRow = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
  marginBottom: "8px",
};

const severityPill = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  padding: "4px 10px",
  borderRadius: tokens.radius.pill,
  border: "1px solid",
};

const offlinePill = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  color: tokens.color.success,
  background: tokens.color.successBg,
  border: `1px solid ${tokens.color.successBorder}`,
  padding: "4px 10px",
  borderRadius: tokens.radius.pill,
};

const pageTitle = {
  fontSize: "32px",
  fontWeight: 800,
  letterSpacing: "-0.025em",
  margin: 0,
  color: tokens.color.text,
};

const progressTrack = {
  height: "4px",
  background: tokens.color.divider,
  borderRadius: tokens.radius.pill,
  overflow: "hidden",
  marginBottom: "24px",
};

const progressFill = { height: "100%", transition: "width 0.3s ease" };

const gridBody = {
  display: "grid",
  gridTemplateColumns: "minmax(260px, 320px) minmax(0, 1fr)",
  gap: "20px",
  alignItems: "start",
};

const sidebar = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  position: "sticky",
  top: "85px",
};

const sidebarLabel = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: tokens.color.textSubtle,
  margin: "0 0 10px",
};

const stepListRow = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px 8px 10px 11px",
  background: "transparent",
  borderLeft: "3px solid transparent",
  border: "none",
  borderRadius: `0 ${tokens.radius.sm} ${tokens.radius.sm} 0`,
  width: "100%",
  cursor: "pointer",
  fontFamily: tokens.font.family,
  textAlign: "left",
};

const stepListNum = {
  width: "22px",
  height: "22px",
  borderRadius: tokens.radius.pill,
  fontSize: "11px",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const stepListText = {
  fontSize: "13px",
  lineHeight: 1.4,
  flex: 1,
  minWidth: 0,
};

const cprBtn = {
  width: "100%",
  color: "#fff",
  border: "none",
  borderRadius: tokens.radius.md,
  padding: "13px",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: tokens.font.family,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  transition: "background 0.15s",
};

const cprPulseDot = {
  width: "8px",
  height: "8px",
  borderRadius: tokens.radius.pill,
  background: "#fff",
};

const cprHintText = {
  fontSize: "12px",
  color: tokens.color.textMuted,
  textAlign: "center",
  margin: "10px 0 0",
  fontStyle: "italic",
};

const redFlagsBox = {
  background: tokens.color.dangerBg,
  border: `1px solid ${tokens.color.dangerBorder}`,
  borderRadius: tokens.radius.lg,
  padding: "16px 20px",
};

const redFlagsTitle = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: tokens.color.danger,
  marginBottom: "10px",
};

const redFlagsList = { margin: 0, paddingLeft: "18px" };

const redFlagsItem = {
  fontSize: "14px",
  color: tokens.color.text,
  marginBottom: "6px",
  lineHeight: 1.5,
};

const stepLabelRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "12px",
};

const stepBadge = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  padding: "5px 11px",
  borderRadius: tokens.radius.pill,
};

const stepCounter = {
  fontSize: "12px",
  fontWeight: 600,
  color: tokens.color.textSubtle,
};

const stepBody = {
  fontSize: "18px",
  fontWeight: 500,
  lineHeight: 1.55,
  color: tokens.color.text,
  margin: 0,
};

const completedDot = {
  width: "64px",
  height: "64px",
  borderRadius: tokens.radius.pill,
  background: tokens.color.successBg,
  border: `1px solid ${tokens.color.successBorder}`,
  color: tokens.color.success,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "32px",
};

const notFoundPage = {
  minHeight: "60vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px",
  fontFamily: tokens.font.family,
};
