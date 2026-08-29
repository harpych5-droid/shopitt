// Do not cache the Vite application shell or its generated chunks here.
// A deployment changes hashed chunk filenames; caching index.html can then make
// an installed PWA request chunks that no longer exist.
const CACHE_NAME = "shopitt-static-v2";
const INSTALL_ASSETS = ["/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(INSTALL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.url.startsWith("chrome-extension:")) return;

  // Navigations and generated JS/CSS always go to the network. The browser can
  // still cache content-addressed Vite assets through normal HTTP caching, but
  // it cannot be pinned to an obsolete application shell by Cache Storage.
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.mode === "navigate") return;

  if (INSTALL_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
  }
});
