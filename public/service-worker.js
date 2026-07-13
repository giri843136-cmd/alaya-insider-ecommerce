// ALAYA INSIDER — Service Worker v2.0.0
// Enterprise PWA with offline support, background sync, and smart caching

const CACHE_NAME = "alaya-cache-v2";
const STATIC_CACHE = "alaya-static-v2";
const IMAGE_CACHE = "alaya-images-v2";
const API_CACHE = "alaya-api-v2";
const FONT_CACHE = "alaya-fonts-v2";

const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
  "/icons/icon-192-maskable.svg",
  "/icons/icon-512-maskable.svg",
  "/offline.html",
];

// Cache-first strategies for different resource types
const STRATEGIES = {
  // Cache-first for static assets (JS, CSS, fonts, icons)
  static: [
    /\.(js|css)$/,
    /\.(svg|png|jpg|jpeg|gif|ico|webp|avif)$/,
    /\/icons\//,
    /\/fonts\//,
  ],
  // Stale-while-revalidate for API calls
  api: [/\/api\/v1\//],
  // Network-first for navigation
  navigation: [/\/$/],
};

// --- INSTALL ---
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(STATIC_ASSETS);
      // Prefetch critical API data
      try {
        const apiCache = await caches.open(API_CACHE);
        const prefetchUrls = [
          "/api/v1/search/filters",
          "/api/v1/search/recommendations/trending?limit=8",
        ];
        await Promise.allSettled(
          prefetchUrls.map(async (url) => {
            try {
              const res = await fetch(url);
              if (res.ok) apiCache.put(url, res);
            } catch { /* offline — skip prefetch */ }
          })
        );
      } catch { /* skip */ }
    })()
  );
  self.skipWaiting();
});

// --- ACTIVATE ---
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Clean old caches
      const cacheKeys = await caches.keys();
      const validCaches = [CACHE_NAME, STATIC_CACHE, IMAGE_CACHE, API_CACHE, FONT_CACHE];
      await Promise.all(
        cacheKeys
          .filter((key) => !validCaches.includes(key))
          .map((key) => caches.delete(key))
      );
      // Take control of all clients
      await self.clients.claim();
    })()
  );
});

// --- FETCH — Smart caching strategy ---
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // --- Static assets: Cache-first ---
  if (STRATEGIES.static.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // --- API calls: Stale-while-revalidate ---
  if (STRATEGIES.api.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // --- Navigation: Network-first with offline fallback ---
  if (request.mode === "navigate" || STRATEGIES.navigation.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  // Default: Network-first
  event.respondWith(networkFirst(request));
});

// --- Cache strategies ---

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
    return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
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
    .catch(() => cached || new Response(JSON.stringify({ error: "Offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    }));

  return cached || fetchPromise;
}

async function networkFirst(request, fallbackCacheName) {
  try {
    const response = await fetch(request);
    if (response.ok && fallbackCacheName) {
      const cache = await caches.open(fallbackCacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Return offline page for navigations
    if (request.mode === "navigate") {
      const offlinePage = await caches.match("/offline.html");
      if (offlinePage) return offlinePage;
    }
    return new Response("Offline", { status: 503 });
  }
}

// --- BACKGROUND SYNC ---
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-search") {
    event.waitUntil(syncSearchQueue());
  }
  if (event.tag === "sync-analytics") {
    event.waitUntil(syncAnalyticsQueue());
  }
});

async function syncSearchQueue() {
  try {
    const cache = await caches.open("alaya-queue");
    const requests = await cache.keys();
    await Promise.allSettled(
      requests.map(async (request) => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            await cache.delete(request);
          }
        } catch { /* retry later */ }
      })
    );
  } catch { /* skip */ }
}

async function syncAnalyticsQueue() {
  // Queue analytics events for retry when online
  try {
    const cache = await caches.open("alaya-analytics-queue");
    const requests = await cache.keys();
    await Promise.allSettled(
      requests.map(async (request) => {
        try {
          await fetch(request);
          await cache.delete(request);
        } catch { /* will retry on next sync */ }
      })
    );
  } catch { /* skip */ }
}

// --- PUSH NOTIFICATIONS ---
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const title = data.title || "ALAYA INSIDER";
  const options = {
    body: data.body || "New update available",
    icon: "/icons/icon-192.svg",
    badge: "/icons/icon-192-maskable.svg",
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      const matching = windowClients.find((c) => c.url === url);
      if (matching) {
        matching.focus();
      } else {
        clients.openWindow(url);
      }
    })
  );
});

// --- MESSAGE HANDLING ---
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data?.type === "CLEAR_CACHE") {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
  if (event.data?.type === "CACHE_STATS") {
    caches.keys().then(async (keys) => {
      const stats = {};
      for (const key of keys) {
        const cache = await caches.open(key);
        const requests = await cache.keys();
        stats[key] = requests.length;
      }
      event.source?.postMessage({ type: "CACHE_STATS_RESULT", stats });
    });
  }
});
