# ALAYA INSIDER — Disaster Recovery Guide

> **Version:** 1.0.0 | **Last updated:** 2026-07-20

---

## 1. Incident Classification

| Level | Definition | Examples | Response Time |
|-------|-----------|----------|---------------|
| **P0 - Critical** | Complete service outage or data loss | Site down, database inaccessible, security breach | 15 minutes |
| **P1 - High** | Major feature broken for all users | Affiliate links broken, checkout failing, admin inaccessible | 1 hour |
| **P2 - Medium** | Feature broken for some users | Search down, slow performance, image loading issues | 4 hours |
| **P3 - Low** | Cosmetic or non-urgent | Styling issue, typo, non-critical warning | 24 hours |

---

## 2. Database Recovery

### 2.1 Database Connection Failure

**Symptoms:**
- Health endpoint returns `"database": {"status": "unhealthy"}`
- Railway logs show connection errors
- Admin pages show "Backend not configured"

**Recovery Steps:**

1. **Verify connection string**
   ```bash
   railway variables | grep DATABASE_URL
   ```
   Check that `DATABASE_URL` is correct and not truncated.

2. **Check PostgreSQL service status**
   ```bash
   railway service list  # Look for Postgres service
   ```
   If PostgreSQL is offline, restart it in Railway Dashboard.

3. **Test connection manually**
   ```bash
   railway run "psql $DATABASE_URL -c 'SELECT 1'"
   ```

4. **Test from local machine**
   ```bash
   psql "<DATABASE_URL>" -c "SELECT current_database()"
   ```

5. **Restart the API service**
   ```bash
   railway service restart
   ```

6. **If connection pool exhausted:**
   - Check `DB_MAX_CONNECTIONS` variable (default: 20)
   - Increase to 30-40 temporarily
   - Identify leaking connections and fix the source

### 2.2 Database Restore from Backup

**⚠️ Only use this if data is corrupted or lost.**

**Prerequisites:**
- A recent backup file (.sql)
- Access to Railway dashboard or CLI

**Restore steps:**

1. **Upload backup to Railway container**
   ```bash
   railway run "mkdir -p /tmp/restore && exit"
   # Upload via Railway's file system or use a URL
   ```

2. **Restore from backup**
   ```bash
   railway run "psql $DATABASE_URL < /tmp/restore/backup_20260720.sql"
   ```

3. **Verify restore**
   ```bash
   railway run "psql $DATABASE_URL -c 'SELECT COUNT(*) FROM products'"
   railway run "psql $DATABASE_URL -c 'SELECT COUNT(*) FROM orders'"
   railway run "psql $DATABASE_URL -c 'SELECT COUNT(*) FROM customers'"
   ```

4. **Restart API service**
   ```bash
   railway service restart
   ```

5. **Verify health endpoint** returns healthy status.

### 2.3 Rollback Migration

**If a recent migration caused issues:**

```bash
cd server

# Check migration status
npx tsx src/db/migrate.ts status

# Rollback last migration
npx tsx src/db/migrate.ts down

# Re-apply (if needed)
npx tsx src/db/migrate.ts up
```

### 2.4 Full Database Reset

**⚠️ Destroys all data. Only in extreme cases.**

```bash
cd server

npx tsx src/db/migrate.ts reset   # Drops ALL tables
npx tsx src/db/migrate.ts up      # Re-creates tables and applies schemas

# If SEED_ON_STARTUP=false, database will be empty
# You'll need to re-import data from backup
```

---

## 3. Application Recovery

### 3.1 Full Redeploy (Backend)

**Trigger redeployment from latest build:**

```bash
cd server

# Method 1: Trigger Railway deploy with latest
railway up --detach

# Method 2: Redeploy existing deployment
railway deployment list  # Find working deployment ID
railway redeploy <deployment-id>

# Monitor:
railway logs --service alaya-insider-api -n 50
```

### 3.2 Rollback to Previous Deployment

```bash
# Via CLI
railway rollback

# Via Dashboard:
# 1. Go to Railway Dashboard
# 2. Select alaya-insider-api
# 3. Click "Deployments" tab
# 4. Find the last known good deployment
# 5. Click "Redeploy"
```

### 3.3 Frontend Restore (Hostinger)

```bash
# Option 1: Redeploy current build
cd alaya-insider-ecommerce-platform
npm run build
node scripts/upload-ftp.mjs --host ftp.alayainsider.com --user <user> --password <pass> --local-dir ./dist --remote-dir /public_html

# Option 2: Restore from git
git checkout <known-good-commit>
npm run build
node scripts/upload-ftp.mjs --host ftp.alayainsider.com --user <user> --password <pass> --local-dir ./dist --remote-dir /public_html

# Option 3: Restore from Hostinger backup
# hPanel → Files → Backup Manager → Restore
```

### 3.4 Container Restart

```bash
# Railway will restart automatically on failure (up to 10 retries)
# Manual restart:
railway service restart
```

---

## 4. Backup Restoration

### 4.1 Types of Backups

| Backup Type | Contains | Frequency | Location |
|-------------|----------|-----------|----------|
| **PostgreSQL dump** | All database data | Daily | Railway volumes + backups table |
| **Application code** | Source code | Continuous | GitHub repository |
| **Frontend files** | Static assets, index.html | On each deploy | FTP server (Hostinger) |
| **Environment variables** | Secrets, configuration | Manual | Railway dashboard |

### 4.2 Restore from PostgreSQL Dump

```bash
# Download latest backup
railway run "pg_dump -Fc $DATABASE_URL" > alaya_backup_$(date +%Y%m%d).dump

# Restore (WARNING: overwrites existing data)
railway run "pg_restore -Fc -d $DATABASE_URL /path/to/backup.dump"
```

### 4.3 Restore from JSON Store (legacy)

The application also has a JSON file-based store as fallback:

```bash
# The store is at DATA_DIR/store.json
# Default: /data/store.json inside the container

# Check if legacy store exists
railway run "ls -la /data/store.json"

# Download legacy store
railway run "cat /data/store.json" > legacy_store_backup.json
```

---

## 5. Secret Rotation

### 5.1 Rotating JWT_SECRET

1. Generate a new 64-character random secret:
   ```bash
   openssl rand -hex 64
   ```

2. Update in Railway Dashboard:
   - Go to Variables → JWT_SECRET
   - Paste new value
   - Click "Update"

3. The change takes effect on next deployment:
   ```bash
   railway up --detach
   ```

4. All existing JWT tokens will be invalidated immediately.
   - All users must log in again
   - This is expected — it's a security feature

### 5.2 Rotating SESSION_SECRET

Same process as JWT_SECRET. Generate a new 64-char hex string and update in Railway Dashboard.

### 5.3 Rotating OTP_SECRET

Generate a new 32-character random secret:
```bash
openssl rand -hex 32
```

Update in Railway Dashboard → Variables → OTP_SECRET.

### 5.4 Rotating Stripe/PayPal Keys

1. Generate new keys in Stripe/PayPal dashboard
2. Update Railway Dashboard → Variables
3. **Important:** Update webhook endpoints with new webhook secrets
4. Test with a small transaction before switching fully

### 5.5 Secret Rotation Schedule

| Secret | Rotation Frequency | Last Rotated |
|--------|-------------------|--------------|
| JWT_SECRET | Every 180 days | N/A (initial) |
| SESSION_SECRET | Every 180 days | N/A (initial) |
| OTP_SECRET | Every 180 days | N/A (initial) |
| Stripe keys | Every 365 days | N/A (initial) |
| PayPal keys | Every 365 days | N/A (initial) |
| Cloudinary keys | Every 365 days | N/A (initial) |

---

## 6. Downtime Recovery

### 6.1 Complete Site Down (P0)

**Symptoms:**
- alayainsider.com returns 5xx or doesn't load
- API health endpoint unreachable
- Railway service shows offline

**Recovery Flow:**

```
1. DIAGNOSE (5 min)
   └─ Check Railway dashboard
   └─ Check Railway logs: railway logs --service alaya-insider-api -n 100
   └─ Check if PostgreSQL is online

2. MITIGATE (10 min)
   └─ If Railway: restart service or rollback
   └─ If Hostinger: check FTP/hPanel
   └─ If DNS: check domain propagation

3. RESOLVE (15 min)
   └─ Apply fix
   └─ Verify recovery
   └─ Notify stakeholders

4. POST-MORTEM
   └─ Document root cause
   └─ Add monitoring/prevention
```

### 6.2 Degraded Performance (P1)

**Symptoms:**
- Site loads slowly (>5 seconds)
- API responses slow (>500ms)
- Intermittent 5xx errors

**Recovery Steps:**

1. **Check resource usage**
   ```bash
   # Railway dashboard → Metrics
   # CPU / Memory / Network I/O
   ```

2. **Check database performance**
   - Health endpoint shows latency
   - If >100ms, investigate slow queries

3. **Scale up (if resource-bound)**
   - Railway Dashboard → Plan → Upgrade
   - Or adjust `DB_MAX_CONNECTIONS`

4. **Rate limiting adjustments**
   - Check if legitimate users are being rate-limited
   - Temporarily increase limits during traffic spikes

### 6.3 Security Breach (P0)

**Immediate actions:**
1. **Isolate the service** — Take the site offline or put in maintenance mode
2. **Rotate ALL secrets** (JWT_SECRET, SESSION_SECRET, API keys, database password)
3. **Revoke all sessions** via Admin → Auth Center
4. **Audit logs** — Review activity for unauthorized access
5. **Restore from clean backup** — Restore database from pre-breach backup
6. **Notify affected users** — If customer data was compromised
7. **Investigate** — Determine breach vector and patch

**Post-breach:**
- Review Railway access logs
- Check GitHub for unauthorized commits
- Review admin login history
- Implement security hardening measures
- Consider penetration testing

---

## 7. Disaster Recovery Drills

### Quarterly Drills

| Drill | Frequency | Success Criteria |
|-------|-----------|------------------|
| **Database restore** | Quarterly | Successfully restore database from backup within 1 hour |
| **Full redeploy** | Quarterly | Complete redeployment under 30 minutes |
| **Secret rotation** | Bi-annually | All secrets rotated and verified working |
| **Load test** | Quarterly | Site handles 10x normal traffic |
| **Failover test** | Bi-annually | Automatic failover works correctly |

### First Drill Schedule

| Drill | Month | Lead |
|-------|-------|------|
| Database restore drill | Month 1 | Operations |
| Full redeploy drill | Month 1 | Operations |
| Load test | Month 2 | Operations |
| Secret rotation | Month 3 | Operations |

---

## 8. Emergency Contacts

| Role | Contact | Backup |
|------|---------|--------|
| **Operations** | alayainsider@gmail.com | Railway support |
| **Railway Support** | https://help.railway.app | In-app chat |
| **Hostinger Support** | https://hpanel.hostinger.com | Live chat |
| **AWS/Cloudinary Support** | https://support.cloudinary.com | — |
| **Stripe Support** | https://support.stripe.com | — |
| **GitHub** | — | Repo owner: giri843136-cmd |

---

## 9. Recovery Checklist

### Immediate Response (P0/P1)

- [ ] **1. Assess severity** — Determine if P0, P1, P2 or P3
- [ ] **2. Notify stakeholders** — Inform business owner
- [ ] **3. Check monitoring** — Railway dashboard, logs
- [ ] **4. Attempt quick fix** — Restart service, rollback deployment
- [ ] **5. If unresolved** — Follow specific recovery procedure above
- [ ] **6. Verify recovery** — Health check, frontend, admin
- [ ] **7. Document incident** — Timeline, cause, resolution

### Post-Incident

- [ ] **Root cause analysis documented**
- [ ] **Preventive measures implemented**
- [ ] **Runbooks updated**
- [ ] **Recovery time objective (RTO) met** (< 1 hour for P0)
- [ ] **Recovery point objective (RPO) met** (< 24 hours data loss)
- [ ] **Stakeholders notified of resolution**
