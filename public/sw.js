// Service worker do N8N Agentic Academy.
// Estratégia network-first com fallback ao cache: online sempre serve a
// versão fresca; offline devolve a última versão visitada.
const CACHE = "n8n-academy-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches
            .open(CACHE)
            .then((c) => c.put(req, copy))
            .catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then(
          (hit) =>
            hit ||
            // navegação offline sem cache: volta para a raiz do app
            (req.mode === "navigate"
              ? caches.match(self.registration.scope)
              : undefined)
        )
      )
  );
});
