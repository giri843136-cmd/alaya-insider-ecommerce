# ALAYA INSIDER — Editorial Guide

> **Version:** 1.0.0 | **Last updated:** 2026-07-20

---

## 1. Article Workflow

### Publishing Pipeline

```
Draft  →  Review  →  Published  →  Archived
```

### Article Lifecycle

| Stage | Description |
|-------|-------------|
| **Draft** | Article is being written, not visible to public |
| **Review** | Pending approval from editor |
| **Published** | Visible on `/#/journal` and searchable |
| **Archived** | Removed from public view, kept for records |

### Creating an Article

1. Navigate to **Admin → Articles** (`/#/admin/articles`)
2. Click **"New Article"**
3. Fill in the fields (see Section 1.3)
4. Write your content in the body section (each paragraph is a separate block)
5. Add a cover image (minimum 1200×600px recommended)
6. Set tags for SEO
7. Click **Save as Draft** or **Publish**

### Article Fields

| Field | Required | SEO Best Practice |
|-------|----------|-------------------|
| **Title** | ✅ | 30-60 characters, include primary keyword |
| **Slug** | ✅ | Auto-generated from title (edit for brevity) |
| **Excerpt** | ✅ | 70-160 characters, used as meta description |
| **Body** | ✅ | 800+ characters total, split into logical paragraphs |
| **Cover Image** | ✅ | Use high-quality images, add alt text |
| **Author** | ✅ | Display name for byline |
| **Author Role** | ❌ | e.g., "Senior Editor" |
| **Category** | ✅ | Editorial category for grouping |
| **Tags** | ❌ | 3-8 SEO keywords |
| **Reading Time** | ❌ | Auto-calculated, override if needed |
| **Featured** | ❌ | Highlights article on journal homepage |

---

## 2. Buying Guides

### Template Structure

Buying guides follow a structured format with these components:

1. **Hero Section** — Large image, title, subtitle, CTA link
2. **Editorial Sections** — 3-6 sections with headings and body text
3. **Curated Product Picks** — Up to 4 products displayed as cards
4. **"What to Look For" Checklist** — Key considerations (6 items)
5. **CTA** — Link to full product catalog

### Pre-built Guide Topics

| Guide ID | Topic | Sections |
|----------|-------|----------|
| `capsule-wardrobe` | The Capsule Wardrobe Guide | 4 sections |
| `jewellery-care` | The Fine Jewellery Guide | 3 sections |
| `skincare-routine` | The Considered Skincare Guide | 3 sections |

### Writing a New Buying Guide

Each guide needs:
- **1 hero image** (21:9 aspect ratio, 1800×800px)
- **3-6 editorial sections** with a descriptive heading and 80-200 words each
- **4 curated products** that relate to the guide topic
- **6 checklist items** covering what readers should look for

### Dynamic Product Linking

Guides automatically show relevant products based on tag matching:
- Tags like `wardrobe`, `fashion`, `clothing` → Capsule Wardrobe Guide
- Tags like `jewellery`, `jewelry`, `ring` → Fine Jewellery Guide
- Tags like `skincare`, `beauty`, `cream` → Skincare Guide

### SEO Best Practices for Buying Guides
- **Title:** Include "Guide" or "How to" — high search volume
- **Description:** Promise actionable advice
- **Structure:** Use clear subheadings (H2, H3)
- **Product links:** Link to relevant products with affiliate disclosure
- **Word count:** 800-1500 words per guide
- **Featured snippet optimization:** Use numbered lists and tables

---

## 3. Reviews

### Review Components

ALAYA INSIDER has a full review system with:

#### Weighted Rating
- Calculated from all customer reviews
- Breaks down into categories (quality, value, fit, etc.)
- Confidence score based on number of reviews
- Displayed as a visual bar chart

#### Pros & Cons
- Automatically extracted from review text
- Displayed as side-by-side cards
- Green checkmarks for pros, red dots for cons

#### Rating Distribution
- 1-5 star breakdown with percentage bars
- Shows number of ratings per star level

#### Review Highlights
- "Top reviews" — highest-rated, most helpful
- Displays author name, rating, date, helpful count
- Verified badge for confirmed purchasers

#### Expert Review Badge
- "Expert review by [Name]" badge
- "Verified" badge for expert reviews
- Shown on product detail pages

### Managing Reviews (Admin)

1. Navigate to **Admin → Reviews**
2. **Moderate** reviews — approve, reject, pin
3. **Pin** important reviews to the top of the list
4. **Mark helpful** — this affects highlight selection

### SEO for Review Content
- Reviews generate unique content for product pages
- Google's Product Snippet rich results use review data
- Aim for 5+ reviews per product for AggregateRating schema
- Respond to negative reviews professionally

---

## 4. Comparison Articles

### Comparison Engine

The Comparison Engine (`ComparisonEngine.tsx`) provides:

- **Side-by-side product comparison** (up to 4 products)
- **Price comparison** from different merchants
- **Feature comparison table**
- **Rating comparison**
- **Add/Remove products** to compare

### Creating Comparison Content

1. Navigate to **Admin → Articles**
2. Create a new article in the "Comparison" category
3. Structure your article:
   - **Introduction** — What's being compared and why
   - **Individual product breakdowns** — Paragraph per product
   - **Comparison table** — Summary of key specs side by side
   - **Verdict** — Which product wins and why

### Example Comparison Topics
- "Amazon vs Walmart: Where to Shop for Home Goods"
- "Top 10 Wireless Headphones Compared (2026)"
- "Best Air Fryers Tested & Reviewed"
- "Sephora vs Ulta: Beauty Shopping Comparison"

---

## 5. Affiliate Disclosure

### FTC Compliance

Every page with affiliate links must include disclosure. ALAYA INSIDER provides two variants:

#### Full Disclosure (product pages)
```html
<AffiliateDisclosure provider="Amazon" />
```
Displays a prominent box with:
- Provider name (e.g., "Amazon Affiliate Disclosure")
- FTC-compliant standard text
- Explanation that we earn commissions at no cost to the reader
- Statement that all opinions are our own

#### Compact Disclosure (inline links)
```html
<AffiliateDisclosure provider="Amazon" compact />
```
Shows a small `ⓘ Amazon affiliate` badge next to affiliate links.

### Where to Place Disclosure
| Location | Type | Required |
|----------|------|----------|
| Product detail page | ✅ Full | Yes |
| Affiliate link buttons | ✅ Compact | Yes |
| Article with affiliate links | ✅ Full (top of article) | Yes |
| Comparison page | ✅ Full | Yes |
| Buying guide | ✅ Full | Yes |

### Disclosure Text
```
ALAYA INSIDER participates in various affiliate marketing programs,
which means we may earn commissions on purchases made through our
links to retailer sites. This does not affect the price you pay.

We only recommend products we genuinely believe in.
All opinions are our own.
```

---

## 6. SEO Checklist for Every Article

### Pre-Publish Checklist

- [ ] **Title:** 30-60 characters, includes primary keyword
- [ ] **Slug:** Short, descriptive, contains keyword
- [ ] **Excerpt:** 70-160 characters, includes secondary keywords
- [ ] **Cover image:** High-quality, properly credited
- [ ] **Body:** 800+ words minimum (1500+ for buying guides)
- [ ] **Subheadings:** H2 tags every 200-300 words
- [ ] **Internal links:** Link to 2-3 related products or articles
- [ ] **Affiliate links:** With proper disclosure
- [ ] **Canonical URL:** Auto-set, verify no duplicates
- [ ] **Tags:** 3-8 relevant keywords
- [ ] **Author byline:** Present and linked to author profile
- [ ] **Reading time:** Accurate (3-8 min ideal)
- [ ] **JSON-LD:** Article schema auto-generated
- [ ] **OpenGraph image:** 1200×630px for social sharing

### After Publishing
- [ ] Submit to Google Search Console for indexing
- [ ] Share on social media channels
- [ ] Add to related newsletter if applicable
- [ ] Monitor search rankings weekly

---

## 7. Editorial Calendar Strategy

### Publishing Cadence
| Phase | Frequency | Focus |
|-------|-----------|-------|
| **Launch** (Month 1) | 3-4 articles/week | Foundation content, high-SEO topics |
| **Growth** (Month 2-3) | 3 articles/week | Comparison + guide articles |
| **Scale** (Month 4+) | 2-3 articles/week | Seasonal + trending topics |

### Content Mix
| Type | Percentage | Purpose |
|------|-----------|---------|
| **Buying Guides** | 35% | Long-tail search traffic, high conversion |
| **Comparison Articles** | 25% | Purchase-intent keywords |
| **Product Reviews** | 25% | Product-specific searches |
| **Editorial / Stories** | 15% | Brand building, social shares |

### Seasonality Calendar

| Month | Theme | Article Topics |
|-------|-------|----------------|
| **January** | New Year Reset | Skincare routines, home organization |
| **February** | Valentine's | Gift guides, jewellery guide |
| **March** | Spring Refresh | Spring fashion, home decor |
| **April** | Earth Month | Sustainable brands, ethical fashion |
| **May** | Wedding Season | Engagement rings, bridal beauty |
| **June** | Summer Essentials | Swimwear, travel accessories |
| **July** | Sale Season | Prime Day deals, summer sales |
| **August** | Back to School | Tech essentials, bags |
| **September** | Fall Fashion | Wardrobe transition, boots |
| **October** | Cozy Season | Home fragrance, cashmere care |
| **November** | Gift Season | Holiday gift guides, Black Friday |
| **December** | Festive | Luxury gifts, party wear |
