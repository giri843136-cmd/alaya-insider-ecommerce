# ALAYA INSIDER — Production Deployment Guide

> **Version:** 1.0.0 | **Last updated:** 2026-07-20

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    alayainsider.com                  │
│                  (Hostinger VPS/FTP)                 │
│                                                      │
│   ┌──────────────────────────────────────────────┐   │
│   │           Frontend SPA (React + Vite)         │   │
│   │  • Static files served via Apache/Nginx       │   │
│   │  • SPA routing via index.html fallback        │   │
│   │  • PWA-enabled with service worker            │   │
│   └──────────────────┬───────────────────────────┘   │
│                      │                                │
│                      │ HTTPS                          │
│                      ▼                                │
│   ┌──────────────────────────────────────────────┐   │
│   │         Railway Edge (Hikari Proxy)           │   │
│   │  • Rate limiting, SSL termination             │   │
│   │  • DDoS protection                            │   │
│   └──────────────────┬───────────────────────────┘   │
│                      │                                │
│                      ▼                                │
│   ┌──────────────────────────────────────────────┐   │
│   │       Backend API (Hono + Node.js 20)         │   │
│   │  • REST endpoints under /api/v1               │   │
│   │  • Health check: /api/v1/system/health        │   │
│   │  • Docker container (Alpine)                  │   │
│   └──────────────────┬───────────────────────────┘   │
│                      │                                │
│                      ▼                                │
│   ┌──────────────────────────────────────────────┐   │
│   │      PostgreSQL 18 (Railway Managed)          │   │
│   │  • 92 tables, 45+ entity types                │   │
│   │  • Automatic SSL                              │   │
│   │  • Daily backups                              │   │
│   └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Key Components

| Layer | Technology | Location |
|-------|-----------|----------|
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind CSS 4 | Hostinger VPS (static files) |
| **Backend** | Hono 4, Node.js 20, TypeScript | Railway (Docker) |
| **Database** | PostgreSQL 18 | Railway Managed |
| **Cache** | In-memory (Node.js) | Embedded in backend |
| **CDN** | Railway Edge (Hikari) | Global edge network |
| **File Storage** | Local filesystem (`/data`) + Cloudinary | Embedded + Cloudinary |

---

## 2. Domains

| Domain | Purpose | Hosting | SSL |
|--------|---------|---------|-----|
| `alayainsider.com` | Primary frontend (www also resolves) | Hostinger | ✅ Auto (Let's Encrypt) |
| `alaya-insider-api-production.up.railway.app` | Backend API | Railway | ✅ Auto |
| `ftp.alayainsider.com` | FTP deployment endpoint | Hostinger | ✅ |

**To configure a custom backend domain (api.alayainsider.com):**
1. Railway Dashboard → alaya-insider-api → Settings → Domains
2. Add `api.alayainsider.com`
3. Create a CNAME record at your DNS provider pointing to `alaya-insider-api-production.up.railway.app`
4. Update `__ALAYA_CONFIG__.apiUrl` in `dist/index.html` to `https://api.alayainsider.com/api/v1`
5. Re-deploy frontend

---

## 3. Services

### 3.1 Railway Services

| Service | Status | URL | Region |
|---------|--------|-----|--------|
| **alaya-insider-api** | ● Online | `https://alaya-insider-api-production.up.railway.app` | sfo |
| **Postgres** | ● Online | Internal: `postgres.railway.internal:5432` | sfo |

**Other services (currently offline):**
- `positive-trust` — unused
- `remarkable-friendship` — unused

### 3.2 Background Workers

The application runs an internal job queue (`jobQueue.ts`) with one default worker polling these queues:

| Queue | Concurrency | Purpose |
|-------|------------|---------|
| `default` | 10 | General jobs |
| `email` | 10 | Email dispatch |
| `sms` | 10 | SMS notifications |
| `notifications` | 10 | Push notifications |
| `analytics` | 10 | Analytics processing |
| `cleanup` | 10 | Data cleanup (OTP, sessions) |
| `ai` | 10 | AI task processing |

### 3.3 Scheduled Jobs

| Job Name | Queue | Interval | Purpose |
|----------|-------|----------|---------|
| `affiliate-price-refresh` | affiliate-price | 1 hour | Refresh affiliate prices |
| `affiliate-health-check` | affiliate-health | 24 hours | Check affiliate network health |
| `merchant-sync-full` | affiliate-price | 24 hours | Full merchant sync (requires config) |
| `cleanup-otp` | cleanup | 1 hour | Expire old OTP codes |
| `cleanup-sessions` | cleanup | 1 hour | Expire stale sessions |
| `search-reindex` | search-reindex | 24 hours | Rebuild search index |

---

## 4. Environment Variables

### 4.1 Core Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | ✅ | `production` for live |
| `PORT` | ❌ | Server port (default: 3001) |
| `HOST` | ❌ | Bind address (default: `0.0.0.0`) |
| `DATA_DIR` | ❌ | Persistent data path (default: `/data`) |

### 4.2 Database

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `DB_SSL` | ❌ | `true` for production Railway |
| `DB_MAX_CONNECTIONS` | ❌ | Pool size (default: 20) |
| `DB_IDLE_TIMEOUT` | ❌ | Idle timeout ms (default: 30000) |
| `DB_CONNECT_TIMEOUT` | ❌ | Connection timeout ms (default: 10000) |

### 4.3 Auth / Security

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | ✅ Critical | JWT signing secret (min 32 chars) |
| `SESSION_SECRET` | ✅ Critical | Session encryption secret (min 32 chars) |
| `OTP_SECRET` | ✅ Critical | OTP encryption (min 16 chars) — **currently missing** |
| `ADMIN_PASSWORD` | ❌ | Admin password override |

### 4.4 Payment Providers

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | ❌ | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | ❌ | Stripe webhook signing secret |
| `PAYPAL_CLIENT_ID` | ❌ | PayPal client ID |
| `PAYPAL_CLIENT_SECRET` | ❌ | PayPal client secret |
| `PAYPAL_WEBHOOK_ID` | ❌ | PayPal webhook ID |

### 4.5 Email / SMS

| Variable | Required | Description |
|----------|----------|-------------|
| `BIRD_API_KEY` | ❌ | MessageBird/Bird API key for email |
| `BIRD_EMAIL_FROM` | ❌ | Sender email address |
| `TWILIO_ACCOUNT_SID` | ❌ | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | ❌ | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | ❌ | Twilio sender phone |
| `SMTP_HOST` | ❌ | SMTP host |
| `SMTP_PORT` | ❌ | SMTP port |
| `SMTP_USER` | ❌ | SMTP username |
| `SMTP_PASS` | ❌ | SMTP password |

### 4.6 AI Providers

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ❌ | OpenAI API key |
| `GEMINI_API_KEY` | ❌ | Google Gemini API key |
| `DEEPSEEK_API_KEY` | ❌ | DeepSeek API key |

### 4.7 Media

| Variable | Required | Description |
|----------|----------|-------------|
| `CLOUDINARY_CLOUD_NAME` | ❌ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ❌ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ❌ | Cloudinary API secret |

### 4.8 Analytics

| Variable | Required | Description |
|----------|----------|-------------|
| `GA_MEASUREMENT_ID` | ❌ | Google Analytics 4 ID |
| `CLARITY_PROJECT_ID` | ❌ | Microsoft Clarity project ID |

### 4.9 OAuth

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth client secret |
| `APPLE_TEAM_ID` | ❌ | Apple Sign-In team ID |
| `APPLE_KEY_ID` | ❌ | Apple Sign-In key ID |
| `APPLE_CLIENT_ID` | ❌ | Apple Sign-In client ID |

### 4.10 Affiliates

| Variable | Required | Description |
|----------|----------|-------------|
| `AMAZON_TRACKING_ID` | ❌ | Amazon Associates tracking ID |

### 4.11 Monitoring

| Variable | Required | Description |
|----------|----------|-------------|
| `ONESIGNAL_APP_ID` | ❌ | OneSignal app ID |
| `ONESIGNAL_REST_API_KEY` | ❌ | OneSignal REST API key |
| `GOOGLE_MAPS_API_KEY` | ❌ | Google Maps API key (store locator) |

---

## 5. Deployment Process

### 5.1 Backend (Railway)

**Automated (GitHub → Railway):**
```bash
git push origin master
# Railway auto-deploys from GitHub (if connected)
```

**Manual via CLI:**
```bash
cd server
railway up --detach
```

**Monitor deployment:**
```bash
railway logs --service alaya-insider-api -n 100
railway deployment list
```

### 5.2 Frontend (Hostinger)

**Build:**
```bash
npm run build
# Output: dist/
```

**Upload via FTP:**
```bash
node scripts/upload-ftp.mjs \
  --host ftp.alayainsider.com \
  --user <username> \
  --password <password> \
  --local-dir ./dist \
  --remote-dir /public_html
```

### 5.3 Railway Environment Setup

1. Go to [Railway Dashboard](https://dashboard.railway.app)
2. Select project `alaya-insider-api`
3. Navigate to Variables
4. Add each environment variable from Section 4
5. Click "Deploy" to apply changes

---

## 6. Rollback Procedure

### 6.1 Backend Rollback

**Via CLI:**
```bash
railway rollback
```

**Via Dashboard:**
1. Railway Dashboard → alaya-insider-api → Deployments
2. Find the previous successful deployment
3. Click "Redeploy"

### 6.2 Frontend Rollback

```bash
# Checkout previous build
git checkout <previous-tag-or-commit>
npm run build
node scripts/upload-ftp.mjs --host ftp.alayainsider.com --user <username> --password <password> --local-dir ./dist --remote-dir /public_html
```

### 6.3 Database Rollback

```bash
cd server
npx tsx src/db/migrate.ts down    # Rollback last migration
npx tsx src/db/migrate.ts up      # Re-apply
```

**⚠️ Full reset (destroys all data):**
```bash
npx tsx src/db/migrate.ts reset
npx tsx src/db/migrate.ts up
```

---

## 7. Health Checks

| Endpoint | Expected Response | Frequency |
|----------|-----------------|-----------|
| `GET /api/v1/system/health` | `{"status":"healthy","version":"2.0.0"}` | Every 30s (Railway) |
| `GET /api/v1/system/info` | `{"name":"ALAYA INSIDER API","version":"2.0.0"}` | On demand |

The Dockerfile includes a HEALTHCHECK instruction:
```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||3001)+'/api/v1/system/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"
```

---

## 8. Monitoring

### Railway Logs
```bash
railway logs --service alaya-insider-api        # Live stream
railway logs --service alaya-insider-api -n 200  # Last 200 lines
```

### Railway Metrics (Dashboard)
- CPU usage
- Memory usage
- Network I/O
- Disk I/O

### Recommended Third-Party Monitoring
| Service | Purpose | URL |
|---------|---------|-----|
| **UptimeRobot** | Uptime monitoring | https://uptimerobot.com |
| **Better Stack** | Log aggregation & alerting | https://betterstack.com |
| **Sentry** | Error tracking | https://sentry.io |

---

## 9. Links & Credentials

| Resource | URL |
|----------|-----|
| Railway Dashboard | https://dashboard.railway.app |
| Hostinger hPanel | https://hpanel.hostinger.com |
| GitHub Repository | https://github.com/giri843136-cmd/alaya-insider-ecommerce |
| Google Search Console | https://search.google.com/search-console |
| Google Analytics | https://analytics.google.com |
| Microsoft Clarity | https://clarity.microsoft.com |
| Amazon Associates | https://affiliate-program.amazon.com |
| Stripe Dashboard | https://dashboard.stripe.com |
| PayPal Developer | https://developer.paypal.com |
| Cloudinary Console | https://console.cloudinary.com |
| Bird (MessageBird) | https://app.bird.com |
| Twilio Console | https://console.twilio.com |
| OneSignal | https://dashboard.onesignal.com |
