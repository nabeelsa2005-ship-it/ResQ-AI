// YouTube search via RapidAPI. Defaults to youtube-v2 (host
// youtube-v2.p.rapidapi.com) but the parser is shape-tolerant — it also
// handles youtube-v31's Google-API-mirror response format if you swap the
// host via REACT_APP_RAPIDAPI_HOST.
//
// To enable, set in .env.local:
//   REACT_APP_RAPIDAPI_KEY=<your-key-from-rapidapi.com>
//   REACT_APP_RAPIDAPI_HOST=youtube-v2.p.rapidapi.com   (optional)

const RAPID_KEY = process.env.REACT_APP_RAPIDAPI_KEY || "";
const RAPID_HOST = process.env.REACT_APP_RAPIDAPI_HOST || "youtube-v2.p.rapidapi.com";

export const isYouTubeConfigured = () => Boolean(RAPID_KEY);

const cache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;
const cacheKey = (q, n) => `${RAPID_HOST}::${q.toLowerCase().trim()}::${n}`;

// Build the search URL. Each provider has slightly different param names —
// pick by host so we don't 400 on a wrong key.
const buildSearchUrl = (host, query, max) => {
  if (host.startsWith("youtube-v2")) {
    // youtube-v2 (ytjar): /search/?query=...   (trailing slash matters!)
    return `https://${host}/search/?query=${encodeURIComponent(query)}`;
  }
  if (host.startsWith("youtube-v31")) {
    // youtube-v31 (ytjar): /search?part=snippet&type=video&maxResults=N&q=...
    return `https://${host}/search?part=snippet&type=video&maxResults=${max}&q=${encodeURIComponent(query)}`;
  }
  // Generic fallback: try both common query keys joined.
  return `https://${host}/search?query=${encodeURIComponent(query)}&q=${encodeURIComponent(query)}`;
};

// Pick a sensible thumbnail from any of the known response shapes.
const pickThumbnail = (it, id) => {
  // Direct string
  if (typeof it.thumbnail === "string") return it.thumbnail;
  // Array of {url,width,height} (youtube-v2)
  if (Array.isArray(it.thumbnails) && it.thumbnails.length) {
    // Prefer mid-size (~320 wide) if multiple are available.
    const sorted = [...it.thumbnails].sort((a, b) => (a.width || 0) - (b.width || 0));
    return sorted[Math.min(1, sorted.length - 1)]?.url || sorted[0]?.url;
  }
  // Object map (youtube-v31 / Google API)
  if (it.thumbnails && typeof it.thumbnails === "object") {
    return it.thumbnails.medium?.url || it.thumbnails.high?.url || it.thumbnails.default?.url;
  }
  // Nested under snippet (youtube-v31)
  if (it.snippet?.thumbnails) {
    const t = it.snippet.thumbnails;
    return t.medium?.url || t.high?.url || t.default?.url;
  }
  // Last resort: standard ytimg URL pattern.
  return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : null;
};

const normalizeItem = (it) => {
  if (!it || typeof it !== "object") return null;
  const id =
    it.video_id ||
    it.videoId ||
    it.id?.videoId ||
    (typeof it.id === "string" ? it.id : null);
  if (!id) return null;

  const title = it.title || it.snippet?.title || "Video";
  // youtube-v2 returns `author` as a plain string; youtube-v31 puts it under
  // snippet.channelTitle; some others use channel_name.
  const channel =
    (typeof it.author === "string" ? it.author : null) ||
    it.channel_name ||
    it.author?.title ||
    it.author?.name ||
    it.snippet?.channelTitle ||
    it.uploader?.name ||
    "";
  const thumbnail = pickThumbnail(it, id);
  const description =
    it.description ||
    it.descriptionSnippet?.text ||
    it.snippet?.description ||
    "";
  const publishedAt =
    it.published_time ||
    it.publishedTimeText ||
    it.snippet?.publishedAt ||
    "";

  return { id, title, channel, thumbnail, description, publishedAt };
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 502/503/504 from RapidAPI's gateway are transient — the upstream YouTube
// scraper hiccups. Retry once with a short backoff.
const fetchWithRetry = async (url, init, maxAttempts = 2) => {
  let lastErr;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok) return res;
      // Retry only on transient gateway errors.
      if ([502, 503, 504, 429].includes(res.status) && attempt < maxAttempts - 1) {
        await sleep(700 * (attempt + 1));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts - 1) {
        await sleep(700 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  if (lastErr) throw lastErr;
  return null;
};

// Returns: [{ id, title, channel, thumbnail, publishedAt, description }]
export const searchVideos = async (query, maxResults = 6) => {
  if (!query || !query.trim()) return [];
  if (!RAPID_KEY) {
    throw new Error("RapidAPI key missing. Add REACT_APP_RAPIDAPI_KEY to .env.local.");
  }
  const k = cacheKey(query, maxResults);
  const hit = cache.get(k);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;

  const url = buildSearchUrl(RAPID_HOST, query, maxResults);
  const res = await fetchWithRetry(url, {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": RAPID_KEY,
      "X-RapidAPI-Host": RAPID_HOST,
    },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try { const e = await res.json(); detail = e.message || e.error || detail; } catch {}
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error(`YouTube provider is temporarily unavailable (${res.status}). Try again in a moment.`);
    }
    throw new Error(`YouTube search failed (${res.status}): ${detail}`);
  }
  const data = await res.json();
  // Different providers use different envelope keys; normalize.
  const rawItems =
    data.videos ||
    data.items ||
    data.data ||
    data.contents ||
    data.results ||
    [];
  const items = rawItems
    .map(normalizeItem)
    .filter(Boolean)
    .slice(0, maxResults);

  cache.set(k, { at: Date.now(), data: items });
  return items;
};

// Privacy-enhanced embed URL — autoplay + modest branding + don't show
// suggestions from other channels at the end.
export const embedUrl = (videoId, { autoplay = false } = {}) =>
  `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1${autoplay ? "&autoplay=1" : ""}`;

// Plain link to YouTube — used as a fallback "Open on YouTube" affordance.
export const watchUrl = (videoId) => `https://www.youtube.com/watch?v=${videoId}`;
