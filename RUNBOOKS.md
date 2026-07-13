# ALAYA INSIDER — Runbooks & Incident Response

> **Target audience**: On-call engineers, DevOps.
> **Last updated**: July 2026

---

## 1. Incident Response Framework

### Severity Levels

| Level | Definition | Response Time | Example |
|-------|-----------|---------------|---------|
| **P0-Critical** | Complete platform outage | 15 minutes | App doesn't load, blank screen |
| **P1-High** | Major feature broken | 1 hour | Checkout broken, admin inaccessible |
| **P2-Medium** | Non-critical feature degraded | 4 hours | Search slow, dashboard widget broken |
| **P3-Low** | Cosmetic issue | 24 hours | CSS glitch, typo in UI |

### Incident Response Flow

```
Detect → Triage → Diagnose → Fix → Verify → Post-mortem
```

---

## 2. Runbooks

### R001: Application Won't Load (Blank Screen)

**Symptoms**: Users see blank/white screen when navigating to the application.

**Triage**:
1. Check if `dist/index.html` is being served correctly (HTTP 200)
2. Check browser console for JavaScript errors
3. Check if CSP is blocking resources

**Fix**:
1. **Static file not served**: Verify CDN/static hosting is pointing to correct `dist/index.html`
2. **Build corrupted**: Redeploy from previous successful build
   ```bash
   npm ci
   npm run build
   # Re-deploy dist/index.html
   ```
3. **CSP blocking resource**: Check `index.html` CSP meta tag — ensure all external URLs are in `img-src`, `font-src`, etc.
4. **Browser compatibility issue**: Verify with latest Chrome, Firefox, Safari

**Verify**: Load app in browser, confirm all routes render.

---

### R002: Build Failure

**Symptoms**: `npm run build` exits with errors.

**Triage**:
```bash
npm run build 2>&1 | tail -30  # See the actual error
npx tsc --noEmit               # Check for type errors first
```

**Common Causes**:
1. **TypeScript error**: Fix type errors, re-run build
2. **Missing dependency**: `npm install` or `npm ci`
3. **Vite plugin error**: Check `vite.config.ts` for misconfiguration
4. **Import resolution failure**: Check file paths in imports

**Fix**:
```bash
# TypeScript errors
npx tsc --noEmit          # Find and fix all errors

# Dependency issues
rm -rf node_modules package-lock.json
npm install

# If all else fails, revert to last known-good commit
git checkout HEAD~1 -- dist/
```

---

### R003: Service Worker Not Registering

**Symptoms**: PWA install prompt doesn't appear, offline features unavailable.

**Triage**:
1. Open `Application → Service Workers` in DevTools
2. Check `console` for SW registration errors
3. Verify `public/service-worker.js` exists and is valid JS

**Common Causes**:
1. **HTTPS required**: Service workers only register on `https://` (or `localhost`)
2. **SW file 404**: Ensure `/service-worker.js` resolves correctly
3. **SW parse error**: Check for syntax errors in service-worker.js

**Fix**:
1. Ensure the deployment uses HTTPS
2. Verify the SW file path matches the registration URL
3. Fix any JS syntax errors in the service worker file

---

### R004: Core Web Vitals Degradation

**Symptoms**: LCP > 2.5s, CLS > 0.1, INP > 200ms.

**Triage**: Check the Performance Dashboard (`/#/admin/performance-dashboard`) for metric breakdown.

**Common Causes**:
1. **Large images**: Hero images too large (target < 200 KB)
2. **Font loading**: Google Fonts blocking render
3. **JavaScript execution**: Long tasks blocking main thread
4. **Layout shifts**: Unstable elements without explicit dimensions

**Fix**:
1. Optimize hero images (compress, use modern formats)
2. Ensure `font-display: swap` on Google Fonts (already configured)
3. Add `width` and `height` attributes to images to prevent CLS
4. Lazy-load below-fold content with IntersectionObserver

---

### R005: PWA Icons 404

**Symptoms**: Manifest icons or apple-touch-icon return 404.

**Triage**: Check browser DevTools `Application → Manifest` for broken icon references.

**Fix**:
```bash
# Regenerate icons
node scripts/generate-icons.mjs
```

Verify files exist at:
- `public/icons/icon-192.svg`
- `public/icons/icon-512.svg`
- `public/icons/icon-192-maskable.svg`
- `public/icons/icon-512-maskable.svg`
- `public/screenshots/home-mobile.svg`
- `public/screenshots/home-desktop.svg`

---

### R006: Authentication Issues

**Symptoms**: Cannot log in to admin panel, sessions expiring prematurely.

**Triage**:
1. Check if localStorage is accessible (not in private/incognito without permission)
2. Clear localStorage and try logging in again
3. Check browser console for errors

**Fix**:
1. **Session expired**: Log in again
2. **localStorage blocked**: Enable third-party cookies/storage
3. **Token rotation issue**: Clear `alaya_admin_session` from localStorage
4. **Corrupt session**: Clear all site data (`Application → Clear storage → Clear site data`)

---

### R007: Slow Search

**Symptoms**: Search results take > 2 seconds to appear.

**Triage**: The search is entirely client-side (no network calls). Check:
1. Product count (more products = slower string matching)
2. Debounce delay (configured at 200ms in `SearchModal.tsx`)

**Fix**:
1. If product count has grown, consider adding a product limit to search results (currently 6)
2. The search is already debounced — if still slow, the filter logic in `SearchModal.tsx` may need optimization
3. Consider adding a simple indexed search (pre-computed search tokens)

---

### R008: Offline Queue Not Syncing

**Symptoms**: Offline actions (cart additions, wishlist changes) not syncing when back online.

**Triage**:
1. Go to **Admin → Synchronization** (`/#/admin/synchronization`)
2. Check the offline queue for pending entries
3. Check sync snapshots for version conflicts

**Fix**:
1. **Manual retry**: Use the "Process Queue" button in the Sync Manager
2. **Conflict resolution**: Review and resolve conflicts manually via the admin UI
3. **Clear stale entries**: Use "Clear Completed" in the offline queue view
4. **Re-enable sync**: Ensure `initMobilePlatform()` is called in `main.tsx`

---

### R009: Theme Toggle Not Working

**Symptoms**: Dark/light mode switch doesn't persist or doesn't change correctly.

**Triage**:
1. Check if `.dark` class is being toggled on `<html>` element
2. Check localStorage `alaya_theme` value
3. Verify the theme initialization script in `index.html` runs before React mounts

**Fix**:
1. **localStorage blocked**: Theme preference won't persist
2. **Initial flash**: The inline script in `index.html` reads `alaya_theme` before React renders
3. **CSS variables**: Verify `.dark` overrides are present in `index.css`

---

### R010: Slow Build Times

**Symptoms**: `npm run build` takes > 30 seconds.

**Triage**:
```
npm run build -- --debug  # Verbose output
```

**Common Causes**:
1. Large assets being inlined (singlefile plugin)
2. Tailwind CSS scanning too many files
3. Slow machine / low memory

**Fix**:
- Ensure `content` paths in Tailwind config are scoped to `src/`
- The build typically takes < 10 seconds on modern hardware
- If > 30 seconds, check for circular dependencies or excessive file scanning

---

### R011: Deployment Rollback

**Procedure**:

```bash
# 1. Revert to previous deployment
# If using versioned builds:
cp dist/releases/index-v0.9.0.html dist/index.html

# If using git tags:
git checkout v0.9.0
npm ci
npm run build
# Redeploy dist/index.html

# 2. Verify the rollback
# Load the application in a browser
# Check admin panel and storefront

# 3. Communicate
# Notify team of rollback and reason
```

---

### R012: Database/Search/AI Failure

Since this is a **client-side only SPA with static data**, these failures **cannot occur** in the traditional sense:

| "Failure" | Reality |
|-----------|---------|
| Database failure | No database — all data is in-memory |
| Search failure | Client-side string matching — no search service |
| AI failure | Simulated AI — no LLM API calls |
| Queue failure | In-memory/localStorage queue — no message broker |
| Cache failure | No external cache — in-memory LRU only |
| Email failure | No SMTP — simulated email delivery |

If these features are connected to real backend services in a future iteration, the relevant runbooks would involve checking API endpoint health, provider status pages, and connection configurations.

---

## 3. Disaster Recovery

### DR1: Complete Data Loss (localStorage cleared)

**Impact**: Users lose cart, wishlist, theme preference, recent searches.

**Recovery**:
- Cart and wishlist are lost (no server-side backup)
- Theme defaults to light mode
- Users must re-authenticate to admin

**Prevention**: In a production deployment with user accounts, sync cart/wishlist to a backend service.

### DR2: Source Code Accidental Deletion

**Recovery**:
```bash
git checkout -- .                  # Restore all files
git reflog                         # Find lost commits
git reset --hard HEAD@{n}          # Recover to specific state
```

---

## 4. Health Checks

The admin panel provides health monitoring at:
- **Observability → Health Checks** (`/#/admin/observability`)
- **System** (`/#/admin/system`) — Background jobs, scheduled tasks

**Automated health check endpoints** (future): When a backend is added:
- `GET /health` — Returns 200 if application is healthy
- `GET /health/ready` — Returns 200 if ready to serve traffic
- `GET /health/live` — Returns 200 if the process is alive
