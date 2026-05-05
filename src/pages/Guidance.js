import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { tokens, styles as S } from "../theme";
import RelatedVideos from "../components/RelatedVideos";
import { extractVideoQuery } from "../utils/queryExtract";
import { listenOnce, sttErrorMessage, speak, stopSpeaking } from "../utils/speech";
import { transcribeAudio } from "../utils/groqAudio";
import { recordUtterance } from "../utils/recorder";

// Image to base64 helper
const toBase64 = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result.split(",")[1]);
  r.onerror = rej;
  r.readAsDataURL(file);
});

// Groq API config — key comes from .env.local (REACT_APP_GROQ_API_KEY).
// For production deployment this should be moved behind a serverless proxy.
const GROQ_KEY = process.env.REACT_APP_GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_CHAT_MODEL = "llama-3.1-8b-instant";
// Llama 3.2 vision-preview was deprecated by Groq; Llama 4 Scout is the
// current fast multimodal model with native image support.
const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const groqChat = async (messages, model = GROQ_CHAT_MODEL) => {
  if (!GROQ_KEY) {
    throw new Error("AI service not configured. Use the offline first-aid guides — they work without internet.");
  }
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({ model, messages, max_tokens: 700, temperature: 0.2 }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
};

const LANG_VOICE_MAP = {
  English: "en-US", Hindi: "hi-IN", Kannada: "kn-IN",
  Marathi: "mr-IN", Bengali: "bn-IN", Tamil: "ta-IN",
  Telugu: "te-IN", Gujarati: "gu-IN", Punjabi: "pa-IN",
  Malayalam: "ml-IN", Urdu: "ur-PK", Odia: "or-IN",
};

// ─── Romanized (transliterated) wordlists ────────────────────────────────
// Many users type Indian languages in Latin script ("Hinglish", "Tanglish").
// Script-based detection misses those, so we keyword-match against high-
// frequency tokens. Lists target emergency-related vocabulary.
const ROMAN_WORDS = {
  Hindi: new Set([
    "hai","hain","tha","thi","the","raha","rahi","rahe","gaya","gayi","gaye",
    "hua","hui","hue","diya","dena","liya","lena","kar","karo","karna","karta",
    "karti","karte","kya","kyu","kyun","kaise","kahan","kaha","kab","kyon",
    "mera","meri","mere","tera","teri","tere","uska","uski","uske","humara","humari",
    "tumhara","tumhari","apna","apni","apne",
    "main","mai","tum","aap","hum","woh","yeh","ye","wo","koi","kuch","sab",
    "nahi","nahin","naheen","na","haan","han","ji",
    "aur","lekin","magar","phir","bhi","toh","to","par","jab","tab","abhi","ab",
    "chot","dard","khoon","saans","dil","haath","pair","pet","sar","sir","aankh",
    "kaan","seena","sina","gala","cheene","jaan","zindagi","behosh","behoshi",
    "bukhar","ulti","chakkar","sujan","tabiyat","halat","saans","saanp","samp",
    "jal","jala","jali","jalan","jalna","jalgaya","jalgayi",
    "lag","lagi","laga","lage","laggaya","laggayi",
    "ho","hogaya","hogayi","hogaye",
    "madad","bachao","bachaao","mujhe","tujhe","usse",
    "bahut","thoda","zyada","jaldi","ekdam","accha","theek","thik","bura",
    "ambulance","aspatal","hospital","doctor",
  ]),
  Marathi: new Set([
    "ahe","aahe","aahot","ahot","aaheth","kasa","kashi","kase","kaay","kay",
    "majha","majhi","majhe","tujha","tujhi","tujhe","tyacha","tyachi",
    "mi","tu","to","ti","te","aapan","aaple",
    "kuthe","kadhi","ka","kaaran","mhanun","ani","pan","kinva",
    "haath","pay","dolyat","dard","jaal","jaala","jaali","aagh","aag",
    "madad","rugnaalay","doctor",
  ]),
  Tamil: new Set([
    "irukku","irukken","iruken","irukirathu","irukku","irukkudhu","illa","illai",
    "enna","epdi","yenna","yeppadi","epadi","yengana","yenga","engey","engadi",
    "naan","nee","neenga","avan","aval","avanga","naanga","namma",
    "vandha","ponen","ponaen","varugaen","varuvaen","varum","poganum",
    "kai","kaal","mugam","ratham","kannu","mookku","valikuthu","vali",
    "thee","theeyaa","sutu","suttu",
    "udane","vegamaa","kashtam","udhavi","aspathiri","hospital","doctor",
  ]),
  Telugu: new Set([
    "undi","vundi","unnadu","unnaru","ledu","leru","kaadu","kaduu",
    "emi","emiti","ela","ekkada","eppudu","enduku",
    "naaku","nuvvu","meeru","memu","manaki","mana","amma","nanna",
    "chethi","kaali","mukham","raktam","kallu",
    "kaalindi","kaaledhu","podhi","podichindhi",
    "vegamga","sahaayam","aspatri","hospital","doctor",
  ]),
  Bengali: new Set([
    "ache","achhe","achi","acho","achen","na","nei","hocche","hoyeche","hoye",
    "ki","kothay","kobe","kemon","keno","ke",
    "amar","amader","tomar","tomader","tar","tader",
    "ami","tumi","apni","amra","tomra","se","tara",
    "haat","pa","mukh","rokto","chokh",
    "jole","gechhe","poreche","laagchhe","sahajyo","hospital","daktar",
  ]),
};

const HINDI_STRONG = /\b(hai|hain|hua|hui|kya|kyun|kaise|raha hai|rahi hai|gaya hai|gayi hai|nahi|nahin|jal gaya|jal gayi|lag gaya|lag gayi|ho gaya|ho gayi|chot lagi|khoon|dard|behosh|saans|bachao|madad)\b/i;
const TAMIL_STRONG = /\b(enna|epdi|yenna|yeppadi|irukku|illai|udhavi)\b/i;
const TELUGU_STRONG = /\b(emiti|ela|ekkada|undi|ledu|sahaayam)\b/i;
const MARATHI_STRONG = /\b(aahe|kashi|kasa|majha|majhi|kuthe)\b/i;
const BENGALI_STRONG = /\b(achhe|kothay|amar|tomar|hocche|sahajyo)\b/i;

const detectRomanLang = (text, fallback) => {
  if (!text) return null;
  const lower = text.toLowerCase();
  // Strong signatures: a single match is enough.
  if (HINDI_STRONG.test(lower)) return fallback === "Marathi" ? "Marathi" : "Hindi";
  if (TAMIL_STRONG.test(lower)) return "Tamil";
  if (TELUGU_STRONG.test(lower)) return "Telugu";
  if (MARATHI_STRONG.test(lower)) return "Marathi";
  if (BENGALI_STRONG.test(lower)) return "Bengali";

  // Fallback: count token-level matches across all wordlists.
  const tokens = lower.split(/[^a-z]+/).filter(Boolean);
  if (tokens.length === 0) return null;
  const counts = {};
  for (const tok of tokens) {
    for (const [lang, set] of Object.entries(ROMAN_WORDS)) {
      if (set.has(tok)) counts[lang] = (counts[lang] || 0) + 1;
    }
  }
  let best = null, bestCount = 0;
  for (const [lang, c] of Object.entries(counts)) {
    if (c > bestCount) { bestCount = c; best = lang; }
  }
  // Need at least 2 hits to claim Roman-script of an Indian language —
  // single-word matches on tokens like "ho", "to", "na" are too noisy.
  if (bestCount >= 2) return best === "Hindi" && fallback === "Marathi" ? "Marathi" : best;
  return null;
};

// Auto-detect the language of a text by:
//   1. Unicode script range (covers native scripts).
//   2. Romanized keyword match (covers Hinglish, Tanglish, etc.).
//   3. Fall back to user's profile language, or English for pure Latin.
const detectLang = (text, fallback = "English") => {
  if (!text) return fallback;
  const ranges = [
    { lang: "Bengali", re: /[ঀ-৿]/g },
    { lang: "Gujarati", re: /[઀-૿]/g },
    { lang: "Tamil", re: /[஀-௿]/g },
    { lang: "Telugu", re: /[ఀ-౿]/g },
    { lang: "Kannada", re: /[ಀ-೿]/g },
    { lang: "Malayalam", re: /[ഀ-ൿ]/g },
    { lang: "Odia", re: /[଀-୿]/g },
    { lang: "Punjabi", re: /[਀-੿]/g },
    { lang: "Urdu", re: /[؀-ۿݐ-ݿ]/g },
  ];
  let bestLang = null;
  let bestCount = 0;
  for (const { lang, re } of ranges) {
    const m = text.match(re);
    if (m && m.length > bestCount) { bestCount = m.length; bestLang = lang; }
  }
  const dev = text.match(/[ऀ-ॿ]/g);
  if (dev && dev.length > bestCount) {
    bestCount = dev.length;
    bestLang = fallback === "Marathi" ? "Marathi" : "Hindi";
  }
  if (bestCount > 0) return bestLang;

  // No native script detected — try Roman/transliterated detection.
  const roman = detectRomanLang(text, fallback);
  if (roman) return roman;

  // Pure Latin with no Indian-language markers → English.
  return /[A-Za-z]/.test(text) ? "English" : fallback;
};

// UI strings for the Guidance screen. English + Hindi explicit;
// other languages fall back to English to stay shippable.
const GUIDANCE_T = {
  English: {
    headerSub: "Photo • Speak • Type",
    imageHint: "Send a photo — AI will see and tell you what to do",
    imageCardTitle: "Take a photo / Pick from gallery",
    imageCardSub: "Injuries • Fire • Accidents • Illness — AI recognizes all",
    pickBelow: "🆘 Or pick a common one:",
    listen: "🔊 Listen",
    stopListening: "⏹ Stop",
    analyzing: "📷 AI is analyzing…",
    inputPlaceholder: "Type or send a photo 📷",
    cameraTitle: "Send photo — AI will analyze",
    photoUserMsg: "📷 [Photo sent]",
    micTitle: "Voice input",
  },
  Hindi: {
    headerSub: "तस्वीर • बोलें • लिखें",
    imageHint: "तस्वीर भेजें — AI देखेगा और बताएगा क्या करना है",
    imageCardTitle: "तस्वीर खींचें / गैलरी से चुनें",
    imageCardSub: "चोट • आग • दुर्घटना • बीमारी — AI सब पहचानेगा",
    pickBelow: "🆘 या नीचे से चुनें:",
    listen: "🔊 सुनें",
    stopListening: "⏹ बंद करें",
    analyzing: "📷 AI analyze कर रहा है…",
    inputPlaceholder: "लिखें या तस्वीर भेजें 📷",
    cameraTitle: "तस्वीर भेजें — AI analyze करेगा",
    photoUserMsg: "📷 [तस्वीर भेजी]",
    micTitle: "वॉइस इनपुट",
  },
};

const getGuidanceT = (lang) => GUIDANCE_T[lang] || GUIDANCE_T.English;

const SUGGESTIONS_BY_LANG = {
  English: [
    "Heart attack — chest pain",
    "Someone is choking",
    "Fire at home",
    "Road accident",
    "Person unconscious",
    "Heavy bleeding",
    "Gas leak at home",
    "Earthquake — what to do",
  ],
  Hindi: [
    "दिल का दौरा - सीने में दर्द",
    "कोई दम घुट रहा है",
    "घर में आग लग गई",
    "सड़क दुर्घटना हो गई",
    "कोई बेहोश हो गया",
    "बहुत खून बह रहा है",
    "घर में गैस लीक हो रही है",
    "भूकंप आया - क्या करूं",
  ],
};

const getSuggestions = (lang) => SUGGESTIONS_BY_LANG[lang] || SUGGESTIONS_BY_LANG.English;

const styles = {
  page: {
    height: "calc(100vh - 65px)",
    background: tokens.color.bg,
    display: "grid",
    gridTemplateColumns: "280px minmax(0, 1fr)",
    overflow: "hidden",
    fontFamily: tokens.font.family,
    color: tokens.color.text,
  },
  sidebar: {
    background: tokens.color.surface,
    borderRight: `1px solid ${tokens.color.border}`,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    padding: "20px",
  },
  sidebarLabel: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: tokens.color.textSubtle,
    margin: "0 0 8px",
  },
  chatPane: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    background: tokens.color.bg,
  },
  chatHead: {
    padding: "16px 28px",
    background: tokens.color.surface,
    borderBottom: `1px solid ${tokens.color.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    flexShrink: 0,
  },
  chatHeadTitle: {
    fontSize: "16px",
    fontWeight: 700,
    margin: 0,
    color: tokens.color.text,
    letterSpacing: "-0.01em",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  brandDot: {
    width: "8px",
    height: "8px",
    borderRadius: tokens.radius.pill,
    background: tokens.color.danger,
    boxShadow: "0 0 0 3px rgba(220,38,38,0.18)",
    flexShrink: 0,
  },
  chatHeadSub: {
    fontSize: "12px",
    color: tokens.color.textSubtle,
    fontWeight: 500,
    marginLeft: "8px",
  },
  dot: {
    width: "6px",
    height: "6px",
    background: tokens.color.success,
    borderRadius: tokens.radius.pill,
    display: "inline-block",
  },
  callBtn: {
    ...S.primaryBtn,
    background: tokens.color.danger,
    padding: "8px 14px",
    fontSize: "13px",
    fontVariantNumeric: "tabular-nums",
    textDecoration: "none",
    flexShrink: 0,
    display: "inline-block",
  },
  msgs: {
    flex: 1,
    overflowY: "auto",
    padding: "24px 28px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    maxWidth: "880px",
    width: "100%",
    margin: "0 auto",
    boxSizing: "border-box",
  },
  msgRow: (role) => ({
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
    flexDirection: role === "user" ? "row-reverse" : "row",
  }),
  avatar: (role) => ({
    width: "30px",
    height: "30px",
    borderRadius: tokens.radius.pill,
    background: role === "user" ? tokens.color.surfaceSubtle : tokens.color.dangerBg,
    border: `1px solid ${role === "user" ? tokens.color.border : tokens.color.dangerBorder}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: 700,
    color: role === "user" ? tokens.color.text : tokens.color.danger,
    flexShrink: 0,
  }),
  bubble: (role) => ({
    maxWidth: "85%",
    background: role === "user" ? tokens.color.text : tokens.color.surface,
    color: role === "user" ? "#fff" : tokens.color.text,
    border: role === "user" ? "none" : `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.lg,
    padding: "12px 14px",
    boxShadow: role === "user" ? "none" : tokens.shadow.sm,
  }),
  msgText: (role) => ({
    fontSize: "15px",
    lineHeight: 1.6,
    color: role === "user" ? "#fff" : tokens.color.text,
    margin: 0,
  }),
  stepBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    background: tokens.color.surfaceSubtle,
    borderRadius: tokens.radius.md,
    padding: "10px 12px",
    margin: "6px 0",
    fontSize: "14px",
    color: tokens.color.text,
  },
  stepNum: {
    background: tokens.color.text,
    color: "#fff",
    width: "22px",
    height: "22px",
    borderRadius: tokens.radius.pill,
    fontSize: "11px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  speakBtn: (on) => ({
    marginTop: "10px",
    background: "transparent",
    border: `1px solid ${on ? tokens.color.dangerBorder : tokens.color.border}`,
    color: on ? tokens.color.danger : tokens.color.textMuted,
    padding: "6px 12px",
    borderRadius: tokens.radius.pill,
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: tokens.font.family,
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
  }),
  loadingRow: {
    display: "flex",
    gap: "5px",
    padding: "4px 0",
    alignItems: "center",
  },
  sugBox: { margin: "4px 0" },
  sugLabel: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: tokens.color.textSubtle,
    marginBottom: "10px",
  },
  sugGrid: { display: "flex", flexWrap: "wrap", gap: "6px" },
  sugBtn: {
    background: tokens.color.surface,
    border: `1px solid ${tokens.color.border}`,
    color: tokens.color.text,
    padding: "8px 13px",
    borderRadius: tokens.radius.pill,
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: tokens.font.family,
    transition: "all 0.15s",
  },
  quickBar: {
    display: "none",
  },
  qBtn: () => ({
    flex: 1,
    textAlign: "center",
    padding: "10px 4px",
    borderRadius: tokens.radius.md,
    fontSize: "13px",
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
    background: tokens.color.surfaceSubtle,
    color: tokens.color.text,
    border: `1px solid ${tokens.color.border}`,
    textDecoration: "none",
    display: "block",
    fontFamily: tokens.font.family,
  }),
  inputArea: {
    display: "flex",
    gap: "10px",
    padding: "16px 28px 20px",
    background: tokens.color.surface,
    borderTop: `1px solid ${tokens.color.border}`,
    flexShrink: 0,
    maxWidth: "880px",
    width: "100%",
    margin: "0 auto",
    boxSizing: "border-box",
  },
  micBtn: (on) => ({
    width: "42px",
    height: "42px",
    background: on ? tokens.color.dangerBg : tokens.color.surfaceSubtle,
    border: `1px solid ${on ? tokens.color.dangerBorder : tokens.color.border}`,
    color: on ? tokens.color.danger : tokens.color.textMuted,
    borderRadius: tokens.radius.pill,
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    cursor: "pointer",
    fontFamily: tokens.font.family,
  }),
  textInput: {
    flex: 1,
    background: tokens.color.surfaceSubtle,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.pill,
    padding: "11px 16px",
    fontSize: "15px",
    color: tokens.color.text,
    fontFamily: tokens.font.family,
    outline: "none",
  },
  sendBtn: (disabled) => ({
    width: "42px",
    height: "42px",
    background: disabled ? tokens.color.surfaceSubtle : tokens.color.text,
    color: disabled ? tokens.color.textSubtle : "#fff",
    borderRadius: tokens.radius.pill,
    fontSize: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    border: disabled ? `1px solid ${tokens.color.border}` : "none",
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: tokens.font.family,
  }),
};

export default function Guidance() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, selectedLanguages } = useAppContext();
  const query = location.state?.query || "";
  const primary = selectedLanguages?.[0] || "English";
  const gt = getGuidanceT(primary);
  const suggestionList = getSuggestions(primary);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceState, setVoiceState] = useState("idle"); // idle | recording | transcribing
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [showSug, setShowSug] = useState(true);
  const [imgPreview, setImgPreview] = useState(null);
  const [imgAnalyzing, setImgAnalyzing] = useState(false);
  const fileInputRef = useRef(null);

  const historyRef = useRef([]); // Groq conversation history
  const initDone = useRef(false);
  const messagesEnd = useRef(null);
  const recCtrlRef = useRef(null);    // active VoiceRecorder controller
  const lastInputViaVoiceRef = useRef(false); // auto-speak reply only when input came from voice

  useEffect(() => {
    // Pre-warm the voice list so the first TTS call is instant.
    import("../utils/speech").then((m) => m.getVoices());
  }, []);

  useEffect(() => {
    if (!initDone.current) {
      initDone.current = true;
      initChat();
    }
  }, []);

  // Re-init when language changes
  useEffect(() => {
    initDone.current = false;
    historyRef.current = [];
    setMessages([]);
    setShowSug(true);
    initDone.current = true;
    initChat();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguages[0]]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const initChat = async () => {
    const primary = selectedLanguages[0] || "English";
    const scriptMap = {
      Hindi: "Devanagari", Kannada: "Kannada script", Marathi: "Devanagari",
      Bengali: "Bengali script", Tamil: "Tamil script", Telugu: "Telugu script",
      Gujarati: "Gujarati script", Punjabi: "Gurmukhi", Malayalam: "Malayalam script",
      Urdu: "Nastaliq/Urdu", Odia: "Odia script", English: "English",
    };
    const script = scriptMap[primary] || primary;

    const sysPrompt = `You are ResQ AI — India's industrial-grade emergency response AI.

LANGUAGE RULE (ABSOLUTE — NEVER BREAK):
- Output language: ${primary} using ${script} only.
- If ${primary} is Hindi → EVERY word in Devanagari script.
- If ${primary} is Kannada → EVERY word in Kannada script.
- ZERO English unless ${primary} IS English.

For every emergency, respond in EXACTLY this structure:
🚨 [Situation — 1 clear line in ${primary}]

⚠️ [Urgency: हल्का/सामान्य/गंभीर/जानलेवा (LOW/MEDIUM/HIGH/CRITICAL) in ${primary}]

📋 तुरंत करें (in ${primary}):
1. [step 1]
2. [step 2]
3. [step 3]
4. [step 4]
5. [step 5]

📞 [Emergency number 100/101/102/108/112 + why, in ${primary}]
🏥 [Hospital जरूरी: हाँ/नहीं + reason in ${primary}]

Max 200 words. Direct. Calm. Life-saving.`;

    historyRef.current = [
      { role: "system", content: sysPrompt },
    ];

    // Arriving from Home's photo-triage flow with a pre-analysed image.
    const fromVision = location.state?.fromVision;
    const imagePreview = location.state?.imagePreview;

    const initialMsgs = [{ role: "assistant", content: buildWelcome(primary, user?.name) }];
    if (fromVision && imagePreview) {
      initialMsgs.push({
        role: "user",
        content: "📷 [Photo sent]",
        isImage: true,
        imgSrc: imagePreview,
      });
      initialMsgs.push({
        role: "assistant",
        content: [
          `🚨 ${fromVision.description || "Image analysed."}`,
          fromVision.severity ? `⚠️ Severity: ${fromVision.severity.toUpperCase()}` : null,
          fromVision.immediateAction ? `\n📋 First action:\n${fromVision.immediateAction}` : null,
          fromVision.callNumber ? `\n📞 Call ${fromVision.callNumber}` : null,
        ].filter(Boolean).join("\n"),
      });
    }
    setMessages(initialMsgs);
    if (query) {
      setShowSug(false);
      await doSend(query);
    }
  };

  const buildWelcome = (lang, name) => {
    const n = name || "";
    const map = {
      Hindi:     `नमस्ते ${n}! मैं ResQ AI हूँ 🚨\n\n**सिर्फ हिंदी में जवाब दूँगा।**\n\n📷 तस्वीर भेजें या नीचे से आपातकाल चुनें\n\n⚡ क्या हुआ? तुरंत बताएं।`,
      Kannada:   `ನಮಸ್ಕಾರ ${n}! ನಾನು ResQ AI 🚨\n\n**ಕನ್ನಡದಲ್ಲಿ ಮಾತ್ರ ಉತ್ತರಿಸುತ್ತೇನೆ.**\n\n📷 ಫೋಟೋ ಕಳುಹಿಸಿ ಅಥವಾ ತುರ್ತು ಸ್ಥಿತಿ ಆಯ್ಕೆ ಮಾಡಿ\n\n⚡ ಏನಾಯಿತು? ಹೇಳಿ.`,
      Marathi:   `नमस्कार ${n}! मी ResQ AI 🚨\n\n**मराठीत उत्तर देईन.**\n\n📷 फोटो पाठवा किंवा आपत्काल निवडा\n\n⚡ काय झाले? सांगा.`,
      Bengali:   `হ্যালো ${n}! আমি ResQ AI 🚨\n\n**বাংলায় উত্তর দেব.**\n\n📷 ছবি পাঠান বা জরুরি অবস্থা বেছে নিন\n\n⚡ কী হয়েছে? বলুন.`,
      Tamil:     `வணக்கம் ${n}! நான் ResQ AI 🚨\n\n**தமிழில் மட்டும் பதிலளிப்பேன்.**\n\n📷 படம் அனுப்பவும் அல்லது அவசரநிலை தேர்ந்தெடுக்கவும்\n\n⚡ என்ன நடந்தது? சொல்லுங்கள்.`,
      Telugu:    `నమస్కారం ${n}! నేను ResQ AI 🚨\n\n**తెలుగులో మాత్రమే జవాబిస్తాను.**\n\n📷 ఫోటో పంపండి అల్లేదా అత్యవసరం ఎంచుకోండి\n\n⚡ ఏమైంది? చెప్పండి.`,
      Gujarati:  `નમસ્તે ${n}! હું ResQ AI 🚨\n\n**ગુજરાતીમાં જ જવાબ આપીશ.**\n\n📷 ફોટો મોકલો અથવા કટોકટી પસંદ કરો\n\n⚡ શું થયું? કહો.`,
      Punjabi:   `ਸਤ ਸ੍ਰੀ ਅਕਾਲ ${n}! ਮੈਂ ResQ AI 🚨\n\n**ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦੇਵਾਂਗਾ.**\n\n📷 ਫੋਟੋ ਭੇਜੋ ਜਾਂ ਐਮਰਜੈਂਸੀ ਚੁਣੋ\n\n⚡ ਕੀ ਹੋਇਆ? ਦੱਸੋ.`,
      Malayalam: `നമസ്കാരം ${n}! ഞാൻ ResQ AI 🚨\n\n**മലയാളത്തിൽ മാത്രം മറുപടി നൽകും.**\n\n📷 ഫോട്ടോ അയക്കൂ അല്ലെങ്കിൽ അടിയന്തരാവസ്ഥ തിരഞ്ഞെടുക്കൂ\n\n⚡ എന്ത് സംഭവിച്ചു? പറയൂ.`,
      Urdu:      `السلام ${n}! میں ResQ AI 🚨\n\n**اردو میں جواب دوں گا.**\n\n📷 تصویر بھیجیں یا ہنگامی صورتحال منتخب کریں\n\n⚡ کیا ہوا؟ بتائیں.`,
      Odia:      `ନମସ୍କାର ${n}! ମୁଁ ResQ AI 🚨\n\n**ଓଡ଼ିଆରେ ଉତ୍ତର ଦେବି.**\n\n📷 ଫଟୋ ପଠାନ୍ତୁ କିମ୍ବା ଜରୁରୀ ପ୍ରସଙ୍ଗ ବାଛନ୍ତୁ\n\n⚡ କ'ଣ ହେଲା? କୁହନ୍ତୁ.`,
      English:   `Hello ${n}! I'm ResQ AI 🚨\n\n**I respond in English only.**\n\n📷 Send a photo or pick an emergency below\n\n⚡ What happened? Tell me.`,
    };
    return map[lang] || map["English"];
  };

  const doSend = async (text) => {
    if (!text?.trim()) return;
    const userPrimary = selectedLanguages[0] || "English";
    // Auto-detect the language of the user's input. If detection is
    // confident (script-based), reply in the same language. Otherwise
    // fall back to the user's profile language.
    const replyLang = detectLang(text, userPrimary);
    const scriptMap = {
      Hindi: "Devanagari", Kannada: "Kannada script", Marathi: "Devanagari",
      Bengali: "Bengali script", Tamil: "Tamil script", Telugu: "Telugu script",
      Gujarati: "Gujarati script", Punjabi: "Gurmukhi", Malayalam: "Malayalam script",
      Urdu: "Nastaliq/Urdu", Odia: "Odia script", English: "English",
    };
    const script = scriptMap[replyLang] || replyLang;

    const sysMsg = `You are ResQ AI — India's emergency response AI.

!!!CRITICAL LANGUAGE RULE — DO NOT IGNORE!!!
- The user wrote their question in ${replyLang}. You MUST reply in ${replyLang}.
- Output language: ${replyLang} ONLY
- Script: ${script} ONLY
- Writing even ONE word in another language (except proper nouns like CPR, AED, BP) = FAILURE
- If ${replyLang} is Hindi: write ONLY in Devanagari script
- If ${replyLang} is Kannada: write ONLY in ಕನ್ನಡ script
- If ${replyLang} is Tamil: write ONLY in தமிழ் script
- If ${replyLang} is English: write ONLY in English
- This rule applies to ALL parts: situation, urgency, steps, phone, hospital

For every emergency respond in EXACTLY this format (all text in ${replyLang}):
🚨 [Situation in ${replyLang}]
⚠️ [Urgency in ${replyLang}]
📋 Steps (in ${replyLang}):
1.
2.
3.
4.
5.
📞 [Call number + reason in ${replyLang}]
🏥 [Hospital YES/NO + reason in ${replyLang}]
Max 200 words. Be direct and calm.`;

    const msgHistory = [
      { role: "system", content: sysMsg },
      ...historyRef.current.filter(m => m.role !== "system").slice(-6),
      {
        role: "user",
        content: `${text}\n\n[The user wrote in ${replyLang}. Your ENTIRE response MUST be in ${replyLang} using ${script}. Do NOT switch languages.]`,
      },
    ];

    setMessages((p) => [...p, { role: "user", content: text }]);
    setLoading(true);
    setInputText("");
    setShowSug(false);

    try {
      const resp = await groqChat(msgHistory);
      historyRef.current.push(
        { role: "user", content: text },
        { role: "assistant", content: resp }
      );
      setMessages((p) => [...p, { role: "assistant", content: resp }]);
      // If the user spoke this question, speak the answer back automatically.
      if (lastInputViaVoiceRef.current) {
        lastInputViaVoiceRef.current = false;
        setTimeout(() => handleSpeak(resp), 300);
      }
    } catch (err) {
      console.error("Groq error:", err);
      const errMsgs = {
        Hindi: "⚠️ कनेक्शन समस्या।\n📞 तुरंत 112 पर कॉल करें",
        Kannada: "⚠️ ಸಂಪರ್ಕ ಸಮಸ್ಯೆ.\n📞 ತಕ್ಷಣ 112 ಕರೆ ಮಾಡಿ",
        Tamil: "⚠️ இணைப்பு சிக்கல்.\n📞 உடனே 112 அழைக்கவும்",
        Telugu: "⚠️ కనెక్షన్ సమస్య.\n📞 వెంటనే 112 కు కాల్ చేయండి",
        Bengali: "⚠️ সংযোগ সমস্যা।\n📞 অবিলম্বে 112 কল করুন",
        Marathi: "⚠️ कनेक्शन समस्या.\n📞 लगेच 112 कॉल करा",
        English: "⚠️ Connection issue.\n📞 Call 112 immediately",
      };
      setMessages((p) => [...p, { role: "assistant", content: errMsgs[replyLang] || errMsgs.English }]);
    }
    setLoading(false);
  };

  // 📷 IMAGE ANALYSIS - Gemini Vision
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setImgPreview(previewUrl);
    setImgAnalyzing(true);
    setShowSug(false);
    setMessages((p) => [
      ...p,
      { role: "user", content: gt.photoUserMsg, isImage: true, imgSrc: previewUrl },
    ]);
    try {
      const base64 = await toBase64(file);
      const mimeType = file.type || "image/jpeg";
      // For camera-only upload there's no text to detect from, so use profile language.
      const replyLang = selectedLanguages[0] || "English";
      const prompt = `You are ResQ AI, India's emergency response AI.
Analyze this image. Respond ONLY in ${replyLang} script. Zero other languages (proper nouns like CPR, AED are OK).

Format:
🔍 [Situation — what you see, 1 line in ${replyLang}]
⚠️ [Severity: LOW / MEDIUM / HIGH / CRITICAL in ${replyLang}]

📋 [Do now in ${replyLang}]:
1.
2.
3.
4.
5.

📞 [Call: 100/101/102/108/112 + reason in ${replyLang}]
🏥 [Hospital: YES/NO + reason in ${replyLang}]`;

      const resp = await groqChat([
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        },
      ], GROQ_VISION_MODEL);
      setMessages((p) => [...p, { role: "assistant", content: resp }]);
    } catch (err) {
      console.error("Image analysis error:", err);
      const lang = selectedLanguages[0] || "English";
      const errMsg = {
        Hindi: "⚠️ तस्वीर analyze नहीं हो पाई।\nअपनी समस्या शब्दों में बताएं।\n📞 112",
        Kannada: "⚠️ ಫೋಟೋ analyze ಆಗಲಿಲ್ಲ.\nನಿಮ್ಮ ಸಮಸ್ಯೆ ಮಾತುಗಳಲ್ಲಿ ಹೇಳಿ.\n📞 112",
        English: "⚠️ Image analysis failed.\nDescribe your situation in text.\n📞 112",
      };
      setMessages((p) => [...p, { role: "assistant", content: errMsg[lang] || errMsg.English }]);
    }
    setImgAnalyzing(false);
    setImgPreview(null);
    e.target.value = "";
  };

  // Read-aloud: detect language from the message itself so each bubble is
  // spoken in its own script, regardless of the UI language.
  const handleSpeak = async (text) => {
    if (!window.speechSynthesis) {
      alert("Speech is not supported in this browser.");
      return;
    }
    const clean = text
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/#/g, "")
      .replace(/🚨|📞|⚠️|✅|📋|🏥|🔍|🤖|🆘/g, "")
      .replace(/\[.*?\]/g, "")
      .trim();
    const detected = detectLang(clean, primary);
    const lang = LANG_VOICE_MAP[detected] || "en-US";
    await speak(clean, {
      lang,
      rate: 0.95,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const stopSpeak = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  // Voice input — uses MediaRecorder + Groq Whisper for accurate
  // multilingual transcription. Works on iOS Safari (where the browser's
  // SpeechRecognition API doesn't exist).
  // Tap once = start recording. Tap again, or stay silent for ~1.4s, to stop.
  // Audio goes to Whisper, transcript goes to the AI, AI reply is auto-spoken.
  const handleVoice = async () => {
    // Already recording? Stop early.
    if (voiceState === "recording" && recCtrlRef.current) {
      try { await recCtrlRef.current.stopEarly(); } catch {}
      return;
    }
    // Don't double-fire while transcribing.
    if (voiceState === "transcribing") return;

    const lang = selectedLanguages[0] || "English";
    setIsListening(true);

    try {
      const ctrl = recordUtterance({
        onLevel: (rms) => setVoiceLevel(rms),
      });
      recCtrlRef.current = ctrl;
      await ctrl.started;
      setVoiceState("recording");

      const blob = await ctrl.finished;
      recCtrlRef.current = null;
      setVoiceState("transcribing");
      setVoiceLevel(0);

      if (!blob || blob.size < 1000) {
        // Empty recording — likely cancelled before any speech.
        setVoiceState("idle");
        setIsListening(false);
        return;
      }

      const transcript = await transcribeAudio(blob, lang);
      setVoiceState("idle");
      setIsListening(false);

      if (!transcript) {
        setMessages((p) => [...p, { role: "assistant", content: "⚠️ I couldn't hear that. Please try again." }]);
        return;
      }
      lastInputViaVoiceRef.current = true;
      doSend(transcript);
    } catch (err) {
      console.error("Voice input failed:", err);
      setVoiceState("idle");
      setIsListening(false);
      setVoiceLevel(0);
      recCtrlRef.current = null;
      let code = "generic";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") code = "not-allowed";
      else if (err.name === "NotFoundError") code = "audio-capture";
      else if (String(err.message || "").includes("Transcription")) code = "network";
      const msg = sttErrorMessage(code, lang) || `⚠️ ${err.message}`;
      setMessages((p) => [...p, { role: "assistant", content: `⚠️ ${msg}` }]);
    }
  };

  const renderContent = (text) =>
    text.split("\n").map((line, i) => {
      if (!line.trim()) return <br key={i} />;
      // Numbered steps
      if (line.match(/^\d+[\.\)]/)) {
        return (
          <div key={i} style={styles.stepBox}>
            <span style={styles.stepNum}>{line.match(/^\d+/)[0]}</span>
            <span style={{ fontSize: "14px", lineHeight: "1.5" }}>
              {line.replace(/^\d+[\.\)]\s*/, "")}
            </span>
          </div>
        );
      }
      // Urgency line
      if (line.includes("CRITICAL") || line.includes("HIGH") || line.includes("⚠️")) {
        const isRed = line.includes("CRITICAL");
        return (
          <div key={i} style={{
            background: isRed ? tokens.color.dangerBg : tokens.color.warningBg,
            border: `1px solid ${isRed ? tokens.color.dangerBorder : tokens.color.warningBorder}`,
            borderRadius: tokens.radius.md, padding: "8px 12px", margin: "6px 0",
            fontSize: "12px", fontWeight: 700,
            letterSpacing: "0.02em",
            color: isRed ? tokens.color.danger : tokens.color.warning,
          }}>{line}</div>
        );
      }
      // Section headers (🔍 📋 📞 🏥 🚨)
      if (line.match(/^[🔍📋📞🏥🚨]/)) {
        return (
          <p key={i} style={{
            margin: "8px 0 4px", fontSize: "13px", fontWeight: 700,
            letterSpacing: "0.01em",
            color: tokens.color.text,
          }}>{line}</p>
        );
      }
      // Bold
      if (line.includes("**")) {
        const parts = line.split("**");
        return (
          <p key={i} style={{ margin: "4px 0", fontSize: "14px", color: tokens.color.text, lineHeight: 1.6 }}>
            {parts.map((p, pi) => pi % 2 === 1 ? <strong key={pi}>{p}</strong> : p)}
          </p>
        );
      }
      return (
        <p key={i} style={{ margin: "4px 0", fontSize: "14px", color: tokens.color.textMuted, lineHeight: 1.6 }}>
          {line}
        </p>
      );
    });

  const disabled = loading || !inputText.trim();

  const QUICK_NUMS = [
    { num: "112", label: "All emergencies" },
    { num: "102", label: "Ambulance" },
    { num: "101", label: "Fire" },
    { num: "100", label: "Police" },
  ];

  return (
    <div style={styles.page}>
      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        @keyframes dot { 0%,80%,100%{transform:scale(0.8);opacity:0.5} 40%{transform:scale(1.2);opacity:1} }
        .loading-dot { width:6px;height:6px;background:${tokens.color.textSubtle};border-radius:50%;display:inline-block;animation:dot 1.4s infinite; }
        .loading-dot:nth-child(2){animation-delay:0.2s}
        .loading-dot:nth-child(3){animation-delay:0.4s}
        .sug-side-btn{
          background: transparent;
          border: 1px solid ${tokens.color.border};
          color: ${tokens.color.text};
          padding: 9px 12px;
          border-radius: ${tokens.radius.md};
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition: background 0.15s, border-color 0.15s;
          width: 100%;
        }
        .sug-side-btn:hover{
          background: ${tokens.color.surfaceSubtle};
          border-color: ${tokens.color.borderStrong};
        }
        .qnum-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: ${tokens.radius.md};
          color: ${tokens.color.text};
          text-decoration: none;
          font-family: inherit;
          transition: background 0.15s;
        }
        .qnum-row:hover { background: ${tokens.color.surfaceSubtle}; }
        input:focus{border-color:${tokens.color.primary} !important;box-shadow:0 0 0 3px rgba(15,23,42,0.06) !important;outline:none}
        .mobile-sug-strip { display: none; }
        .mobile-sug-strip::-webkit-scrollbar { display: none; }
        @media (max-width: 1024px) {
          .guidance-grid { grid-template-columns: 1fr !important; }
          .guidance-sidebar { display: none !important; }
          .mobile-sug-strip { display: flex !important; }
        }
      `}</style>

      {/* Sidebar */}
      <aside className="guidance-sidebar" style={styles.sidebar}>
        <div>
          <p style={styles.sidebarLabel}>Try asking</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {suggestionList.slice(0, 6).map((s, i) => (
              <button key={i} className="sug-side-btn" onClick={() => doSend(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p style={styles.sidebarLabel}>Camera triage</p>
          <button
            type="button"
            style={{
              width: "100%",
              background: tokens.color.surface,
              border: `1px dashed ${tokens.color.borderStrong}`,
              borderRadius: tokens.radius.md,
              padding: "16px 14px",
              cursor: "pointer",
              fontFamily: tokens.font.family,
              textAlign: "center",
              color: tokens.color.text,
              transition: "border-color 0.15s, background 0.15s",
            }}
            onClick={() => fileInputRef.current?.click()}
            disabled={imgAnalyzing}
          >
            <div style={{ fontSize: "20px", marginBottom: "4px" }}>📷</div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: tokens.color.text }}>
              {gt.imageCardTitle}
            </div>
            <div style={{ fontSize: "11px", color: tokens.color.textSubtle, marginTop: "3px" }}>
              {gt.imageCardSub}
            </div>
          </button>
        </div>

        <div>
          <p style={styles.sidebarLabel}>Emergency numbers</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {QUICK_NUMS.map((q) => (
              <a key={q.num} href={`tel:${q.num}`} className="qnum-row">
                <span style={{ fontSize: "18px", fontWeight: 800, fontVariantNumeric: "tabular-nums", minWidth: "44px" }}>{q.num}</span>
                <span style={{ fontSize: "13px", color: tokens.color.textMuted }}>{q.label}</span>
              </a>
            ))}
          </div>
        </div>

      </aside>

      {/* Chat pane */}
      <section style={styles.chatPane}>
        <div style={styles.chatHead}>
          <div>
            <h2 style={styles.chatHeadTitle}>
              <span style={styles.brandDot} />
              AI guidance
              <span style={styles.chatHeadSub}>· {gt.headerSub}</span>
            </h2>
          </div>
          <a href="tel:112" style={styles.callBtn}>Call 112</a>
        </div>

        {/* Mobile-only suggestions strip (visible when sidebar is hidden) */}
        <div
          className="mobile-sug-strip"
          style={{
            gap: "8px",
            padding: "10px 16px",
            background: tokens.color.surface,
            borderBottom: `1px solid ${tokens.color.border}`,
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              flexShrink: 0,
              background: tokens.color.surfaceSubtle,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.pill,
              padding: "7px 12px",
              fontSize: "13px",
              fontWeight: 600,
              color: tokens.color.text,
              cursor: "pointer",
              fontFamily: tokens.font.family,
            }}
            disabled={imgAnalyzing}
          >
            📷 Photo
          </button>
          {suggestionList.slice(0, 6).map((s, i) => (
            <button
              key={i}
              onClick={() => doSend(s)}
              style={{
                flexShrink: 0,
                background: tokens.color.surface,
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.pill,
                padding: "7px 12px",
                fontSize: "13px",
                fontWeight: 500,
                color: tokens.color.text,
                cursor: "pointer",
                fontFamily: tokens.font.family,
                whiteSpace: "nowrap",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {voiceState !== "idle" && (
          <div style={{
            padding: "10px 28px",
            background: voiceState === "recording" ? tokens.color.dangerBg : tokens.color.surfaceSubtle,
            borderBottom: `1px solid ${voiceState === "recording" ? tokens.color.dangerBorder : tokens.color.border}`,
            display: "flex", alignItems: "center", gap: "12px",
            flexShrink: 0,
            color: voiceState === "recording" ? tokens.color.danger : tokens.color.textMuted,
          }}>
            <span style={{ fontSize: "16px" }}>{voiceState === "recording" ? "🎙️" : "✨"}</span>
            <p style={{ fontSize: "13px", fontWeight: 600, margin: 0, flex: 1 }}>
              {voiceState === "recording"
                ? "Listening… speak naturally. Stops on silence or tap mic to stop."
                : "Transcribing with Whisper…"}
            </p>
            {voiceState === "recording" && (
              <div style={{
                width: "64px",
                height: "6px",
                background: "rgba(220,38,38,0.15)",
                borderRadius: tokens.radius.pill,
                overflow: "hidden",
              }}>
                <div style={{
                  width: `${Math.round(voiceLevel * 100)}%`,
                  height: "100%",
                  background: tokens.color.danger,
                  transition: "width 0.05s linear",
                }} />
              </div>
            )}
            {voiceState === "transcribing" && (
              <div style={{ display: "flex", gap: "4px" }}>
                <span className="loading-dot" />
                <span className="loading-dot" />
                <span className="loading-dot" />
              </div>
            )}
          </div>
        )}

        {imgAnalyzing && (
          <div style={{
            padding: "10px 28px",
            background: tokens.color.warningBg,
            borderBottom: `1px solid ${tokens.color.warningBorder}`,
            display: "flex", alignItems: "center", gap: "12px",
            flexShrink: 0,
            color: tokens.color.warning,
          }}>
            <span style={{ fontSize: "16px" }}>🔍</span>
            <p style={{ fontSize: "13px", fontWeight: 600, margin: 0, flex: 1 }}>
              {gt.analyzing}
            </p>
            <div style={{ display: "flex", gap: "4px" }}>
              <span className="loading-dot" style={{ background: tokens.color.warning }} />
              <span className="loading-dot" style={{ background: tokens.color.warning, animationDelay: "0.2s" }} />
              <span className="loading-dot" style={{ background: tokens.color.warning, animationDelay: "0.4s" }} />
            </div>
          </div>
        )}

        <div style={styles.msgs}>
          {messages.map((msg, i) => {
            // Inline-video query = the user message that triggered this AI
            // response. Skip the welcome message (i === 0). Skip any
            // assistant message that's just an error/warning bubble.
            let videoQuery = null;
            if (msg.role === "assistant" && i > 0 && !msg.content?.startsWith("⚠️")) {
              for (let j = i - 1; j >= 0; j--) {
                const prev = messages[j];
                if (prev.role === "user") {
                  videoQuery = prev.isImage
                    ? (location.state?.fromVision?.description || "first aid emergency")
                    : prev.content;
                  break;
                }
              }
            }

            return (
              <React.Fragment key={i}>
                <div style={styles.msgRow(msg.role)}>
                  <div style={styles.avatar(msg.role)}>
                    {msg.role === "user" ? user?.name?.[0]?.toUpperCase() || "U" : "🤖"}
                  </div>
                  <div style={styles.bubble(msg.role)}>
                    {msg.isImage && msg.imgSrc && (
                      <div style={{ marginBottom: "6px" }}>
                        <img
                          src={msg.imgSrc}
                          alt="uploaded"
                          style={{ width: "100%", maxWidth: "240px", borderRadius: tokens.radius.md, display: "block" }}
                        />
                        <p style={{
                          fontSize: "12px",
                          color: msg.role === "user" ? "rgba(255,255,255,0.7)" : tokens.color.textMuted,
                          margin: "6px 0 0",
                        }}>
                          {gt.analyzing}
                        </p>
                      </div>
                    )}
                    {!msg.isImage && (
                      <div style={styles.msgText(msg.role)}>
                        {renderContent(msg.content)}
                      </div>
                    )}
                    {msg.role === "assistant" && (
                      <button
                        style={styles.speakBtn(isSpeaking)}
                        onClick={() => isSpeaking ? stopSpeak() : handleSpeak(msg.content)}
                        aria-label={isSpeaking ? gt.stopListening : gt.listen}
                      >
                        {isSpeaking ? gt.stopListening : gt.listen}
                      </button>
                    )}
                  </div>
                </div>

                {/* Related videos shown inline right after the assistant's
                    response — gives the user a tutorial to watch alongside
                    the steps the AI just listed. The transformer compresses
                    the (possibly multilingual) user message + AI reply into
                    a focused English search query. */}
                {videoQuery && (
                  <div style={{
                    marginLeft: 40,
                    maxWidth: "calc(100% - 40px)",
                    paddingTop: 4,
                  }}>
                    <RelatedVideos
                      query={videoQuery.slice(0, 200)}
                      transformQuery={(q) => extractVideoQuery(q, msg.content)}
                      label="Watch demonstrations"
                      max={4}
                      compact
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {loading && (
            <div style={styles.msgRow("assistant")}>
              <div style={styles.avatar("assistant")}>🤖</div>
              <div style={styles.bubble("assistant")}>
                <div style={styles.loadingRow}>
                  <span className="loading-dot" />
                  <span className="loading-dot" />
                  <span className="loading-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEnd} />
        </div>

        {/* Input row */}
        <div style={styles.inputArea}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={handleImageUpload}
          />
          <button
            style={{
              width: "44px", height: "44px",
              background: imgAnalyzing ? tokens.color.dangerBg : tokens.color.surfaceSubtle,
              border: `1px solid ${imgAnalyzing ? tokens.color.dangerBorder : tokens.color.border}`,
              color: imgAnalyzing ? tokens.color.danger : tokens.color.textMuted,
              borderRadius: tokens.radius.pill, fontSize: "16px",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, cursor: "pointer",
              fontFamily: tokens.font.family,
            }}
            onClick={() => fileInputRef.current?.click()}
            title={gt.cameraTitle}
            aria-label={gt.cameraTitle}
            disabled={imgAnalyzing}
          >
            {imgAnalyzing ? "…" : "📷"}
          </button>
          <button
            style={{
              ...styles.micBtn(voiceState !== "idle"),
              width: "44px",
              height: "44px",
              position: "relative",
              boxShadow: voiceState === "recording"
                ? `0 0 0 ${4 + Math.round(voiceLevel * 10)}px rgba(220,38,38,${0.18 + voiceLevel * 0.3})`
                : undefined,
              transition: "box-shadow 0.05s linear",
            }}
            onClick={handleVoice}
            title={
              voiceState === "recording" ? "Stop recording"
              : voiceState === "transcribing" ? "Transcribing…"
              : gt.micTitle
            }
            aria-label={gt.micTitle}
            disabled={voiceState === "transcribing"}
          >
            {voiceState === "recording" ? "■"
              : voiceState === "transcribing" ? "…"
              : "🎤"}
          </button>
          <input
            style={styles.textInput}
            placeholder={gt.inputPlaceholder}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !disabled && doSend(inputText)}
          />
          <button
            style={{ ...styles.sendBtn(disabled), width: "44px", height: "44px" }}
            onClick={() => !disabled && doSend(inputText)}
            disabled={disabled}
          >
            ➤
          </button>
        </div>
      </section>
    </div>
  );
}