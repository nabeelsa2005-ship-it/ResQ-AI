import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";

// English + All major Indian languages
const LANGS = [
  { code: "English",   flag: "🇬🇧", native: "English",    region: "Default" },
  { code: "Hindi",     flag: "🇮🇳", native: "हिन्दी",     region: "उत्तर भारत" },
  { code: "Kannada",   flag: "🇮🇳", native: "ಕನ್ನಡ",      region: "Karnataka" },
  { code: "Marathi",   flag: "🇮🇳", native: "मराठी",      region: "Maharashtra" },
  { code: "Bengali",   flag: "🇮🇳", native: "বাংলা",      region: "W. Bengal" },
  { code: "Tamil",     flag: "🇮🇳", native: "தமிழ்",      region: "Tamil Nadu" },
  { code: "Telugu",    flag: "🇮🇳", native: "తెలుగు",     region: "Andhra/TG" },
  { code: "Gujarati",  flag: "🇮🇳", native: "ગુજરાતી",    region: "Gujarat" },
  { code: "Punjabi",   flag: "🇮🇳", native: "ਪੰਜਾਬੀ",    region: "Punjab" },
  { code: "Malayalam", flag: "🇮🇳", native: "മലയാളം",     region: "Kerala" },
  { code: "Urdu",      flag: "🇮🇳", native: "اردو",        region: "All India" },
  { code: "Odia",      flag: "🇮🇳", native: "ଓଡ଼ିଆ",       region: "Odisha" },
];

const AI_PREVIEW = {
  English:   "Hello! I'm ResQ AI 🚨 I'll guide you in English in any emergency!",
  Hindi:     "नमस्ते! मैं ResQ AI हूँ 🚨 हिन्दी में मार्गदर्शन करूँगा!",
  Kannada:   "ನಮಸ್ಕಾರ! ನಾನು ResQ AI 🚨 ಕನ್ನಡದಲ್ಲಿ ಮಾರ್ಗದರ್ಶನ ಮಾಡುತ್ತೇನೆ!",
  Marathi:   "नमस्कार! मी ResQ AI 🚨 मराठीत मार्गदर्शन करेन!",
  Bengali:   "হ্যালো! আমি ResQ AI 🚨 বাংলায় সাহায্য করব!",
  Tamil:     "வணக்கம்! நான் ResQ AI 🚨 தமிழில் வழிகாட்டுவேன்!",
  Telugu:    "నమస్కారం! నేను ResQ AI 🚨 తెలుగులో సహాయం చేస్తాను!",
  Gujarati:  "નમસ્તે! હું ResQ AI 🚨 ગુજરાતીમાં માર્ગદર્શન આપીશ!",
  Punjabi:   "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ResQ AI 🚨 ਪੰਜਾਬੀ ਵਿੱਚ ਮਦਦ ਕਰਾਂਗਾ!",
  Malayalam: "നമസ്കാരം! ഞാൻ ResQ AI 🚨 മലയാളത്തിൽ സഹായിക്കും!",
  Urdu:      "السلام علیکم! میں ResQ AI 🚨 اردو میں رہنمائی کروں گا!",
  Odia:      "ନମସ୍କାର! ମୁଁ ResQ AI 🚨 ଓଡ଼ିଆରେ ସାହାଯ୍ୟ କରିବି!",
};

export default function LangPickerModal({ onClose }) {
  const { selectedLanguages, saveLanguages } = useAppContext();
  const [selected, setSelected] = useState([...selectedLanguages]);

  const toggle = (code) => {
    if (selected.includes(code)) {
      if (selected.length === 1) return;
      setSelected(selected.filter((l) => l !== code));
    } else {
      if (selected.length >= 5) return;
      setSelected([...selected, code]);
    }
  };

  const handleSave = () => {
    saveLanguages(selected);
    onClose();
  };

  const primary = selected[0] || "English";
  const preview = AI_PREVIEW[primary] || AI_PREVIEW["English"];

  return (
    <div style={overlay}>
      <div style={modal}>
        <button style={closeBtn} onClick={onClose}>×</button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "14px" }}>
          <span style={{ fontSize: "36px", display: "block", marginBottom: "6px" }}>🇮🇳</span>
          <h2 style={{ fontSize: "19px", fontWeight: "800", color: "#0f172a", marginBottom: "3px" }}>
            भाषा बदलें / Change Language
          </h2>
          <p style={{ fontSize: "11px", color: "#64748b" }}>
            Select up to 5 languages
          </p>
        </div>

        {/* AI preview bubble */}
        <div style={previewBubble}>
          <span style={{ fontSize: "20px" }}>🤖</span>
          <p style={{ fontSize: "12px", color: "#3730a3", fontWeight: "600", lineHeight: "1.5" }}>
            {preview}
          </p>
        </div>

        {/* Selected tags */}
        <div style={tagsRow}>
          {selected.map((code) => {
            const l = LANGS.find((x) => x.code === code);
            return (
              <span key={code} style={tag}>
                {l?.flag} {l?.native}
                {selected.length > 1 && (
                  <button style={tagRemove} onClick={() => toggle(code)}>×</button>
                )}
              </span>
            );
          })}
        </div>
        <p style={countStyle}>{selected.length}/5 selected</p>

        {/* Language grid */}
        <div style={grid}>
          {LANGS.map((lang) => {
            const isSel = selected.includes(lang.code);
            const isDis = !isSel && selected.length >= 5;
            return (
              <button
                key={lang.code}
                style={langCard(isSel, isDis)}
                onClick={() => !isDis && toggle(lang.code)}
              >
                <span style={{ fontSize: "22px" }}>{lang.flag}</span>
                <span style={{ fontSize: "12px", fontWeight: "800", color: isSel ? "#4338ca" : "#0f172a", textAlign: "center" }}>
                  {lang.native}
                </span>
                <span style={{ fontSize: "9px", color: "#94a3b8", fontWeight: "600" }}>
                  {lang.region}
                </span>
                {isSel && <span style={check}>✓</span>}
              </button>
            );
          })}
        </div>

        {/* Save button */}
        <button style={saveBtn} onClick={handleSave}>
          भाषा सेट करें / Save →
        </button>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.75)",
  backdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: "20px",
};

const modal = {
  background: "#fff",
  borderRadius: "28px",
  padding: "24px 20px 20px",
  width: "100%",
  maxWidth: "380px",
  boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
  position: "relative",
  maxHeight: "90vh",
  overflowY: "auto",
};

const closeBtn = {
  position: "absolute",
  top: "14px",
  right: "14px",
  background: "#f1f5f9",
  border: "none",
  width: "30px",
  height: "30px",
  borderRadius: "50%",
  fontSize: "18px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#64748b",
};

const previewBubble = {
  background: "linear-gradient(135deg, #f0f4ff, #e0e7ff)",
  border: "1px solid #c7d2fe",
  borderRadius: "12px",
  padding: "10px 12px",
  marginBottom: "12px",
  display: "flex",
  gap: "10px",
  alignItems: "center",
};

const tagsRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  justifyContent: "center",
  marginBottom: "4px",
};

const tag = {
  background: "linear-gradient(135deg, #667eea, #764ba2)",
  color: "#fff",
  padding: "3px 10px",
  borderRadius: "20px",
  fontSize: "11px",
  fontWeight: "600",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const tagRemove = {
  background: "rgba(255,255,255,0.25)",
  border: "none",
  color: "#fff",
  width: "14px",
  height: "14px",
  borderRadius: "50%",
  fontSize: "12px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0",
  fontFamily: "inherit",
};

const countStyle = {
  fontSize: "10px",
  color: "#94a3b8",
  fontWeight: "600",
  textAlign: "center",
  marginBottom: "10px",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "7px",
  marginBottom: "14px",
  maxHeight: "260px",
  overflowY: "auto",
};

const langCard = (sel, dis) => ({
  background: sel ? "linear-gradient(135deg, #f0f4ff, #e8eeff)" : "#f8fafc",
  border: `2px solid ${sel ? "#667eea" : "#e2e8f0"}`,
  borderRadius: "12px",
  padding: "10px 4px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "3px",
  cursor: dis ? "not-allowed" : "pointer",
  opacity: dis ? 0.4 : 1,
  position: "relative",
  fontFamily: "inherit",
  transition: "all 0.2s",
  boxShadow: sel ? "0 3px 10px rgba(102,126,234,0.2)" : "none",
});

const check = {
  position: "absolute",
  top: "4px",
  right: "5px",
  background: "linear-gradient(135deg, #667eea, #764ba2)",
  color: "#fff",
  width: "15px",
  height: "15px",
  borderRadius: "50%",
  fontSize: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "700",
};

const saveBtn = {
  width: "100%",
  background: "linear-gradient(135deg, #667eea, #764ba2)",
  color: "#fff",
  border: "none",
  padding: "14px",
  borderRadius: "14px",
  fontSize: "14px",
  fontWeight: "700",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "0 4px 14px rgba(102,126,234,0.35)",
};
