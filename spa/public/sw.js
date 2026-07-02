const CACHE_NAME = "roadmuse-shell-v1";
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-72.png",
  "./icons/icon-96.png",
  "./icons/icon-128.png",
  "./icons/icon-144.png",
  "./icons/icon-152.png",
  "./icons/icon-256.png",
  "./icons/icon-384.png",
];

const STATIC_EXTENSIONS = [
  ".js",
  ".css",
  ".png",
  ".svg",
  ".jpg",
  ".jpeg",
  ".webp",
  ".woff",
  ".woff2",
  ".ttf",
  ".webmanifest",
];

const isApiRequest = (request) => request.url.includes("/api/");
const isStaticAsset = (url) => STATIC_EXTENSIONS.some((ext) => url.endsWith(ext));

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return undefined;
        }),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isApiRequest(request)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("./index.html")).then(
        (response) => response || new Response("Offline", { status: 503 }),
      ),
    );
    return;
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) {
            return cached;
          }

          return fetch(request).then((response) => {
            cache.put(request, response.clone());
            return response;
          });
        }),
      ),
    );
    return;
  }

  event.respondWith(fetch(request));
});
