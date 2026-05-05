import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { tokens, styles as S } from "../theme";

const LANGS = [
  { code: "English",  native: "English",   region: "Default" },
  { code: "Hindi",    native: "हिन्दी",    region: "उत्तर भारत" },
  { code: "Kannada",  native: "ಕನ್ನಡ",     region: "Karnataka" },
  { code: "Marathi",  native: "मराठी",     region: "Maharashtra" },
  { code: "Bengali",  native: "বাংলা",     region: "W. Bengal" },
  { code: "Tamil",    native: "தமிழ்",     region: "Tamil Nadu" },
  { code: "Telugu",   native: "తెలుగు",    region: "Andhra/TG" },
  { code: "Gujarati", native: "ગુજરાતી",   region: "Gujarat" },
  { code: "Punjabi",  native: "ਪੰਜਾਬੀ",   region: "Punjab" },
  { code: "Malayalam",native: "മലയാളം",    region: "Kerala" },
  { code: "Urdu",     native: "اردو",      region: "All India" },
  { code: "Odia",     native: "ଓଡ଼ିଆ",     region: "Odisha" },
];

const AI_LANG_PREVIEW = {
  English:   "I'll guide you in English in any emergency.",
  Hindi:     "हिन्दी में आपातकाल में मार्गदर्शन करूँगा।",
  Kannada:   "ಕನ್ನಡದಲ್ಲಿ ತುರ್ತು ಸಂದರ್ಭದಲ್ಲಿ ಮಾರ್ಗದರ್ಶನ ಮಾಡುತ್ತೇನೆ.",
  Marathi:   "मराठीत आपत्कालीन मार्गदर्शन करेन.",
  Bengali:   "বাংলায় জরুরি পরিস্থিতিতে সাহায্য করব।",
  Tamil:     "தமிழில் அவசர நிலையில் வழிகாட்டுவேன்.",
  Telugu:    "తెలుగులో అత్యవసర పరిస్థితిలో సహాయం చేస్తాను.",
  Gujarati:  "ગુજરાતીમાં કટોકટીમાં માર્ગદર્શન આપીશ.",
  Punjabi:   "ਪੰਜਾਬੀ ਵਿੱਚ ਐਮਰਜੈਂਸੀ ਵਿੱਚ ਮਦਦ ਕਰਾਂਗਾ।",
  Malayalam: "മലയാളത്തിൽ അടിയന്തര ഘട്ടത്തിൽ സഹായിക്കും.",
  Urdu:      "اردو میں ہنگامی صورتحال میں رہنمائی کروں گا۔",
  Odia:      "ଓଡ଼ିଆରେ ଜରୁରୀ ପରିସ୍ଥିତିରେ ସାହାଯ୍ୟ କରିବି।",
};

const FEATURES = [
  { icon: "🆘", title: "One-tap SOS", desc: "Hold to share live GPS with your trusted contacts via WhatsApp or SMS." },
  { icon: "📴", title: "Works offline", desc: "Five life-saving first-aid guides bundled in. No network? No problem." },
  { icon: "🤖", title: "AI triage", desc: "Vision and chat models analyze injuries, accidents, and emergencies." },
  { icon: "🌐", title: "12+ Indian languages", desc: "Type in Hindi, Tamil, Telugu, even Hinglish. AI replies in the same script." },
];

export default function Login() {
  const [step, setStep] = useState("auth");
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedLangs, setSelectedLangs] = useState(["English"]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, saveLanguages, user } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleAuth = (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Please enter your email."); return; }
    if (!password.trim()) { setError("Please enter your password."); return; }
    if (mode === "signup" && !name.trim()) { setError("Please enter your name."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setTimeout(() => {
      const userName = mode === "signup" ? name.trim() : email.split("@")[0];
      login(userName, email.trim());
      setLoading(false);
      setStep("language");
    }, 600);
  };

  const handleGoogle = () => {
    setLoading(true);
    setTimeout(() => {
      login("Google User", "google@gmail.com");
      setLoading(false);
      setStep("language");
    }, 600);
  };

  const toggleLang = (code) => {
    if (selectedLangs.includes(code)) {
      if (selectedLangs.length === 1) return;
      setSelectedLangs(selectedLangs.filter((l) => l !== code));
    } else {
      if (selectedLangs.length >= 5) return;
      setSelectedLangs([...selectedLangs, code]);
    }
  };

  const handleLangSave = () => {
    saveLanguages(selectedLangs);
    navigate("/");
  };

  const primary = selectedLangs[0] || "English";
  const aiLine = AI_LANG_PREVIEW[primary] || AI_LANG_PREVIEW.English;

  // ─── LANGUAGE STEP ──────────────────────────────────────────────────────
  if (step === "language") {
    return (
      <div style={pageStyle}>
        <style>{commonCss}</style>
        <div style={singleCardWrap}>
          <div style={{ ...cardStyle, maxWidth: "560px" }}>
            <div style={brandRow}>
              <span style={brandDot} />
              <span style={brandText}>ResQ AI</span>
            </div>
            <h1 style={titleStyle}>Choose your languages</h1>
            <p style={subtitleStyle}>
              We respond in the same language you write in. The first one is your default.
            </p>

            <div style={previewCard}>
              <div style={previewRow}>
                <span style={previewBot}>🤖</span>
                <p style={previewText}>{aiLine}</p>
              </div>
            </div>

            <div style={chipsRow}>
              {selectedLangs.map((code, i) => {
                const l = LANGS.find((x) => x.code === code);
                return (
                  <span key={code} style={{
                    ...chip,
                    background: i === 0 ? tokens.color.text : tokens.color.surfaceSubtle,
                    color: i === 0 ? "#fff" : tokens.color.text,
                    borderColor: i === 0 ? tokens.color.text : tokens.color.border,
                  }}>
                    {l?.native}
                    {selectedLangs.length > 1 && (
                      <button
                        type="button"
                        style={{ ...chipRemove, color: i === 0 ? "rgba(255,255,255,0.7)" : tokens.color.textSubtle }}
                        onClick={() => toggleLang(code)}
                        aria-label={`Remove ${l?.native}`}
                      >×</button>
                    )}
                  </span>
                );
              })}
            </div>
            <p style={countText}>{selectedLangs.length} of 5 selected</p>

            <div style={langGrid}>
              {LANGS.map((lang) => {
                const isSel = selectedLangs.includes(lang.code);
                const isDis = !isSel && selectedLangs.length >= 5;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    style={{
                      ...langCard,
                      borderColor: isSel ? tokens.color.text : tokens.color.border,
                      background: isSel ? tokens.color.surfaceSubtle : tokens.color.surface,
                      opacity: isDis ? 0.4 : 1,
                      cursor: isDis ? "not-allowed" : "pointer",
                    }}
                    onClick={() => !isDis && toggleLang(lang.code)}
                    disabled={isDis}
                  >
                    <div style={langNative}>{lang.native}</div>
                    <div style={langRegion}>{lang.region}</div>
                    {isSel && <span style={langCheck}>✓</span>}
                  </button>
                );
              })}
            </div>

            <button
              style={{ ...S.primaryBtn, width: "100%", marginTop: "20px", padding: "14px", fontSize: "15px" }}
              onClick={handleLangSave}
            >
              Continue →
            </button>
            <p style={footerStyle}>
              AI replies in the language you write in — including transliterated Hindi/Tamil/Telugu.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── AUTH STEP — split screen ───────────────────────────────────────────
  return (
    <div style={pageStyle}>
      <style>{commonCss}</style>
      <div className="login-split" style={splitWrap}>
        {/* Left marketing pane */}
        <aside className="login-left" style={leftPane}>
          <div>
            <div style={brandRow}>
              <span style={brandDot} />
              <span style={{ ...brandText, color: "rgba(255,255,255,0.7)" }}>ResQ AI</span>
            </div>
            <h1 style={leftTitle}>
              AI emergency response<br />in your language.<br />
              <span style={leftTitleAccent}>Works offline.</span>
            </h1>
            <p style={leftSub}>
              Designed for the moments when seconds matter and networks fail.
              Built for India's 22 official languages.
            </p>

            <div style={featuresList}>
              {FEATURES.map((f) => (
                <div key={f.title} style={featureRow}>
                  <span style={featureIcon}>{f.icon}</span>
                  <div>
                    <div style={featureTitle}>{f.title}</div>
                    <div style={featureDesc}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={leftFooter}>
            <span style={{ ...statusDotInverse }} />
            <span>Hackathon prototype · v0.1</span>
          </div>
        </aside>

        {/* Right form pane */}
        <main style={rightPane}>
          <div style={cardStyle}>
            <h1 style={titleStyle}>
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p style={subtitleStyle}>
              {mode === "login"
                ? "Log in to access your trusted contacts and AI guidance."
                : "Sign up to set up SOS contacts and personalized AI in your language."}
            </p>

            <div style={tabsStyle}>
              <button
                type="button"
                style={{
                  ...tabStyle,
                  color: mode === "login" ? tokens.color.text : tokens.color.textSubtle,
                  borderBottomColor: mode === "login" ? tokens.color.text : "transparent",
                }}
                onClick={() => { setMode("login"); setError(""); }}
              >Log in</button>
              <button
                type="button"
                style={{
                  ...tabStyle,
                  color: mode === "signup" ? tokens.color.text : tokens.color.textSubtle,
                  borderBottomColor: mode === "signup" ? tokens.color.text : "transparent",
                }}
                onClick={() => { setMode("signup"); setError(""); }}
              >Sign up</button>
            </div>

            <button
              type="button"
              style={{
                ...S.secondaryBtn,
                width: "100%", padding: "12px", fontSize: "14px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              }}
              onClick={handleGoogle}
              disabled={loading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div style={dividerStyle}>
              <div style={dividerLine} /><span style={dividerText}>or</span><div style={dividerLine} />
            </div>

            <form onSubmit={handleAuth}>
              {mode === "signup" && (
                <div style={fieldStyle}>
                  <label style={labelStyle}>Full name</label>
                  <input style={S.input} type="text" placeholder="Aditya Kumar" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              )}
              <div style={fieldStyle}>
                <label style={labelStyle}>Email</label>
                <input style={S.input} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Password</label>
                <input style={S.input} type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error && <div style={errorBoxStyle}>{error}</div>}
              <button
                style={{ ...S.primaryBtn, width: "100%", padding: "13px", fontSize: "15px", marginTop: "8px" }}
                type="submit"
                disabled={loading}
              >
                {loading ? "Please wait…" : mode === "login" ? "Log in →" : "Create account →"}
              </button>
            </form>

            <p style={footerStyle}>🔒 Your data stays on this device until you opt in.</p>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const commonCss = `
  body { background: ${tokens.color.bg}; }
  * { -webkit-tap-highlight-color: transparent; }
  input:focus { border-color: ${tokens.color.primary} !important;
                box-shadow: 0 0 0 3px rgba(15,23,42,0.06) !important; outline: none; }
  @media (max-width: 980px) {
    .login-split { grid-template-columns: 1fr !important; }
    .login-left { display: none !important; }
  }
`;

const pageStyle = {
  minHeight: "100vh",
  background: tokens.color.bg,
  fontFamily: tokens.font.family,
  color: tokens.color.text,
};

const splitWrap = {
  minHeight: "100vh",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 1fr)",
};

const leftPane = {
  background: `radial-gradient(1200px 800px at 10% 10%, #1e293b 0%, ${tokens.color.text} 60%, #020617 100%)`,
  color: "#fff",
  padding: "56px 56px 40px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  position: "relative",
  overflow: "hidden",
};
// add pseudo via inline className not available — keeping styling simple

const leftTitle = {
  fontSize: "44px",
  fontWeight: 800,
  lineHeight: 1.15,
  letterSpacing: "-0.025em",
  margin: "32px 0 16px",
  color: "#fff",
};

const leftTitleAccent = {
  background: "linear-gradient(135deg, #fca5a5, #ef4444)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const leftSub = {
  fontSize: "16px",
  color: "rgba(255,255,255,0.7)",
  lineHeight: 1.6,
  margin: "0 0 40px",
  maxWidth: "440px",
};

const featuresList = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  maxWidth: "440px",
};

const featureRow = {
  display: "flex",
  gap: "14px",
  alignItems: "flex-start",
};

const featureIcon = {
  fontSize: "22px",
  width: "40px",
  height: "40px",
  borderRadius: tokens.radius.md,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const featureTitle = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#fff",
  marginBottom: "2px",
};

const featureDesc = {
  fontSize: "13px",
  color: "rgba(255,255,255,0.6)",
  lineHeight: 1.5,
};

const leftFooter = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "12px",
  color: "rgba(255,255,255,0.4)",
  fontWeight: 500,
};

const statusDotInverse = {
  width: "6px",
  height: "6px",
  borderRadius: tokens.radius.pill,
  background: "#22c55e",
  boxShadow: "0 0 0 3px rgba(34,197,94,0.18)",
};

const rightPane = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px 24px",
  background: tokens.color.bg,
};

const singleCardWrap = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px 24px",
};

const cardStyle = {
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.xl,
  padding: "36px 32px",
  width: "100%",
  maxWidth: "440px",
  boxShadow: tokens.shadow.lg,
  boxSizing: "border-box",
};

const brandRow = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "24px",
};

const brandDot = {
  width: "10px",
  height: "10px",
  borderRadius: tokens.radius.pill,
  background: tokens.color.danger,
  boxShadow: "0 0 0 3px rgba(220,38,38,0.18)",
};

const brandText = {
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: tokens.color.textMuted,
};

const titleStyle = {
  fontSize: "26px",
  fontWeight: 800,
  letterSpacing: "-0.02em",
  color: tokens.color.text,
  margin: "0 0 6px",
};

const subtitleStyle = {
  fontSize: "14px",
  color: tokens.color.textMuted,
  lineHeight: 1.5,
  margin: "0 0 24px",
};

const tabsStyle = {
  display: "flex",
  gap: "20px",
  borderBottom: `1px solid ${tokens.color.border}`,
  marginBottom: "20px",
};

const tabStyle = {
  background: "transparent",
  border: "none",
  padding: "10px 0",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: tokens.font.family,
  borderBottom: "2px solid transparent",
  marginBottom: "-1px",
};

const dividerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  margin: "16px 0",
};

const dividerLine = { flex: 1, height: "1px", background: tokens.color.border };
const dividerText = { fontSize: "12px", color: tokens.color.textSubtle, fontWeight: 500 };

const fieldStyle = { marginBottom: "12px" };

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: tokens.color.textMuted,
  marginBottom: "6px",
};

const errorBoxStyle = {
  background: tokens.color.dangerBg,
  border: `1px solid ${tokens.color.dangerBorder}`,
  color: tokens.color.danger,
  padding: "10px 12px",
  borderRadius: tokens.radius.md,
  fontSize: "13px",
  fontWeight: 500,
  marginBottom: "12px",
};

const footerStyle = {
  marginTop: "20px",
  fontSize: "12px",
  color: tokens.color.textSubtle,
  textAlign: "center",
  lineHeight: 1.5,
};

// Language step
const previewCard = {
  background: tokens.color.surfaceSubtle,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.md,
  padding: "12px 14px",
  marginBottom: "18px",
};
const previewRow = { display: "flex", gap: "10px", alignItems: "flex-start" };
const previewBot = {
  fontSize: "20px", flexShrink: 0,
  width: "30px", height: "30px",
  borderRadius: tokens.radius.pill,
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
  display: "flex", alignItems: "center", justifyContent: "center",
};
const previewText = {
  fontSize: "13px", color: tokens.color.text, fontWeight: 500, lineHeight: 1.5, margin: 0,
};

const chipsRow = { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "6px" };
const chip = {
  display: "inline-flex", alignItems: "center", gap: "4px",
  padding: "5px 12px", borderRadius: tokens.radius.pill,
  fontSize: "12px", fontWeight: 600, border: "1px solid",
};
const chipRemove = {
  background: "transparent", border: "none", fontSize: "16px",
  cursor: "pointer", fontFamily: tokens.font.family, padding: 0, lineHeight: 1,
};
const countText = {
  fontSize: "11px", color: tokens.color.textSubtle, margin: "0 0 14px", fontWeight: 500,
};

const langGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "8px",
  maxHeight: "320px",
  overflowY: "auto",
};

const langCard = {
  position: "relative",
  border: "1px solid",
  borderRadius: tokens.radius.md,
  padding: "12px 8px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "3px",
  fontFamily: tokens.font.family,
  transition: "border-color 0.15s, background 0.15s",
};
const langNative = { fontSize: "14px", fontWeight: 700, color: tokens.color.text };
const langRegion = { fontSize: "10px", color: tokens.color.textSubtle, fontWeight: 500 };
const langCheck = {
  position: "absolute",
  top: "5px", right: "7px",
  width: "16px", height: "16px",
  borderRadius: tokens.radius.pill,
  background: tokens.color.text,
  color: "#fff",
  fontSize: "10px",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontWeight: 700,
};

