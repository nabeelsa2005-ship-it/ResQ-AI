// Compress a (multilingual, possibly long, possibly noisy) user message +
// AI reply into a focused English YouTube search query for a first-aid
// tutorial video. Without this step, raw user messages like "मेरे बेटे को
// खांसी हो रही है क्या करूं" go straight to YouTube and return generic noise.

const GROQ_KEY = process.env.REACT_APP_GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

const cache = new Map();
const cacheKey = (userMsg, aiReply) =>
  `${(userMsg || "").slice(0, 120)}::${(aiReply || "").slice(0, 200)}`;

// Heuristic fallback when AI is unavailable — keeps top tokens that aren't
// stop words and appends a tutorial qualifier.
const heuristicFallback = (userMsg) => {
  const stop = new Set([
    "the","a","an","is","are","was","were","be","been","being","do","does","did",
    "have","has","had","i","my","me","you","your","we","our","us","they","them",
    "what","when","where","how","why","who","which","this","that","these","those",
    "to","of","in","on","at","for","with","without","please","help","tell","need",
    "and","or","but","if","not","no","yes","mai","mein","kya","karu","kaise","hai",
    "raha","gaya","hota","hoti","kar","ho","ka","ki","ke","ko","se","par","tha",
  ]);
  const tokens = (userMsg || "")
    .toLowerCase()
    .replace(/[^a-zऀ-ॿಀ-೿஀-௿ఀ-౿ঀ-৿ഀ-ൿ઀-૿਀-੿\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stop.has(t));
  const top = tokens.slice(0, 5).join(" ");
  return (top ? top + " " : "") + "first aid demonstration tutorial";
};

// Returns a short English search query (3–7 words) suitable for YouTube.
export const extractVideoQuery = async (userMessage, aiReply) => {
  const safeUser = (userMessage || "").trim();
  if (!safeUser) return null;
  const k = cacheKey(safeUser, aiReply);
  if (cache.has(k)) return cache.get(k);

  if (!GROQ_KEY) {
    const q = heuristicFallback(safeUser);
    cache.set(k, q);
    return q;
  }

  const sys = `You compress an emergency conversation into a focused YouTube search query for a FIRST AID DEMONSTRATION VIDEO.

Rules — follow ALL:
- Output ONLY the search query, no quotes, no prefix, no explanation.
- ALWAYS in English (translate non-English content).
- 3 to 7 words total.
- Identify the SPECIFIC medical situation (e.g. "child choking", "adult heart attack", "second-degree burn arm").
- ALWAYS include the words "first aid" OR "demonstration" OR "how to".
- If unclear, default to "general first aid demonstration".
- Do NOT include filler like "video", "youtube", "please", "help".
- Do NOT include the patient's name or pronouns.

Examples:
User: "मेरे बेटे को बहुत खांसी हो रही है, सांस नहीं ले पा रहा"
Query: child choking Heimlich maneuver demonstration

User: "I burnt my hand with hot oil"
Query: hot oil burn first aid demonstration

User: "what to do for chest pain"
Query: chest pain heart attack first aid

User: "snake bit my dad"
Query: snake bite first aid demonstration`;

  const userBlob = aiReply
    ? `User asked: ${safeUser}\n\nAI replied (truncated): ${aiReply.slice(0, 280)}`
    : `User asked: ${safeUser}`;

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 30,
        temperature: 0.1,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userBlob },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
    const data = await res.json();
    let q = (data.choices?.[0]?.message?.content || "")
      .trim()
      .replace(/^["'`]+|["'`]+$/g, "")
      .replace(/^(query|search):?\s*/i, "")
      .split("\n")[0]
      .trim();
    const wc = q.split(/\s+/).filter(Boolean).length;
    if (!q || wc < 2 || wc > 12) {
      q = heuristicFallback(safeUser);
    }
    cache.set(k, q);
    return q;
  } catch (err) {
    console.warn("Video-query extraction failed, using heuristic:", err);
    const q = heuristicFallback(safeUser);
    cache.set(k, q);
    return q;
  }
};
