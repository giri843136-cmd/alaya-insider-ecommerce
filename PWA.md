# ALAYA INSIDER — PWA & Offline Guide

> **Target audience**: Developers, QA engineers.
> **Last updated**: July 2026

---

## 1. PWA Architecture

The platform is a fully-functional Progressive Web App with offline capabilities, install prompts, and performance monitoring.

```
┌─────────────────────────────────────────────────┐
│                    PWA Stack                      │
├───────────────────┬─────────────────────────────┤
│   Manifest        │   Service Worker             │
│   (installable,   │   (offline caching,           │
│    splash screen, │    push notifications)        │
│    shortcuts)     │                              │
├───────────────────┼─────────────────────────────┤
│   Offline Queue   │   Sync Manager               │
│   (localStorage   │   (IndexedDB snapshots,       │
│    + IndexedDB)   │    versioning, conflict)      │
├───────────────────┴─────────────────────────────┤
│              Performance Monitoring               │
│        (LCP, CLS, INP, FCP, TTFB via API)        │
└─────────────────────────────────────────────────┘
```

---

## 2. Web App Manifest

Located at `public/manifest.json`:

```json
{
  "name": "ALAYA INSIDER",
  "short_name": "ALAYA",
  "display": "standalone",
  "display_override": ["window-controls-overlay", "standalone", "browser"],
  "icons": [
    { "src": "/icons/icon-192.svg", "sizes": "192x192", "type": "image/svg+xml" },
    { "src": "/icons/icon-512.svg", "sizes": "512x512", "type": "image/svg+xml" },
    { "src": "/icons/icon-192-maskable.svg", "sizes": "192x192", "type": "image/svg+xml", "purpose": "maskable" },
    { "src": "/icons/icon-512-maskable.svg", "sizes": "512x512", "type": "image/svg+xml", "purpose": "maskable" }
  ],
  "screenshots": [
    { "src": "/screenshots/home-mobile.svg", "sizes": "390x844", "form_factor": "narrow" },
    { "src": "/screenshots/home-desktop.svg", "sizes": "1280x800", "form_factor": "wide" }
  ]
}
```

### Shortcuts

The manifest includes 4 app shortcuts (long-press on the app icon):
- **Shop** → `/shop`
- **Cart** → `/cart`
- **Wishlist** → `/wishlist`
- **Account** → `/account`

### iOS Support

- `apple-touch-icon`: Home screen icon (SVG)
- `apple-mobile-web-app-capable`: Enables standalone mode
- `apple-mobile-web-app-status-bar-style`: Transparent status bar
- `apple-touch-startup-image`: Launch screen

---

## 3. Service Worker

Located at `public/service-worker.js`.

### Caching Strategies

| Strategy | Resources | Behavior |
|----------|-----------|----------|
| **Cache-first** | App shell, manifest, icons, screenshots | Serve from cache immediately; only fetch if missing |
| **Network-first** | Navigation requests, API responses | Try network first; fall back to cache on timeout/failure |
| **Stale-while-revalidate** | Images | Serve from cache; fetch update in background |

### Lifecycle

1. **install**: Precaches app shell and static assets
2. **activate**: Cleans old cache versions
3. **fetch**: Intercepts requests and applies caching strategy

### Cache Versioning

Caches are versioned via a `CACHE_NAME` constant in the SW file. When the SW updates:
1. New SW installs with updated `CACHE_NAME`
2. On activate, old caches are deleted
3. Users get fresh content on next navigation

---

## 4. Offline Queue

When the user is offline, actions are queued for later sync.

### Queue Operations

| Action | Type | Retry |
|--------|------|-------|
| Add to cart | Offline cart mutation | 3 retries |
| Wishlist toggle | Offline wishlist mutation | 3 retries |
| Compare toggle | Offline compare mutation | 3 retries |
| Contact form | Offline form submission | 3 retries |

### Queue Storage

- **Primary**: localStorage (`alaya_offline_queue`)
- **IndexedDB**: For larger payloads and sync snapshots

### Processing

The queue is processed:
1. Automatically on `online` event
2. Manually via the **Synchronization** admin page (`/#/admin/synchronization`)
3. On app startup if items are pending

---

## 5. Sync Manager

The sync manager handles cross-device synchronization.

### Sync Snapshots

Snapshots capture the current state of:
- Cart
- Wishlist
- Compare list
- Recent searches
- Settings preferences

Each snapshot has:
- **Version number** (incremented on each change)
- **Timestamp** of last modification
- **Device ID** that created it

### Conflict Resolution

| Strategy | Behavior |
|----------|----------|
| **Last-write-wins** | Most recent timestamp takes precedence |
| **Manual merge** | Admin reviews conflicting changes |
| **Version-based** | Higher version number wins |

---

## 6. Performance Monitoring

### Core Web Vitals

Automatically collected via `PerformanceObserver` in `src/lib/mobilePlatform.ts`:

```typescript
interface MetricVital {
  name: "LCP" | "CLS" | "INP" | "FCP" | "TTFB";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  timestamp: number;
}
```

### Performance Reports

Generated from collected vital metrics:
- **Score**: 0–100 overall performance score
- **Device optimization**: Tailored recommendations by device category
- **Historical trends**: Performance over time

### Viewing Metrics

- **PWA Dashboard** (`/#/admin/pwa-dashboard`): SW status, install analytics, Core Web Vitals
- **Performance Dashboard** (`/#/admin/performance-dashboard`): Full performance breakdown with gauges

---

## 7. Mobile Features

### Device Detection

```typescript
const device = getDeviceInfo();
// {
//   category: "mobile" | "tablet" | "desktop" | "foldable" | "large" | "tv",
//   screenWidth: 390,
//   screenHeight: 844,
//   pixelRatio: 3,
//   os: "iOS",
//   browser: "Safari",
//   battery: 0.85,        // (if available)
//   memory: 8,             // (if available)
//   cores: 6,              // (if available)
// }
```

### Voice Search

Web Speech API-based voice search:
- Triggered from the search modal (microphone icon)
- Transcribes speech to text
- Auto-searches on result
- Graceful fallback if SpeechRecognition is unsupported

### Gesture Support

- **SwipeContainer**: Custom swipe gesture handler for mobile navigation
- **HorizontalScroller**: Touch-friendly horizontal scroll with momentum

### Virtual Lists

- **VirtualList**: Windowed list rendering for performance
- **VirtualGrid**: Windowed grid rendering for product grids
- Optimized for low-end devices with IntersectionObserver

---

## 8. Generating PWA Assets

```bash
node scripts/generate-icons.mjs
```

This generates:
- `public/icons/icon-192.svg` (192×192, any purpose)
- `public/icons/icon-512.svg` (512×512, any purpose)
- `public/icons/icon-192-maskable.svg` (192×192, maskable)
- `public/icons/icon-512-maskable.svg` (512×512, maskable)
- `public/icons/shop-icon.svg` (96×96, shortcut)
- `public/icons/cart-icon.svg` (96×96, shortcut)
- `public/screenshots/home-mobile.svg` (390×844, narrow)
- `public/screenshots/home-desktop.svg` (1280×800, wide)

**Important**: These are placeholder SVGs. Replace with production-branded assets before launch.
