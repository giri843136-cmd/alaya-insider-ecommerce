# ALAYA INSIDER — Deployment Checklist v2.0.0

> **Last updated**: 2026-07-10
> **Status**: ✅ Production-ready — builds clean

---

## Prerequisites

- [ ] Node.js v20+ installed
- [ ] PostgreSQL 15+ database provisioned
- [ ] Railway account (for backend Docker deployment)
- [ ] Hostinger / static hosting account (for frontend SPA)
- [ ] Stripe account (test/live keys)
- [ ] PayPal Developer account (sandbox/live keys)
- [ ] Bird API account (transactional email)
- [ ] Twilio account (optional, SMS OTP)

---

## 1. Railway Deployment (Backend API)

### 1.1 Project Setup

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to existing project or create new
cd server
railway init     # Create new project
# OR
railway link     # Link to existing project
```

### 1.2 Environment Variables

Set these in Railway Dashboard → Variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | ✅ | Server port (Railway sets this automatically) |
| `NODE_ENV` | ✅ | Set to `production` |
| `DATABASE_URL` | ✅ | PostgreSQL connection string from Railway Postgres plugin |
| `DATA_DIR` | ✅ | Set to `/data` — mount a Railway Volume |
| `BIRD_API_KEY` | ✅ | Bird API key for transactional email |
| `BIRD_EMAIL_FROM` | ✅ | Sender email (e.g., `noreply@alayainsider.com`) |
| `TWILIO_ACCOUNT_SID` | ❌ Optional | Twilio account SID (SMS OTP) |
| `TWILIO_AUTH_TOKEN` | ❌ Optional | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | ❌ Optional | Twilio phone number |
| `STRIPE_SECRET_KEY` | ❌ | Stripe secret key (payment processing) |
| `STRIPE_WEBHOOK_SECRET` | ❌ | Stripe webhook signing secret |
| `PAYPAL_CLIENT_ID` | ❌ | PayPal client ID |
| `PAYPAL_CLIENT_SECRET` | ❌ | PayPal client secret |
| `PAYPAL_WEBHOOK_ID` | ❌ | PayPal webhook ID |
| `ADMIN_EMAIL` | ❌ | Admin email for seed (default: alayainsider@gmail.com) |
| `ADMIN_PASSWORD` | ❌ | Admin password for seed (default: Alaya@1923) |
| `SEED_ON_STARTUP` | ❌ | Set to `false` in production to skip seed migration |

### 1.3 Database Setup

1. Add **PostgreSQL** plugin in Railway Dashboard
2. Railway auto-provisions and sets `DATABASE_URL`
3. Mount a **Volume** at `/data` for persistent JSON store
4. Deploy — migrations run automatically on startup

### 1.4 Deploy

```bash
cd server
railway up
# OR connect GitHub repo for auto-deploy
```

### 1.5 Verify

```bash
curl https://<your-app>.railway.app/api/v1/system/health
# Expected: {"status":"healthy","version":"2.0.0",...}
```

---

## 2. Hostinger Deployment (Frontend SPA)

### 2.1 Build

```bash
# Build is already done — dist/ directory is ready
# To rebuild:
npm run build
```

### 2.2 Upload via Hostinger File Manager

1. Log into **Hostinger hPanel**
2. Go to **Files → File Manager**
3. Navigate to `public_html/` (or subdomain folder)
4. Delete all existing files
5. Upload contents of `dist/` directory:
   - `index.html`
   - `.htaccess`
   - `manifest.json`
   - `robots.txt`
   - `service-worker.js`
   - `assets/` (entire folder)
   - `icons/` (entire folder)
   - `screenshots/` (entire folder)

### 2.3 Upload via FTP

```bash
# Using scripts/upload-ftp.mjs:
node scripts/upload-ftp.mjs --host ftp.yourdomain.com --user username --password password --local-dir ./dist --remote-dir /public_html
```

### 2.4 Apache Config (.htaccess included in dist)

The `.htaccess` file in dist includes:
- SPA fallback (rewrite all routes to index.html)
- Gzip compression for JS/CSS
- Browser caching headers
- Security headers (CORS, XSS protection)

### 2.5 Verify

- [ ] Visit `https://alayainsider.com` — page loads
- [ ] Visit `https://alayainsider.com/shop` — SPA routing works
- [ ] Visit `https://alayainsider.com/admin` — admin login loads
- [ ] Open DevTools → Console — no errors
- [ ] Open DevTools → Network — assets load with 200

---

## 3. DNS Configuration

### 3.1 Custom Domain (Railway)

```dns
# Option A: CNAME
CNAME  @  alaya-insider-api-production.up.railway.app

# Option B: A records (if Railway provides static IPs)
A  @   <railway-ip>
```

Configure in Railway Dashboard → Settings → Domains

### 3.2 Custom Domain (Hostinger)

```dns
# A record for apex domain
A  @   <hostinger-server-ip>

# CNAME for www subdomain
CNAME  www  @
```

---

## 4. Post-Deployment Verification

### 4.1 API Health Check

```bash
curl https://api.alayainsider.com/api/v1/system/health
curl https://api.alayainsider.com/api/v1/system/info
```

### 4.2 Database Verification

```bash
# Run from Railway console
npx tsx src/db/migrate.ts status
npx tsx src/db/seed.ts  # Only if SEED_ON_STARTUP=false
```

### 4.3 Frontend Verification

- [ ] `https://alayainsider.com` loads
- [ ] Product pages render correctly
- [ ] Search works
- [ ] Cart/checkout flow works
- [ ] Admin panel loads at /admin
- [ ] PWA: Service worker registered
- [ ] PWA: Manifest loads (Lighthouse test)
- [ ] PWA: Can install as app on mobile

### 4.4 Payment Verification

- [ ] Stripe test payment succeeds
- [ ] PayPal test payment succeeds
- [ ] Webhook receiver responds (Stripe CLI: `stripe listen`)
- [ ] Payment admin dashboard loads

### 4.5 Additional Services

- [ ] Affiliate platform renders
- [ ] Supplier platform loads
- [ ] Shipping module accessible
- [ ] AI features functional
- [ ] Observability dashboard works

---

## 5. Rollback Plan

### 5.1 Railway Rollback

```bash
# Via Railway CLI
railway rollback

# Or in Railway Dashboard → Deployments → select previous → "Redeploy"
```

### 5.2 Database Rollback

```bash
cd server
npx tsx src/db/migrate.ts down   # Rollback last migration
npx tsx src/db/migrate.ts status # Verify current state
```

### 5.3 Frontend Rollback

1. Rebuild previous release: `npm run build`
2. Upload previous `dist/` contents to Hostinger
3. Clear CDN cache if using Cloudflare

---

## 6. Monitoring & Alerts

### 6.1 Health Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/system/health` | Main health check (used by Railway) |
| `GET /api/v1/system/info` | Server info & version |

### 6.2 Railway Monitoring

- **Health Check**: Configured in `railway.json` — checks `/api/v1/system/health`
- **Restart Policy**: Restart on failure (max 10 retries)
- **Logs**: Available in Railway Dashboard → Logs

### 6.3 Uptime Monitoring

Recommended: Set up [UptimeRobot](https://uptimerobot.com) or [Better Uptime](https://betteruptime.com) to monitor:
- Frontend: `https://alayainsider.com`
- API: `https://api.alayainsider.com/api/v1/system/health`

---

## 7. Security Checklist

- [ ] All passwords changed from defaults
- [ ] Stripe keys are **test** keys in staging, **live** in production
- [ ] PayPal keys are **sandbox** in staging, **live** in production
- [ ] HTTPS enforced (Railway provides TLS by default)
- [ ] CORS configured to only allow frontend domain
- [ ] CSP headers configured in backend
- [ ] Rate limiting enabled on auth routes
- [ ] Database credentials use strong passwords
- [ ] Admin MFA enabled
- [ ] `.env` files never committed to git

---

## 8. Performance Checklist

- [ ] Frontend assets gzip-compressed (handled by .htaccess)
- [ ] Image optimization enabled
- [ ] Database indexes verified (auto-created by schema.sql)
- [ ] Connection pooling configured (max 20 connections)
- [ ] Cache headers set for static assets
- [ ] PWA service worker caches app shell

---

## 9. Final Sign-Off

| Check | Status | Date |
|-------|--------|------|
| Frontend build clean | ⬜ | |
| Backend build clean | ⬜ | |
| Database migrations applied | ⬜ | |
| Railway deploy successful | ⬜ | |
| Hostinger deploy successful | ⬜ | |
| Health checks pass | ⬜ | |
| Payment test successful | ⬜ | |
| Admin login works | ⬜ | |
| Search works | ⬜ | |
| SSL/TLS verified | ⬜ | |
| DNS configured | ⬜ | |
| Monitoring active | ⬜ | |

---

## 10. Emergency Contacts

| Service | Contact | Notes |
|---------|---------|-------|
| Railway | [dashboard.railway.app](https://dashboard.railway.app) | Backend hosting |
| Hostinger | [hpanel.hostinger.com](https://hpanel.hostinger.com) | Frontend hosting |
| Stripe | [dashboard.stripe.com](https://dashboard.stripe.com) | Payment processing |
| PayPal | [developer.paypal.com](https://developer.paypal.com) | Payment processing |
| Bird | [app.bird.com](https://app.bird.com) | Transactional email |
| Twilio | [console.twilio.com](https://console.twilio.com) | SMS (optional) |
| Domain | [hostinger.com](https://hostinger.com) | DNS management |
