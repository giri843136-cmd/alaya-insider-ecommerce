# ALAYA INSIDER — Analytics Guide

> **Version:** 1.0.0 | **Last updated:** 2026-07-20

---

## 1. Overview

ALAYA INSIDER uses a multi-platform analytics stack:

| Platform | Purpose | ID |
|----------|---------|-----|
| **Google Analytics 4 (GA4)** | Traffic analysis, user behavior, conversions | `G-Z8MZF8WTFY` |
| **Microsoft Clarity** | Session recordings, heatmaps | `xka0e9jsv0` |
| **Google Search Console** | Search performance, indexation | — |
| **Built-in Analytics** | Admin dashboard, affiliate tracking | Backend API |
| **OneSignal** | Push notifications | `ae233595-6b12-4809-808b-303f299bdaf5` |

---

## 2. Google Analytics 4 (GA4)

### Access
1. Go to https://analytics.google.com
2. Select property: **ALAYA INSIDER**
3. Property ID: `G-Z8MZF8WTFY`

### Key Reports

#### Realtime
- Active users right now
- Top pages being viewed
- Traffic sources
- Events in the last 30 minutes

#### Acquisition
| Report | What to Look For |
|--------|------------------|
| **Traffic Acquisition** | Which channels drive traffic (Organic, Direct, Social, Referral) |
| **User Acquisition** | New vs. returning users |
| **Campaigns** | UTM-tagged campaign performance |

#### Engagement
| Report | What to Look For |
|--------|------------------|
| **Pages and Screens** | Top visited pages, average time on page |
| **Events** | Product views, add to cart, purchases |
| **Conversions** | Completed purchases, newsletter signups |

#### Monetization
| Report | What to Look For |
|--------|------------------|
| **E-commerce Purchases** | Revenue, transactions, average order value |
| **Purchase Journey** | Steps from first visit to purchase |
| **Affiliate Clicks** | Outbound affiliate link clicks |

### Key Events Tracked

| Event | Trigger | Description |
|-------|---------|-------------|
| `page_view` | Page load | Every page visit |
| `view_item` | Product page load | Product detail view |
| `add_to_cart` | Add to cart button | Product added to cart |
| `begin_checkout` | Checkout start | User begins checkout |
| `purchase` | Order complete | Successful purchase |
| `affiliate_click` | Affiliate link click | Outbound merchant click |
| `search` | Search submit | Site search query |
| `newsletter_signup` | Newsletter form submit | Email capture |
| `wishlist_add` | Add to wishlist | Product saved |
| `compare_add` | Add to compare | Product compared |

### UTM Parameters

All affiliate links support UTM parameters for campaign tracking:

| Parameter | Example | Purpose |
|-----------|---------|---------|
| `utm_source` | `amazon` | Traffic source (affiliate network) |
| `utm_medium` | `affiliate` | Marketing medium |
| `utm_campaign` | `buying-guide-skincare` | Campaign name |
| `utm_content` | `product-card` | Specific element clicked |
| `utm_term` | `cashmere-sweater` | Keyword/target |

---

## 3. Google Search Console

### Access
1. Go to https://search.google.com/search-console
2. Select property: `https://alayainsider.com`
3. Verify ownership (already done via DNS)

### Setup Steps (one-time)
1. ✅ Verify domain ownership (completed)
2. ✅ Submit sitemap: `https://alayainsider.com/sitemap.xml`
3. ❌ **Still needed:** Submit for initial indexation

### Key Reports

#### Performance
| Metric | What It Tells You |
|--------|-------------------|
| **Total Clicks** | How many users clicked through from search |
| **Total Impressions** | How many times your site appeared in search |
| **Average CTR** | Click-through rate (aim for >3%) |
| **Average Position** | Average ranking position (aim for <10) |

#### Index Coverage
| Status | Meaning |
|--------|---------|
| **Submitted and indexed** | Page is in Google's index ✅ |
| **Valid with warnings** | Indexed but has issues (e.g., missing meta description) |
| **Excluded** | Page intentionally excluded (e.g., #/ fragments) |
| **Error** | Page couldn't be indexed — needs investigation |

#### URL Inspection
- Test individual URLs for indexability
- Request indexing for new pages
- View rendered page (what Google sees)

### Weekly SEO Actions
1. Review top queries by clicks and impressions
2. Identify pages with high impressions but low CTR (improve meta descriptions)
3. Find new keyword opportunities from Search Console queries
4. Fix any index coverage errors

---

## 4. Microsoft Clarity

### Access
1. Go to https://clarity.microsoft.com
2. Project ID: `xka0e9jsv0`

### Key Features

#### Session Recordings
- Watch real user sessions recorded in-browser
- Filter by page, device, duration
- Identify friction points (rage clicks, dead clicks, quick backs)

#### Heatmaps
- **Click heatmap** — Where users click most
- **Scroll heatmap** — How far users scroll
- **Movement heatmap** — Mouse movement patterns

#### Dashboards
- **Overview** — Sessions, page views, bounce rate
- **Pages** — Top pages by engagement
- **Funnels** — User flow analysis

### Weekly Actions
1. Review 5-10 session recordings to identify UX issues
2. Check scroll heatmaps for below-the-fold content
3. Identify dead clicks (users clicking non-clickable elements)
4. Use insights to improve page layout and CTAs

---

## 5. Affiliate Click Tracking

### How It Works

```
User clicks "Buy on Amazon" button
        ↓
Frontend builds tracked URL via affiliateApi.ts
        ↓
/buildTrackedUrl adds UTM params + session data
        ↓
Redirect routes through /api/v1/affiliates/out
        ↓
Backend logs: merchant, product, country, device, campaign
        ↓
User is redirected to merchant URL with tracking ID
```

### Affiliate Analytics (Admin)
- **Clicks** — Total affiliate clicks per day/week/month
- **Top Merchants** — Best-performing merchants by clicks
- **Top Products** — Most-clicked products
- **Conversion Rate** — Clicks vs. estimated purchases (requires merchant data)
- **Geographic Distribution** — Clicks by country

### Key Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| **Click-through rate** | Clicks ÷ product page views | >5% |
| **Commission per click** | Estimated revenue per click | >$0.10 |
| **Top merchant %** | Share of clicks to top 3 merchants | <60% (diversified) |
| **Geo match rate** | % of users matched to their regional merchant | >80% |

### Merchant Tracking IDs

| Merchant | Tracking ID | Status |
|----------|-------------|--------|
| **Amazon** | `alayainsider-21` | ✅ Active |
| **Walmart** | Impact/CJ network | ✅ Active |
| **Other merchants** | Via affiliate networks | ✅ Active |

---

## 6. Key Performance Indicators (KPIs)

### Traffic KPIs

| KPI | Target | Frequency | Source |
|-----|--------|-----------|--------|
| **Monthly sessions** | 10,000 (Month 1) → 100,000 (Month 6) | Monthly | GA4 |
| **Bounce rate** | <55% | Weekly | GA4 |
| **Average session duration** | >2 minutes | Weekly | GA4 |
| **Pages per session** | >3 | Weekly | GA4 |
| **Organic traffic %** | >40% | Monthly | GA4 |
| **Search impressions** | >50,000/month | Monthly | Search Console |
| **Search CTR** | >3% | Weekly | Search Console |
| **Average position** | <15 | Weekly | Search Console |

### Conversion KPIs

| KPI | Target | Frequency | Source |
|-----|--------|-----------|--------|
| **Affiliate click-through rate** | >5% | Weekly | Admin Analytics |
| **Affiliate revenue per session** | >$0.05 | Monthly | GA4 + Admin |
| **Newsletter signup rate** | >2% | Monthly | Admin |
| **Cart to checkout rate** | >30% | Weekly | GA4 |
| **Checkout to purchase rate** | >50% | Weekly | GA4 |

### Content KPIs

| KPI | Target | Frequency | Source |
|-----|--------|-----------|--------|
| **Articles published per week** | 3+ | Weekly | Admin |
| **Avg search position for target keywords** | <10 | Monthly | Search Console |
| **SEO score** (avg across entities) | >80% (Grade B+) | Monthly | SEO Engine |
| **Articles with affiliate links** | 100% | Monthly | Admin |
| **Products with 3+ images** | >80% | Monthly | Admin |

### Technical KPIs

| KPI | Target | Frequency | Source |
|-----|--------|-----------|--------|
| **API health** | 99.9% uptime | Monthly | Railway |
| **API response time** | <200ms p95 | Weekly | Railway logs |
| **Database latency** | <50ms | Weekly | Health endpoint |
| **Worker queue empty** | >95% of time | Weekly | Job queue |
| **Page load time** | <3 seconds | Monthly | GA4 + Clarity |

---

## 7. Reporting Schedule

| Report | Frequency | Audience | Tools |
|--------|-----------|----------|-------|
| **Daily standup** | Daily | Operations | Railway, Admin Dashboard |
| **Weekly analytics** | Monday | Marketing | GA4, Search Console, Clarity |
| **Weekly content** | Monday | Editorial | Admin Articles |
| **Monthly business** | 1st of month | All | GA4, Admin, Spreadsheet |
| **Quarterly review** | Quarterly | All | Full analytics stack |

### Monthly Report Template

```
ALAYA INSIDER — Monthly Performance Report
Date: [Month] [Year]

1. Traffic Summary
   - Sessions: [number]
   - % Change: [+/-]%
   - Top source: [source]

2. Revenue & Conversions
   - Affiliate Revenue: $[amount]
   - Orders: [number]
   - AOV: $[amount]

3. Top Content
   - Traffic: [article], [article], [article]
   - Revenue: [article], [article], [article]

4. Marketing Performance
   - Top channels: [channel], [channel]
   - Best campaigns: [campaign]

5. Technical Health
   - Uptime: [number]%
   - Avg response time: [number]ms
   - Issues: [number]

6. Next Month Priorities
   - [Priority 1]
   - [Priority 2]
   - [Priority 3]
```
