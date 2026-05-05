// Cross-browser wrappers around Web Speech APIs.
// Speech-to-text (recognition) is Chrome/Android only — Safari & iOS have no
// support. Text-to-speech (synthesis) works everywhere modern.

// ── Voice loader ──────────────────────────────────────────────────────────
// Chrome on Android often returns [] from getVoices() on the first call. We
// resolve as soon as voices are available, fall back to whatever we have
// after a 1 s timeout.
let voicesPromise = null;
export const getVoices = () => {
  if (typeof window === "undefined" || !window.speechSynthesis) return Promise.resolve([]);
  if (voicesPromise) return voicesPromise;
  voicesPromise = new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const ready = synth.getVoices();
    if (ready && ready.length) return resolve(ready);
    let done = false;
    const handler = () => {
      if (done) return;
      done = true;
      resolve(synth.getVoices() || []);
    };
    synth.addEventListener("voiceschanged", handler, { once: true });
    setTimeout(() => {
      if (done) return;
      done = true;
      resolve(synth.getVoices() || []);
    }, 1500);
  });
  return voicesPromise;
};

// Best-match voice for a BCP-47 locale (e.g. "hi-IN", "en-US"). Falls back
// to language-only match (en, hi) and finally null.
export const findVoice = async (lang) => {
  const voices = await getVoices();
  if (!voices.length) return null;
  const lower = lang.toLowerCase();
  const langCode = lower.split("-")[0];
  return (
    voices.find((v) => v.lang.toLowerCase() === lower) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(langCode)) ||
    null
  );
};

// ── STT environment check ────────────────────────────────────────────────
export const sttSupport = () => {
  if (typeof window === "undefined") return { supported: false, reason: "ssr" };
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return { supported: false, reason: "unsupported" };
  // Mic requires a secure context (HTTPS or localhost).
  if (window.isSecureContext === false) return { supported: false, reason: "insecure" };
  return { supported: true, SR };
};

export const sttErrorMessage = (reason, primaryLang = "English") => {
  const messages = {
    English: {
      unsupported: "Voice input isn't available in this browser. Use Chrome on Android or desktop.",
      insecure: "Voice input requires HTTPS. Reload via https:// or use the desktop dev server.",
      "not-allowed": "Microphone access was denied. Allow it in your browser settings and try again.",
      "no-speech": "I didn't hear anything. Try again and speak clearly.",
      "audio-capture": "No microphone found. Plug one in or use a phone.",
      network: "Voice recognition needs internet. Connection failed.",
      aborted: "Voice input cancelled.",
      generic: "Voice input failed. Please type instead.",
    },
    Hindi: {
      unsupported: "इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है। Android पर Chrome आज़माएं।",
      insecure: "वॉइस इनपुट के लिए HTTPS चाहिए।",
      "not-allowed": "माइक्रोफोन की अनुमति नहीं दी गई। कृपया ब्राउज़र सेटिंग्स में अनुमति दें।",
      "no-speech": "कुछ सुनाई नहीं दिया। फिर से कोशिश करें।",
      "audio-capture": "माइक्रोफोन नहीं मिला।",
      network: "वॉइस के लिए इंटरनेट चाहिए।",
      aborted: "वॉइस इनपुट रद्द।",
      generic: "वॉइस इनपुट विफल। कृपया टाइप करें।",
    },
  };
  const dict = messages[primaryLang] || messages.English;
  return dict[reason] || dict.generic;
};

// ── STT: one-shot listen ─────────────────────────────────────────────────
// Wraps SpeechRecognition with a Promise. Requests mic permission first so
// the user sees the OS prompt before recognition fires.
export const listenOnce = async ({ lang = "en-US", onStart, onEnd } = {}) => {
  const { supported, SR, reason } = sttSupport();
  if (!supported) {
    const err = new Error(reason || "unsupported");
    err.code = reason || "unsupported";
    throw err;
  }
  // Pre-flight: request mic permission so denial happens before recognition starts.
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop()); // we just wanted the prompt
    } catch (err) {
      const code =
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError" ? "not-allowed"
        : err.name === "NotFoundError" ? "audio-capture"
        : "generic";
      const e = new Error(code);
      e.code = code;
      throw e;
    }
  }
  return new Promise((resolve, reject) => {
    const r = new SR();
    r.lang = lang;
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.continuous = false;
    let resolved = false;

    r.onstart = () => onStart && onStart();
    r.onresult = (e) => {
      resolved = true;
      const transcript = e.results[0][0].transcript;
      resolve(transcript);
    };
    r.onerror = (e) => {
      if (resolved) return;
      resolved = true;
      const code = e.error || "generic";
      const err = new Error(code);
      err.code = code;
      reject(err);
    };
    r.onend = () => {
      onEnd && onEnd();
      if (!resolved) {
        resolved = true;
        const err = new Error("no-speech");
        err.code = "no-speech";
        reject(err);
      }
    };

    try {
      r.start();
    } catch (err) {
      const e = new Error("generic");
      e.code = "generic";
      reject(e);
    }
  });
};

// ── TTS: speak with best voice for locale ─────────────────────────────────
export const speak = async (text, { lang = "en-US", rate = 0.95, pitch = 1, onStart, onEnd, onError } = {}) => {
  if (!window.speechSynthesis || !text) return null;
  // Cancel any running utterance first.
  window.speechSynthesis.cancel();

  const voice = await findVoice(lang);
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = rate;
  utter.pitch = pitch;
  utter.volume = 1;
  if (voice) utter.voice = voice;

  utter.onstart = () => onStart && onStart();
  utter.onend = () => onEnd && onEnd();
  utter.onerror = (e) => onError && onError(e);

  // Some Chrome builds need a tiny delay after .cancel() before .speak().
  setTimeout(() => window.speechSynthesis.speak(utter), 50);
  return utter;
};

export const stopSpeaking = () => {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
};
