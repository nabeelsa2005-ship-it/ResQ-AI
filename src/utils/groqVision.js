// Groq Vision wrapper for emergency-image triage.
// Sends a photo + a structured-output prompt to a vision-capable model and
// parses the JSON response into a known schema. The result tells us which
// offline triage tree to open (or to fall back to AI chat).

const GROQ_KEY = process.env.REACT_APP_GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Llama 3.2 vision-preview was deprecated; Llama 4 Scout is the current
// fast multimodal model on Groq with native image support.
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

// Categories the model is allowed to output. Match the offline triage tree
// IDs where one exists; remaining ones route to AI chat.
export const TRIAGE_CATEGORIES = [
  "heart-attack",
  "choking",
  "severe-bleeding",
  "burns",
  "unconscious",
  "fire",
  "accident",
  "crime",
  "disaster",
  "medical-other",
  "non-emergency",
  "unclear",
];

// Categories that map to an offline triage tree we already author.
const OFFLINE_TRIAGE_FOR = {
  "heart-attack": "heart-attack",
  "choking": "choking",
  "severe-bleeding": "severe-bleeding",
  "burns": "burns",
  "unconscious": "unconscious",
};

export const triageTreeFor = (category) => OFFLINE_TRIAGE_FOR[category] || null;

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(",")[1]);
  r.onerror = reject;
  r.readAsDataURL(file);
});

const tryParseJson = (text) => {
  if (!text) return null;
  // Direct parse first.
  try { return JSON.parse(text); } catch {}
  // Pull out the first {...} block (handles surrounding prose / code fences).
  const m = text.match(/\{[\s\S]*\}/);
  if (m) {
    try { return JSON.parse(m[0]); } catch {}
  }
  return null;
};

// Returns:
// {
//   category, severity, confidence,
//   description, immediateAction, callNumber,
//   raw  // model's raw text for debugging
// }
export const classifyEmergencyImage = async (file, replyLang = "English") => {
  if (!GROQ_KEY) throw new Error("Groq API key missing.");
  const base64 = await fileToBase64(file);
  const mimeType = file.type || "image/jpeg";

  const sys = `You are ResQ AI — emergency triage. The user sent a photo of a possible emergency. You MUST output ONLY a single JSON object, no prose, no markdown, no code fences. The schema:

{
  "category": one of [${TRIAGE_CATEGORIES.map((c) => `"${c}"`).join(", ")}],
  "severity": "critical" | "serious" | "moderate" | "minor",
  "confidence": number between 0 and 1,
  "description": "1 short line describing what you see, in ${replyLang}",
  "immediate_action": "1 short line on the first action to take, in ${replyLang}",
  "call_number": "112" | "102" | "101" | "100" | null
}

Mapping rules for category:
- Crushing chest pain, person clutching chest, sweating → "heart-attack"
- Hands at throat, blue lips, can't breathe → "choking"
- Visible blood, deep cut, gunshot, stab → "severe-bleeding"
- Burned skin, fire on body, scald → "burns"
- Person collapsed, eyes closed, no movement → "unconscious"
- Active fire, smoke, building burning → "fire"
- Crashed vehicle, road accident → "accident"
- Crime / assault scene → "crime"
- Flood, earthquake, building collapse → "disaster"
- Other medical issue not above → "medical-other"
- Picture is clearly NOT an emergency (food, pet, view) → "non-emergency"
- Image too blurry / can't tell → "unclear" (set confidence < 0.5)

ONLY output the JSON object. Nothing else.`;

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      max_tokens: 400,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: sys },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    let detail = res.statusText;
    try { const e = await res.json(); detail = e.error?.message || detail; } catch {}
    throw new Error(`Vision API failed: ${detail}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  const parsed = tryParseJson(text);
  if (!parsed || !parsed.category) {
    return {
      category: "unclear",
      severity: "moderate",
      confidence: 0.3,
      description: text || "Couldn't classify the image.",
      immediateAction: "Describe what you see and call emergency services.",
      callNumber: "112",
      raw: text,
    };
  }

  // Coerce + validate.
  const category = TRIAGE_CATEGORIES.includes(parsed.category) ? parsed.category : "unclear";
  return {
    category,
    severity: parsed.severity || "serious",
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
    description: parsed.description || parsed.what_you_see || "",
    immediateAction: parsed.immediate_action || "",
    callNumber: parsed.call_number || null,
    raw: text,
  };
};
