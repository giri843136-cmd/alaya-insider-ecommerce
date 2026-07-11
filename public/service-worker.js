/* ==========================================================================
 *  ALAYA INSIDER — Service Worker
 *
 *  Provides:
 *    - Offline page caching (App Shell)
 *    - Static asset caching (icons, fonts)
 *    - API response caching with network-first strategy
 *    - Background sync for offline queue
 *    - Push notification handling
 * ========================================================================== */

const CACHE_VERSION = 2;
const STATIC_CACHE = `alaya-static-v${CACHE_VERSION}`;
const ASSET_CACHE = `alaya-assets-v${CACHE_VERSION}`;
const API_CACHE = `alaya-api-v${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/manifest.json",
];

// Assets to cache (images, fonts, etc.)
const ASSET_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".avif", ".svg", ".woff", ".woff2", ".ttf"];

/* ---- Install: pre-cache core assets ---- */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  // Activate immediately — don't wait for previous SW to close
  self.skipWaiting();
});

/* ---- Activate: clean up old caches ---- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== ASSET_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

/* ---- Fetch: serve from cache or network ---- */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and non-HTTP(S) schemes
  if (request.method !== "GET" || !url.protocol.startsWith("http")) return;

  // API requests — network first, fallback to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Asset requests — cache first, network fallback
  if (ASSET_EXTENSIONS.some((ext) => url.pathname.endsWith(ext))) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  // Navigation requests — network first, fallback to cached index
  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(request, STATIC_CACHE).catch(() => {
        return caches.match("/");
      })
    );
    return;
  }

  // Everything else — stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
});

/* ---- Cache strategies ---- */

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Offline fallback
    if (request.mode === "navigate") {
      return caches.match("/");
    }
    return new Response("Offline", { status: 503 });
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

/* ---- Background Sync ---- */
self.addEventListener("sync", (event) => {
  if (event.tag === "alaya-offline-sync") {
    event.waitUntil(processOfflineQueue());
  }
});

async function processOfflineQueue() {
  // Retrieve pending items from IndexedDB / localStorage
  // In production, this would read from the offline queue and
  // attempt to replay each action against the API
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: "SYNC_PROCESSED",
      timestamp: Date.now(),
    });
  });
}

/* ---- Push Notifications ---- */
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const options = {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: data.actions || [],
      tag: data.tag || "alaya-notification",
    };
    event.waitUntil(
      self.registration.showNotification(data.title || "ALAYA INSIDER", options)
    );
  } catch {
    // Silently ignore malformed push data
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      const client = windowClients.find((c) => c.url === url && "focus" in c);
      if (client) {
        client.focus();
      } else if (clients.openWindow) {
        clients.openWindow(url);
      }
    })
  );
});

/* ---- Message handling ---- */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
