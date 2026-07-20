# ALAYA INSIDER — Launch Assets: Import Package & Launch Checklist

> **Prepared:** July 2026 | **Purpose:** Production launch execution

---

## 1. CSV Import Template (Blank)

Copy and use this template for any product import batch:

```csv
name,brand,category,type,price,salePrice,stock,sku,barcode,gtin,asin,tags,shortDescription,description,featured,bestSeller,isNew,affiliate,affiliateUrl,affiliatePartner,images
[Product Name],[Brand Name],[Category],physical,[Price],[Sale Price],[Stock],[SKU],[Barcode],[GTIN],[ASIN],[tag1,tag2],[Short Description (120-160 chars)],[Full Description (300+ chars)],[true/false],[true/false],[true/false],[true/false],[Full Merchant URL],[merchant-slug],[image_url_1\nimage_url_2]
```

### CSV Field Specifications

| Column | Type | Max Length | Required | Notes |
|--------|------|-----------|----------|-------|
| name | string | 200 | ✅ | Product title — 30-60 chars ideal for SEO |
| brand | string | 100 | ❌ | Must match existing brand slug or create first |
| category | string | 100 | ✅ | Must match existing category slug |
| type | string | 20 | ❌ | Default: "physical". Options: physical, digital, variable, external |
| price | number | — | ✅ | Price in USD. No currency symbols. |
| salePrice | number | — | ❌ | Leave blank if no sale |
| stock | number | — | ❌ | Default: 0 |
| sku | string | 50 | ❌ | Leave blank for auto-generation |
| barcode | string | 50 | ❌ | UPC/EAN barcode |
| gtin | string | 50 | ❌ | Global Trade Item Number |
| asin | string | 20 | ❌ | Amazon ASIN — improves affiliate linking |
| tags | string | 500 | ❌ | Comma-separated keywords |
| shortDescription | string | 300 | ❌ | 120-160 chars optimal for SEO meta description |
| description | string | 10000 | ❌ | 300+ chars for SEO depth |
| featured | boolean | — | ❌ | true/false |
| bestSeller | boolean | — | ❌ | true/false |
| isNew | boolean | — | ❌ | true/false |
| affiliate | boolean | — | ❌ | true/false |
| affiliateUrl | string | 2000 | ❌ | Full URL including https:// |
| affiliatePartner | string | 100 | ❌ | Must match an existing affiliate partner slug |
| images | string | 5000 | ❌ | Newline-separated image URLs |

---

## 2. Import Validation Checklist (Pre-Import)

### Data Integrity

- [ ] **Names** — All product names are accurate, not truncated
- [ ] **Brands** — Each brand exists in admin or is being created
- [ ] **Categories** — Each category exists in admin or is being created
- [ ] **Prices** — Prices match current merchant listing (verify 3-5 products)
- [ ] **SKUs** — Are unique (no duplicates within batch)
- [ ] **ASINs** — Are valid Amazon Standard Identification Numbers (for Amazon products)
- [ ] **Tags** — 3-5 relevant tags per product, comma-separated
- [ ] **Short descriptions** — 120-160 characters, end-to-end complete sentences
- [ ] **Full descriptions** — 300+ characters, unique per product
- [ ] **Booleans** — `featured`, `bestSeller`, `isNew`, `affiliate` are valid `true/false`
- [ ] **Affiliate partners** — Merchant slugs match existing partner list (amazon, sephora, nordstrom)
- [ ] **Image URLs** — Valid URLs pointing to actual image files (test 3-5 URLs)

### Format Validation

- [ ] **CSV encoding** — UTF-8 with BOM (for Excel compatibility)
- [ ] **Quoted fields** — Descriptions with commas are wrapped in double quotes
- [ ] **Line endings** — Unix (LF) or Windows (CRLF) — both accepted
- [ ] **No empty rows** — Delete any blank rows at end of file
- [ ] **Header row** — First row matches template exactly

### Before Hitting "Import"

- [ ] **Export current catalog** — Save as backup before import
- [ ] **Create missing brands** — Check Admin → Brands, create any that don't exist
- [ ] **Create missing categories** — Check Admin → Categories
- [ ] **Add missing affiliate partners** — Check Admin → Affiliates
- [ ] **Preview import** — Click "Preview" in Admin → Merchant Import
- [ ] **Check preview table** — Scan for red "Error" badges
- [ ] **Verify row count** — Expected count matches actual count
- [ ] **Check for duplicates** — Verify "New" vs "Update" badges are correct

---

## 3. Post-Import Validation (After Import)

### Visual Verification

- [ ] Visit `https://alayainsider.com/#/shop` — Products display correctly
- [ ] **Product grid** — Cards render with image, name, price
- [ ] **Click 3 products** — Product detail pages load without errors
- [ ] **Images** — All images load (no broken image icons)
- [ ] **Prices** — Display correctly with currency symbol
- [ ] **Affiliate badges** — "Buy on Amazon" / "Buy on Nordstrom" buttons visible
- [ ] **Category filter** — Filtering by category returns correct products

### Functional Verification

- [ ] **Affiliate link** — Click a "Buy on Amazon" button — does it redirect to Amazon?
- [ ] **Affiliate link** — Verify `?tag=alayainsider-21` is in the redirect URL
- [ ] **Search** — Search for 3 product names — do they appear?
- [ ] **Cart** — Add a product to cart — does it work?
- [ ] **Wishlist** — Add a product to wishlist — does it work?

### SEO Verification

- [ ] **Product page title** — Displays correctly in browser tab
- [ ] **Product meta description** — View page source, verify description tag
- [ ] **OpenGraph tags** — View page source, verify OG tags present
- [ ] **JSON-LD schema** — View page source, verify Product schema present
- [ ] **Canonical URL** — View page source, verify canonical link

---

## 4. Launch Day Checklist

### Pre-Launch (T-1 Day)

- [ ] **Sitemap submitted** to Google Search Console (if not already)
- [ ] **GA4 property** `G-Z8MZF8WTFY` verified — check Realtime report
- [ ] **Microsoft Clarity** verified — check project is receiving data
- [ ] **Railway health** — `GET /api/v1/system/health` returns healthy
- [ ] **Frontend health** — `https://alayainsider.com` loads with 200
- [ ] **SSL certificates** — Valid for both domains
- [ ] **1st product batch** — CSV prepared and validated
- [ ] **3 articles** — Content briefs reviewed, content written, images sourced
- [ ] **Affiliate links** — All product links point to correct merchants
- [ ] **Affiliate disclosure** — Visible on test product page

### Launch Morning (Day 1, 09:00)

- [ ] **Import Product Batch #1** — Admin → Merchant Import → Upload CSV → Preview → Import
- [ ] **Verify products** — Check shop page, click 5 products
- [ ] **Publish Article #1** — "Best Vitamin C Serums 2026" → Publish
- [ ] **Verify article** — Check journal page, click through
- [ ] **Publish Article #2** — "The Ultimate Beginner's Skincare Routine" → Publish
- [ ] **Publish Article #3** — "Best Luxury Candles" → Publish
- [ ] **Test affiliate links** — Click from article → product → merchant — verify `alayainsider-21`
- [ ] **Check Search Console** — Request indexing for new pages
- [ ] **Verify GA4** — Check Realtime report has activity
- [ ] **Verify Clarity** — Check for first recordings
- [ ] **Post social media** — Share Article #1 on Instagram, Pinterest, X

### Launch Afternoon (Day 1, 14:00)

- [ ] **Check brand pages** — Verify brands from product import display correctly
- [ ] **Check category pages** — Verify beauty categories show new products
- [ ] **Internal linking** — Verify links between articles work
- [ ] **Run SEO analysis** — Check scores for new products and articles
- [ ] **Fix any issues** — Broken links, missing images, price errors
- [ ] **Review Railway logs** — Check for errors from traffic
- [ ] **Post second social share** — Article #2 on different platform

---

## 5. First Week Quality Assurance (Day 2-7)

### Day 2

- [ ] **Publish no new article** (let Day 1 content settle)
- [ ] **Review Clarity recordings** — Watch 3-5 sessions for UX issues
- [ ] **Check Search Console** — Indexing status for new pages
- [ ] **Monitor GA4** — Traffic sources, bounce rate, top pages
- [ ] **Fix any issues** discovered from real user behavior
- [ ] **Prepare Product Batch #2** (Fashion category — next 25 products)

### Day 3

- [ ] **Publish Article #4** — First article in Month 1 schedule (e.g., "Best Facial Moisturizers")
- [ ] **Import Product Batch #2** (Fashion products)
- [ ] **Verify Batch #2** — Same process as Day 1
- [ ] **Internal linking** — Link new article to Day 1 articles
- [ ] **Social promotion** — Share new article

### Day 4

- [ ] **Publish Article #5**
- [ ] **Weekly analytics review** — Sessions, affiliate clicks, search impressions
- [ ] **Check Clarity heatmaps** — See where users click on product pages
- [ ] **Affiliate link audit** — Verify all links in published articles still work

### Day 5

- [ ] **Publish Article #6**
- [ ] **Backend check** — Review Railway logs for week
- [ ] **SEO score review** — Run SEO analysis on all published content
- [ ] **Plan next week's content** — Refer to content calendar in Operations Handbook

### Day 6-7

- [ ] **Week 1 retrospective**:
  - Articles published: ___ / 7 target
  - Products imported: ___ / 25 target
  - Affiliate clicks: ___ 
  - GA4 sessions: ___
  - Search Console impressions: ___
  - Issues found & fixed: ___
- [ ] **Plan Week 2** — Content, products, priorities
- [ ] **Rest** — Sustainable pace is critical for long-term success

---

## 6. Sitemap & Search Console Submission

### Submit Sitemap to Google

```bash
# 1. Open Google Search Console
# 2. Select property: https://alayainsider.com
# 3. Navigate to: Indexing → Sitemaps
# 4. Enter: https://alayainsider.com/sitemap.xml
# 5. Click "Submit"
```

### Request Manual Indexing

For new articles and products, request indexing via URL Inspection:
```
1. Open Google Search Console → URL Inspection
2. Enter the full URL (e.g., https://alayainsider.com/#/journal/best-vitamin-c-serum)
3. Click "Request Indexing"
```

### Monitor Coverage

Check `Indexing → Pages` in Search Console daily for the first week:
- **Submitted & indexed** — ✅ Pages Google found and indexed
- **Valid with warnings** — ⚠️ Indexed but has issues
- **Excluded** — May be #/ fragment URLs — expected for SPA
- **Error** — ❌ Needs fixing

---

## 7. GA4 Event Verification

### Verify Events Are Firing

1. Open GA4 → Reports → Realtime
2. Load `https://alayainsider.com` in a new tab
3. Navigate to shop, click a product
4. Check Realtime report — should show:
   - `page_view` events for each page visited
   - `view_item` for product detail page
5. If no events appear:
   - Check browser console for GA4 errors
   - Verify `G-Z8MZF8WTFY` is the correct property ID
   - Check if ad-blocker is blocking analytics

### Verify Affiliate Click Tracking

1. Open GA4 → Events → All events
2. Click an affiliate link on the test product
3. Check if `affiliate_click` or `click` event appears in GA4
4. If missing — check affiliate API click tracking in admin dashboard
