# ALAYA INSIDER — Operations Guide

> **Target audience**: DevOps engineers, system administrators.
> **Last updated**: July 2026

---

## 1. Deployment Architecture

The platform is a **client-side single-page application** delivered as a single HTML file. No server-side runtime, no database connections, no API gateways required.

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│   Developer  │────▶│  Vite Build  │────▶│  dist/index.html│
│   (npm run  │     │  (7s, 2.8MB) │     │  (single file) │
│    build)    │     └──────────────┘     └───────┬────────┘
└─────────────┘                                   │
                                                  ▼
                                        ┌──────────────────┐
                                        │   CDN / S3 /     │
                                        │  Static Hosting   │
                                        │  (Cloudflare,     │
                                        │   Vercel, Netlify)│
                                        └──────────────────┘
```

### 1.1 Deployment Options

| Provider | Method | Notes |
|----------|--------|-------|
| **Cloudflare Pages** | Upload `dist/index.html` | Zero config, edge CDN, HTTPS |
| **Vercel** | `vercel --prod` | Automatic preview deploys |
| **Netlify** | Drag-and-drop `dist/` | Easy rollbacks |
| **AWS S3 + CloudFront** | `aws s3 cp dist/ s3://bucket` | Full control |
| **GitHub Pages** | Deploy `dist/` to `gh-pages` branch | Free |
| **Any static server** | Serve `dist/index.html` | Nginx, Apache, Caddy |

### 1.2 Production Build

```bash
npm ci               # Clean install (respects lockfile)
npm run build        # → dist/index.html (single file, ~629 KB gzip)
```

The build output is a single `dist/index.html` containing:
- Inlined JavaScript (all components, lib modules, contexts)
- Inlined CSS (Tailwind output + design tokens + animations)
- SVG icons as data URIs
- No external JS/CSS dependencies at runtime

**External resources loaded at runtime** (not inlined):
- Google Fonts (Inter + Playfair Display) — preconnected
- Pexels images (product/banner photography)

---

## 2. Environment Configuration

**No environment variables required.** All configuration is seeded data in `src/lib/seed.ts` and controlled through the admin panel at runtime.

When deploying, verify:

- [ ] `public/manifest.json` has correct `name`, `short_name`, `description`
- [ ] `public/robots.txt` allows/disallows correct crawler paths
- [ ] `index.html` CSP allows your external image sources
- [ ] Service worker registers without errors

---

## 3. Monitoring

### 3.1 Built-in Metrics

The platform collects Core Web Vitals automatically via `src/lib/mobilePlatform.ts`:

| Metric | What it measures | Source |
|--------|-----------------|--------|
| **LCP** | Largest Contentful Paint | `PerformanceObserver` |
| **CLS** | Cumulative Layout Shift | `PerformanceObserver` |
| **INP** | Interaction to Next Paint | `PerformanceObserver` |
| **FCP** | First Contentful Paint | `performance.getEntriesByType` |
| **TTFB** | Time to First Byte | `performance.getEntriesByType` |

These are displayed in the **PWA Dashboard** (`/#/admin/pwa-dashboard`) and **Performance Dashboard** (`/#/admin/performance-dashboard`).

### 3.2 Admin Observability

The **Observability Platform** (`/#/admin/observability`) provides:
- Structured log viewer with filtering by level/source
- Trace viewer with span waterfall
- Health check dashboard
- Incident management

### 3.3 External Monitoring Recommendations

| Tool | Purpose |
|------|---------|
| **Lighthouse CI** | Performance regression detection |
| **Sentry** | JavaScript error tracking |
| **Cloudflare Web Analytics** | Privacy-first analytics |
| **Pingdom / Checkly** | Uptime monitoring |

---

## 4. Backup & Recovery

### 4.1 Data Storage

All user data is stored **client-side** in:
- `localStorage` — Theme, auth session, cart, wishlist, recent searches
- `IndexedDB` — Offline queue, sync snapshots

**There is no server-side database.** Backups are not required for the static application itself; only the `dist/index.html` build artifact needs to be retained for deployment.

### 4.2 Build Artifact Backup

```bash
# Tag releases for rollback capability
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0

# Keep last N builds for instant rollback
npm run build
cp dist/index.html dist/releases/index-v1.0.0.html
```

### 4.3 Recovery Scenarios

| Scenario | Recovery Steps |
|----------|---------------|
| **Corrupt build** | Revert to previous git tag, rebuild, redeploy |
| **Service worker issue** | Users will get fresh app on next navigation (SW updates on `load`) |
| **Data corruption** | Clear localStorage via browser dev tools or app's reset |
| **Failed deployment** | Revert CDN to previous `dist/index.html` version |

---

## 5. Performance Targets

| Metric | Target | Monitoring |
|--------|--------|-----------|
| LCP | < 1.5s | Performance Dashboard |
| INP | < 100ms | Performance Dashboard |
| CLS | < 0.05 | Performance Dashboard |
| TTFB | < 200ms | Browser DevTools |
| Bundle size | < 3 MB (700 KB gzip) | Build output |
| Build time | < 15s | CI pipeline |

### 5.1 Optimization Techniques Applied

- **React.memo** — Prevents unnecessary re-renders of product cards, hero slider, search modal
- **useCallback / useMemo** — Stable function references, memoized derived data
- **img loading="lazy"** — Below-fold images load lazily
- **IntersectionObserver** — Reveal animations, lazy image loading
- **Preconnect hints** — Google Fonts, Pexels images (in `initResourceHints()`)
- **LRU cache** — In-memory cache for API responses in `performance.ts`
- **CSS animations** — GPU-accelerated via `will-change` and `transform`/`opacity`
- **Debounced search** — 200ms debounce on search input

---

## 6. Service Worker

The service worker (`public/service-worker.js`) implements:

| Strategy | Resources |
|----------|-----------|
| **Cache-first** | App shell, manifest, icons |
| **Network-first** | Navigation requests (falls back to cache) |
| **Stale-while-revalidate** | Images (serves cached, updates in background) |
| **Network-only** | API calls, external resources |

**Cache lifecycle**:
- Versions are managed via `CACHE_NAME` constant in the SW
- On `install`: precaches app shell
- On `activate`: cleans old caches
- On `fetch`: applies strategy based on request type

---

## 7. Scaling Considerations

The platform is **horizontally scalable** by design:
- Stateless: Zero server-side sessions
- Cacheable: Static file CDN-friendly
- No origin server needed: Serve directly from edge

**Limits** (current static data model):
- Products: ~125 seeded products
- Orders: ~50 seeded orders
- Customers: ~50 seeded customers
- AI agents: ~10 seeded agents

**To scale beyond static data**: Replace `src/lib/seed.ts` and context data sources with API calls to a backend service. The component layer is already decoupled from the data layer via context hooks.

---

## 8. Release Checklist

### Pre-Release

- [ ] `npx tsc --noEmit` — zero TypeScript errors
- [ ] `npm run build` — production build succeeds
- [ ] `npm audit` — zero vulnerabilities
- [ ] Build size within acceptable range (< 3 MB)
- [ ] Lighthouse scores verified (Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95)
- [ ] PWA manifest icons exist in `public/icons/`
- [ ] PWA manifest screenshots exist in `public/screenshots/`
- [ ] `robots.txt` present in `public/`

### Release

- [ ] Tag version in git (`git tag vX.Y.Z`)
- [ ] Push to deployment target
- [ ] Verify live URL loads correctly
- [ ] Verify service worker registers
- [ ] Verify admin login works
- [ ] Verify storefront navigation works

### Post-Release

- [ ] Monitor error rates (if Sentry/observability configured)
- [ ] Verify Core Web Vitals via Search Console
- [ ] Verify PWA install prompt works
