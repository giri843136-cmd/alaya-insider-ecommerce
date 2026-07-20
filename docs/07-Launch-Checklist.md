# ALAYA INSIDER — Launch Checklist

> **Version:** 1.0.0 | **Last updated:** 2026-07-20

---

## 1. Pre-Launch (T-7 Days)

### Technical Verification

- [ ] **Health endpoint** returns `{"status":"healthy"}` 
- [ ] **All frontend pages** return HTTP 200
- [ ] **HTTPS** is active and certificates valid
- [ ] **robots.txt** accessible at `/robots.txt`
- [ ] **sitemap.xml** accessible at `/sitemap.xml` and valid XML
- [ ] **manifest.json** accessible and valid PWA manifest
- [ ] **Canonical URLs** set correctly on all pages
- [ ] **Open Graph tags** render correctly for homepage and product pages
- [ ] **Twitter Cards** render correctly
- [ ] **JSON-LD** structured data valid (test with Google Rich Results Tool)
- [ ] **CSP headers** not blocking any resources
- [ ] **Rate limiting** is active (100 req/min API, 10 req/min auth)
- [ ] **CORS** configured for production domain
- [ ] **HSTS** headers present

### Database Verification

- [ ] **SEED_ON_STARTUP=false** confirmed
- [ ] **PostgreSQL connection** working (no persisted store being seeded)
- [ ] **All tables** verified (92 tables)
- [ ] **Migrations** applied and at latest version
- [ ] **Backups** configured and running

### Environment Variables

- [ ] **NODE_ENV=production**
- [ ] **JWT_SECRET** set (64+ characters)
- [ ] **SESSION_SECRET** set (64+ characters)
- [ ] **DATABASE_URL** set (Railway managed PostgreSQL)
- [ ] **DB_SSL=true**
- [ ] **GameDay:** Set **OTP_SECRET** — currently the only critical missing var

### Affiliate Setup

- [ ] **Amazon Associates** tracking ID `alayainsider-21` verified
- [ ] **Affiliate redirect** `/api/v1/affiliates/out` working
- [ ] **Affiliate disclosure** appearing on product pages
- [ ] **Affiliate commission tables** configured correctly
- [ ] **Geo-routing** working for US, UK, DE, FR, IN
- [ ] **UTM parameters** included in all affiliate links

### Analytics Setup

- [ ] **GA4 property** `G-Z8MZF8WTFY` receiving events (check Realtime)
- [ ] **Microsoft Clarity** project `xka0e9jsv0` recording sessions
- [ ] **Google Search Console** domain verified
- [ ] **Sitemap submitted** to Google Search Console
- [ ] **Search Console** initial crawl completed

### Content Readiness

- [ ] **5 articles** published for initial SEO presence
- [ ] **25 products** imported (minimum)
- [ ] **Affiliate disclosure** on all product pages
- [ ] **About page** has final content
- [ ] **FAQ page** has sufficient questions
- [ ] **Contact page** has correct contact information
- [ ] **All images** load correctly (no broken images)
- [ ] **Cookie consent** banner active

---

## 2. Launch Day (T-0)

### Final Pre-Launch Checks

- [ ] First: Run the product import (CSV/JSON with preview)
- [ ] **Publish 3 articles** for fresh content on launch day
- [ ] **Verify all frontend pages** load correctly
- [ ] **Test checkout flow** end-to-end (add product → cart → checkout)
- [ ] **Test affiliate link** from homepage → product → merchant redirect
- [ ] **Test mobile experience** on real device (iPhone + Android)
- [ ] **Test search** returns relevant results
- [ ] **Verify SSL** is valid and green in browser bar
- [ ] **Verify no console errors** on any major page

### Launch Sequence

```
09:00 CET  — Final health check
09:15 CET  — Enable public access (if behind wall)
09:30 CET  — Submit sitemap to Google Search Console
10:00 CET  — Post first social media announcement
10:15 CET  — Monitor realtime GA4 traffic
11:00 CET  — Check Clarity for first user recordings
14:00 CET  — Review first half-day metrics
17:00 CET  — Publish day's second article
```

### Launch Day Monitoring

| Timeframe | Action |
|-----------|--------|
| **Every 15 min** (first 2 hours) | Check Railway health endpoint |
| **Every 30 min** (first 8 hours) | Review GA4 Realtime report |
| **Hourly** (first 24 hours) | Check server logs for errors |
| **After 24 hours** | Review Clarity recordings |

---

## 3. First Week (T+7 Days)

### Daily

- [ ] **Check backend health** every morning
- [ ] **Publish 1 article** per day
- [ ] **Monitor affiliate clicks** in admin dashboard
- [ ] **Check Google Search Console** for indexation status
- [ ] **Review Clarity recordings** for UX issues
- [ ] **Respond to any contact form submissions**

### Week 1 Goals

| Metric | Target |
|--------|--------|
| **Products imported** | 50+ |
| **Articles published** | 8+ |
| **Affiliate clicks** | 50+ |
| **GA4 sessions** | 500+ |
| **Search Console impressions** | 1,000+ |
| **Any revenue** | >$0 (first affiliate commission) |

### Day 7 Review

- [ ] Review first week analytics
- [ ] Identify top-performing content
- [ ] Check which products generate most clicks
- [ ] Review technical performance (uptime, speed)
- [ ] Plan Week 2 content calendar
- [ ] Fix any issues discovered in first week

---

## 4. First Month (T+30 Days)

### Weeks 2-4 Schedule

| Week | Products | Articles | Focus |
|------|----------|----------|-------|
| **Week 1** | 25 | 8 | Beauty + Fashion launch |
| **Week 2** | 25 | 5 | Home + Living expansion |
| **Week 3** | 25 | 4 | Tech + Gadgets category |
| **Week 4** | 25 | 4 | Fill gaps, round out catalog |

### Month 1 Goals

| Metric | Target | How to Achieve |
|--------|--------|----------------|
| **Products** | 100+ | Import in weekly batches |
| **Articles** | 20+ | 5 articles/week publishing schedule |
| **Sessions** | 10,000 | SEO traffic + social media |
| **Organic traffic** | 40% | SEO-optimized content |
| **Affiliate revenue** | First commission | High-traffic buying guides |
| **Search Console** | 50,000 impressions | Index all pages |
| **Average position** | <20 | Optimize top 50 pages |
| **Email subscribers** | 500+ | Newsletter popup + content upgrades |

### Month 1 Review

- [ ] **Full business review** (see Operations Manual)
- [ ] **SEO audit** of all published content
- [ ] **Affiliate performance review** — prune/add merchants
- [ ] **Technical audit** — uptime, speed, security
- [ ] **Competitor analysis** — content gaps to fill
- [ ] **Budget review** — Railway plan, hosting, tools
- [ ] **Quarterly roadmap** — features, content, partnerships

---

## 5. Post-Launch Optimization

### First 90 Days Roadmap

| Week | Priority |
|------|----------|
| **1-2** | Foundation: Products, articles, SEO setup |
| **3-4** | Traffic: Content scaling, social distribution |
| **5-6** | Conversion: Optimize affiliate CTAs, merchant ranking |
| **7-8** | Expansion: New categories, more merchants |
| **9-10** | Retention: Email lists, returning visitor strategy |
| **11-12** | Scale: Double down on what works |

### Warning Signs to Watch

| Sign | Action |
|------|--------|
| **Zero organic traffic after 2 weeks** | Review SEO fundamentals, fix indexation |
| **High bounce rate (>70%)** | Improve page load speed, content quality |
| **Zero affiliate clicks** | Check affiliate links are working, add more CTAs |
| **Server errors increasing** | Review Railway logs, check resource usage |
| **Crawl errors in Search Console** | Fix broken links, 404s, redirects |
| **No Search Console impressions** | Sitemap not indexed, request indexing manually |

---

## 6. Ready to Launch Checklist

### Final Sign-off

- [ ] **Deployment verified** — all systems operational
- [ ] **SEO foundation** — sitemap submitted, metadata configured
- [ ] **Analytics active** — GA4, Clarity, Search Console verified
- [ ] **Content ready** — minimum 5 articles, 25 products
- [ ] **Affiliate engine** — Amazon tracking ID verified, geo-routing tested
- [ ] **Security baseline** — HTTPS, CSP, HSTS, rate limiting active
- [ ] **Monitoring configured** — health checks, logging, alerts
- [ ] **Backup strategy** — database backups confirmed running
- [ ] **Incident response** — runbook ready, contacts known
- [ ] **Business owner briefed** — admin access, tools access, reporting schedule

> ✅ **Launch authorized** when all above are complete.
