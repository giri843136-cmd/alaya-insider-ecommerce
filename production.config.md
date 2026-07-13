# ALAYA INSIDER — Production Configuration Guide v2.0.0

> **Last updated**: 2026-07-10

---

## 1. Build Commands

### Frontend
```bash
# Production build (output: dist/)
npm run build

# TypeScript check
npx tsc --noEmit

# Preview production build locally
npm run preview
```

### Backend
```bash
cd server

# TypeScript compilation (output: dist/)
npm run build

# TypeScript check
npx tsc --noEmit

# Development with hot reload
npm run dev

# Database migration status
npx tsx src/db/migrate.ts status

# Seed data
npx tsx src/db/seed.ts
```

---

## 2. Deploy Commands

### Railway (Backend)
```bash
# One-time deploy
cd server
railway up

# Or: connect GitHub for auto-deploy on push
railway link
git push main
```

### Hostinger (Frontend)
```bash
# Build
npm run build

# FTP upload
node scripts/upload-ftp.mjs --host ftp.alayainsider.com --user <username> --password <password> --local-dir ./dist --remote-dir /public_html
```

---

## 3. Rollback Commands

### Backend (Railway)
```bash
# Via CLI
railway rollback

# Via Dashboard: Deployments → Select previous → Redeploy
```

### Frontend (Hostinger)
```bash
# Rebuild previous version
git checkout <previous-tag>
npm run build

# Upload to Hostinger
# Or: restore from backup in Hostinger File Manager
```

### Database
```bash
cd server

# Rollback last migration
npx tsx src/db/migrate.ts down

# Full reset (DANGER)
npx tsx src/db/migrate.ts reset
```

---

## 4. Health Checks

| Endpoint | Expected Response | Frequency |
|----------|-----------------|-----------|
| `GET /api/v1/system/health` | `{"status":"healthy","version":"2.0.0"}` | Every 30s (Railway) |
| `GET /api/v1/system/info` | `{"name":"ALAYA INSIDER API","version":"2.0.0"}` | On demand |

### Health Check Components

The `/api/v1/system/health` endpoint checks:
1. **PostgreSQL connection** — `SELECT 1` query
2. **Pool statistics** — total, active, idle, waiting connections
3. **Latency** — response time in milliseconds

---

## 5. Restart Procedure

### Railway (Automatic via Dockerfile HEALTHCHECK)
```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||3001)+'/api/v1/system/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"
```

If health check fails 3 times:
1. Railway kills the container
2. Railway restarts the container (restartPolicyType: ON_FAILURE, max 10 retries)
3. Server re-initializes database connection and re-applies migrations

### Manual Restart
```bash
# Railway Dashboard → Deployments → Restart
# OR
railway service restart
```

---

## 6. Verification Procedure

### 6.1 After Deployment

```bash
# 1. Check API health
curl https://api.alayainsider.com/api/v1/system/health

# 2. Check info endpoint
curl https://api.alayainsider.com/api/v1/system/info

# 3. Verify database
curl https://api.alayainsider.com/api/v1/system/health | jq .

# 4. Test authentication
curl -X POST https://api.alayainsider.com/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alayainsider@gmail.com","password":"<password>"}'

# 5. Test product API
curl https://api.alayainsider.com/api/v1/products?limit=1

# 6. Test search
curl "https://api.alayainsider.com/api/v1/search?q=dress"
```

### 6.2 Frontend Verification

- [ ] Visit `https://alayainsider.com` — homepage loads
- [ ] Navigate to `/shop` — products display
- [ ] Click a product — detail page loads
- [ ] Navigate to `/admin` — login page loads
- [ ] Login as admin — dashboard loads
- [ ] Test search functionality
- [ ] Test cart/checkout flow
- [ ] Open DevTools → Console: zero errors
- [ ] Open DevTools → Network: all assets load (200)

### 6.3 Payment Verification

- [ ] Stripe test mode: Create payment intent → Confirm → Verify webhook received
- [ ] PayPal sandbox: Create order → Capture → Verify webhook received
- [ ] Admin payment dashboard: Transactions visible, refunds work

---

## 7. Environment Matrix

| Variable | Local | Staging | Production |
|----------|-------|---------|------------|
| `NODE_ENV` | development | staging | production |
| `DATABASE_URL` | Local PG | Staging PG | Railway PG |
| `SEED_ON_STARTUP` | true | true | false |
| `DB_SSL` | false | false | true |
| `ADMIN_PASSWORD` | Alaya@1923 | <set> | <set> |
| `STRIPE_SECRET_KEY` | sk_test_... | sk_test_... | sk_live_... |
| `PAYPAL_CLIENT_ID` | sandbox | sandbox | live |

---

## 8. Monitoring

### Railway Logs
```bash
railway logs --service api        # Live logs
railway logs --service api -n 100 # Last 100 lines
```

### Railway Metrics
Available in Railway Dashboard → Metrics:
- CPU usage
- Memory usage
- Network I/O
- Disk I/O

### Third-party Monitoring (Recommended)
- [UptimeRobot](https://uptimerobot.com): Frontend + API uptime monitoring
- [Better Stack](https://betterstack.com): Log aggregation and alerting
- [Sentry](https://sentry.io): Error tracking (add `@sentry/node`)

---

## 9. Links & References

| Resource | URL |
|----------|-----|
| Railway Dashboard | https://dashboard.railway.app |
| Hostinger hPanel | https://hpanel.hostinger.com |
| Stripe Dashboard | https://dashboard.stripe.com |
| PayPal Developer | https://developer.paypal.com |
| Bird API | https://app.bird.com |
| Twilio Console | https://console.twilio.com |
| GitHub Repository | https://github.com/alayainsider/alaya-insider-platform |
