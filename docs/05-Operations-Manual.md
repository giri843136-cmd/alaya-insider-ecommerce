# ALAYA INSIDER — Operations Manual

> **Version:** 1.0.0 | **Last updated:** 2026-07-20

---

## 1. Daily Tasks

### Morning Checklist (15 minutes)

- [ ] **Check backend health** — verify `GET /api/v1/system/health` returns `{"status":"healthy"}`
- [ ] **Check Railway dashboard** — verify all services are online
- [ ] **Review new orders** — Admin → Orders, process pending orders
- [ ] **Review support tickets** — Admin → Customers → Tickets
- [ ] **Publish scheduled content** — Check Admin → Articles for pending publishes
- [ ] **Check affiliate analytics** — Review clicks and commissions from yesterday

### Activity Log Review

The platform automatically logs all admin activity. Review daily for suspicious actions:
```
Admin → System → Activity Log
```

### Content Publishing

- Aim for **1 article per day** during launch phase
- Pre-write articles and schedule them for automatic publishing
- Verify all affiliate links work before publishing

---

## 2. Weekly Tasks (Mondays)

### Business Review (30 minutes)

- [ ] **Revenue report** — Compare weekly revenue, orders, and AOV
- [ ] **Product performance** — Top 10 best/worst selling products
- [ ] **Affiliate performance** — Top 5 merchants by clicks and commissions
- [ ] **Traffic review** — GA4 traffic sources and top pages
- [ ] **Search Console** — Review clicks, impressions, average position
- [ ] **Clarity recordings** — Review user behavior recordings for UX issues

### Content Calendar Planning

- [ ] Plan next week's editorial calendar
- [ ] Assign article topics to writers
- [ ] Review in-progress articles
- [ ] Identify content gaps from search data

### Technical Checks

- [ ] **Review Railway logs** for errors or warnings
- [ ] **Check disk usage** on Hostinger (frontend storage)
- [ ] **Verify SSL certificates** are valid (>30 days remaining)
- [ ] **Test affiliate redirects** for top 5 products
- [ ] **Run SEO analysis** on new products and articles
- [ ] **Export product catalog** as backup

---

## 3. Monthly Tasks (1st of Month)

### Performance Review (1 hour)

- [ ] **Monthly P&L** — Revenue, expenses, affiliate commissions, profit
- [ ] **Year-over-year comparison** — Traffic, orders, revenue growth
- [ ] **Product catalog audit** — Remove/archive underperforming products
- [ ] **Supplier performance** — (if dropshipping) Review fulfillment times
- [ ] **Affiliate network audit** — Add new merchants, remove inactive ones

### SEO & Content Audit

- [ ] **Full SEO audit** — Run all entities through SEO engine
- [ ] **Content gap analysis** — Compare against competitor content
- [ ] **Keyword rank tracking** — Review top 50 keyword positions
- [ ] **Backlink profile** — Check backlinks via Search Console
- [ ] **Update sitemap** — Regenerate if needed
- [ ] **Review indexation** — Check Search Console for coverage issues

### Technical Maintenance

- [ ] **Review Railway plan** — Confirm still appropriate for traffic levels
- [ ] **Check environment variables** — Verify all secrets still valid
- [ ] **Rotate API keys** (optional) — Regenerate JWT secrets quarterly
- [ ] **Review CSP reports** — Check for policy violations
- [ ] **Performance benchmark** — Run `npm run benchmark` (if available)
- [ ] **Access review** — Verify admin users are still active and appropriate

### Data & Backups

- [ ] **Verify daily backups** exist and are restorable
- [ ] **Run manual backup** before any major changes
- [ ] **Clean up old data** — Archives, old sessions, expired OTPs
- [ ] **Check database performance** — Slow queries, connection pool

---

## 4. Backups

### Automatic Backups

| Type | Frequency | Retention | Method |
|------|-----------|-----------|--------|
| **PostgreSQL** | Daily | 7 days | Railway automated |
| **PostgreSQL** | Weekly | 30 days | Scheduler job |
| **PostgreSQL** | Monthly | 365 days | Scheduler job |
| **Application data** | On change | Immediate | JSON file persistence |

### Manual Backup Commands

**Database:**
```bash
# Via Railway CLI
railway run "pg_dump $DATABASE_URL > /tmp/backup_$(date +%Y%m%d).sql"

# Download backup
railway run "cat /tmp/backup_$(date +%Y%m%d).sql" > local_backup.sql
```

**Frontend files:**
```bash
# Via FTP download
curl -u "username:password" ftp://ftp.alayainsider.com/public_html/ -o alaya_frontend_backup.zip
```

### Backup Verification
- Monthly: Restore backup to a test database and verify table counts
- Check that product, order, and customer counts match
- Verify a sample of records

---

## 5. Monitoring

### Health Check Endpoints

| Endpoint | Check | Expected |
|----------|-------|----------|
| `GET /api/v1/system/health` | Full health (DB, worker, scheduler) | `{"status":"healthy"}` |
| `GET /api/v1/system/info` | System info | Version, environment, uptime |

### Key Metrics to Monitor

| Metric | Warning | Critical | Source |
|--------|---------|----------|--------|
| **Health endpoint** | Degraded | Down | Railway logs |
| **Database latency** | >100ms | >500ms | Health endpoint |
| **Connection pool** | >80% used | >95% used | Health endpoint |
| **CPU usage** | >70% | >90% | Railway dashboard |
| **Memory usage** | >200MB | >400MB | Railway dashboard |
| **Worker queue depth** | >100 | >500 | Job queue service |
| **Failed health checks** | 1 | 3 consecutive | Docker HEALTHCHECK |
| **Disk usage** | >80% | >95% | Hostinger dashboard |
| **SSL expiry** | <30 days | <7 days | UptimeRobot |

### Railway Monitoring

```bash
# View live logs
railway logs --service alaya-insider-api

# View deployment status
railway deployment list

# List services
railway service list
```

### Uptime Monitoring (Recommended)
- **UptimeRobot:** Free uptime monitoring for frontend + API
- **Better Stack:** Log aggregation with alerting
- **Sentry:** JavaScript error tracking for frontend

---

## 6. Incident Response

### Incident Severity Levels

| Level | Definition | Response Time | Example |
|-------|-----------|---------------|---------|
| **P0 - Critical** | Site is down or payments broken | 15 minutes | Database outage, 5xx errors >50% |
| **P1 - High** | Major feature broken | 1 hour | Product search down, affiliate links broken |
| **P2 - Medium** | Feature partially broken | 4 hours | Admin panel slow, UI glitch |
| **P3 - Low** | Minor issue | 24 hours | Styling issue, typo |

### Incident Response Flow

```
1. DETECT
   - Automated alert (UptimeRobot / Railway)
   - User report
   - Proactive monitoring

2. TRIAGE (5 min)
   - Determine severity level
   - Check Railway dashboard
   - Review recent logs
   - Identify affected services

3. MITIGATE (P0/P1 within 15 min)
   - Rollback deployment if recent change
   - Restart service in Railway
   - Check database connectivity
   - Scale up resources if needed

4. RESOLVE
   - Fix root cause
   - Deploy fix or rollback
   - Verify fix in production

5. POST-MORTEM
   - Document timeline
   - Identify root cause
   - Implement preventive measures
   - Update runbook
```

### Common Incidents & Response

#### Site Down / 5xx Errors
1. Check Railway dashboard → Service status
2. Check Railway logs for startup errors
3. `railway rollback` to previous working deployment
4. If database issue: Check PostgreSQL connection
5. If resource exhaustion: Scale up in Railway dashboard

#### Database Connection Issues
1. Check `DATABASE_URL` format is correct
2. Verify PostgreSQL service is online in Railway
3. Check connection pool not exhausted (`health endpoint`)
4. Restart PostgreSQL service (Railway Dashboard)
5. If corrupt: Restore from backup

#### Affiliate Links Broken
1. Test a sample affiliate redirect
2. Check affiliate API key status
3. Verify merchant configuration in admin
4. Check Amazon Associates dashboard for account status

#### Slow Performance
1. Check Railway CPU/memory metrics
2. Check database query performance
3. Review worker queue depth
4. Check for rate limiting (500 errors)
5. Consider Railway plan upgrade if sustained

---

## 7. Communication Channels

| Purpose | Channel | Details |
|---------|---------|---------|
| **Incidents** | Railway Logs | `railway logs --service alaya-insider-api` |
| **Business metrics** | Admin Dashboard | `/#/admin/home` |
| **Analytics** | GA4 | https://analytics.google.com |
| **Search performance** | Google Search Console | https://search.google.com/search-console |
| **User behavior** | Microsoft Clarity | https://clarity.microsoft.com |
| **Server monitoring** | Railway Dashboard | https://dashboard.railway.app |
| **Hosting** | Hostinger hPanel | https://hpanel.hostinger.com |
