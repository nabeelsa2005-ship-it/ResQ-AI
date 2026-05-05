/* ResQ AI service worker — offline-first for app shell, network-only for
   APIs and any cross-origin asset. Bumped cache name to force a refresh. */
const CACHE_NAME = "resq-ai-v3";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Hosts we should never intercept — let the browser handle them directly.
// Includes anything containing "rapidapi" so all paid API calls (YouTube,
// places, etc.) bypass the SW entirely. Anything that's likely to need
// CORS / auth headers / 4xx-5xx error surfacing belongs here.
const EXTERNAL_HOSTS = [
  "groq.com",
  "googleapis.com",
  "openai",
  "rapidapi.com",
  "router.project-osrm.org",
  "overpass-api.de",
  "openstreetmap.org",
  "tile.openstreetmap.org",
  "arcgisonline.com",
  "ytimg.com",
  "youtube.com",
  "youtube-nocookie.com",
  "ytstatic.l.google.com",
];

const isExternal = (url) => EXTERNAL_HOSTS.some((h) => url.hostname.includes(h));

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch { return; }

  // Cross-origin / API / map-tile requests — let the browser handle them.
  // We don't call event.respondWith(), so the default network handler runs.
  if (url.origin !== self.location.origin) return;
  if (isExternal(url)) return;

  // SPA navigation — network-first with offline fallback to the cached
  // index. Always resolve with a valid Response.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          try {
            const copy = res.clone();
            const cache = await caches.open(CACHE_NAME);
            await cache.put("/index.html", copy);
          } catch {}
          return res;
        } catch {
          const cached =
            (await caches.match("/index.html")) ||
            (await caches.match("/")) ||
            (await caches.match(req));
          if (cached) return cached;
          return new Response(
            "<h1>Offline</h1><p>This page hasn't been cached yet. Reconnect and reload.</p>",
            { status: 200, headers: { "Content-Type": "text/html" } }
          );
        }
      })()
    );
    return;
  }

  // Same-origin static assets — cache-first, network fallback. Never
  // resolve to undefined.
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && res.status === 200 && res.type !== "opaque") {
          try {
            const copy = res.clone();
            const cache = await caches.open(CACHE_NAME);
            await cache.put(req, copy);
          } catch {}
        }
        return res;
      } catch (err) {
        return new Response("", { status: 504, statusText: "Offline" });
      }
    })()
  );
});
