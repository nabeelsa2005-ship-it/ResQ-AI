// Groq audio transcription wrapper.
// Uses whisper-large-v3-turbo — fastest Whisper variant on Groq, ~10x realtime.
// Bypasses browser SpeechRecognition entirely so this works on iOS Safari,
// Firefox, and any browser with MediaRecorder support.

const GROQ_KEY = process.env.REACT_APP_GROQ_API_KEY || "";
const GROQ_AUDIO_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

// Map app-level language names → Whisper ISO 639-1 codes.
// Whisper handles auto-detection well, but explicit hint reduces transcription
// errors for short utterances (e.g. "112" gets garbled without lang hint).
const WHISPER_LANG = {
  English: "en",
  Hindi: "hi",
  Kannada: "kn",
  Marathi: "mr",
  Bengali: "bn",
  Tamil: "ta",
  Telugu: "te",
  Gujarati: "gu",
  Punjabi: "pa",
  Malayalam: "ml",
  Urdu: "ur",
  // Whisper has no Odia support; we omit it and let Whisper auto-detect.
  Spanish: "es",
  French: "fr",
  German: "de",
  Chinese: "zh",
  Arabic: "ar",
  Portuguese: "pt",
};

export const transcribeAudio = async (blob, primaryLang = "English") => {
  if (!GROQ_KEY) {
    throw new Error("Groq API key missing — set REACT_APP_GROQ_API_KEY in .env.local");
  }
  const form = new FormData();
  // The endpoint expects a `file` field. Whisper accepts wav/mp3/m4a/ogg/webm/flac.
  // Most browsers record `audio/webm;codecs=opus` which Whisper handles.
  const filename = `voice.${(blob.type || "audio/webm").split("/")[1]?.split(";")[0] || "webm"}`;
  form.append("file", blob, filename);
  form.append("model", "whisper-large-v3-turbo");
  form.append("response_format", "json");
  // temperature=0 → deterministic. 0 also disables Whisper's hallucination-prone fallback.
  form.append("temperature", "0");
  // Optional language hint — speeds up + improves accuracy for short clips.
  const hint = WHISPER_LANG[primaryLang];
  if (hint) form.append("language", hint);

  const res = await fetch(GROQ_AUDIO_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_KEY}` },
    body: form,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try { const e = await res.json(); detail = e.error?.message || detail; } catch {}
    throw new Error(`Transcription failed: ${detail}`);
  }
  const data = await res.json();
  return (data.text || "").trim();
};
