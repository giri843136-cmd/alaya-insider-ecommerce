# ALAYA INSIDER — Admin User Manual

> **Version:** 1.0.0 | **Last updated:** 2026-07-20

---

## 1. Login

### Accessing the Admin Panel
1. Navigate to `https://alayainsider.com/#/admin/login`
2. Enter your admin credentials:
   - **Email:** `alayainsider@gmail.com` (default)
   - **Password:** Set via `ADMIN_PASSWORD` environment variable or store settings
3. Click **Sign in**

### Multi-Factor Authentication (if enabled)
- Admin supports email/SMS OTP and TOTP authenticator apps
- Configured via Admin → Auth Settings
- OTP_SECRET environment variable must be set for email OTP

### Session Management
- Active sessions are visible in Auth Center → Sessions
- You can revoke individual sessions or all sessions at once
- Trusted devices can be managed in Auth Center → Devices

---

## 2. Dashboard

The Admin Dashboard (`/#/admin/home`) provides a business overview:

### Key Metrics
| Metric | Description |
|--------|-------------|
| **Total Revenue** | Sum of all completed orders |
| **Total Orders** | Number of all orders |
| **Active Products** | Published products count |
| **Pending Orders** | Orders needing attention |
| **Affiliate Earnings** | Commission from affiliate links |
| **Avg Order Value** | Average revenue per order |

### Widgets
- **Revenue Chart** — Daily/weekly revenue trends
- **Order Status** — Breakdown by status (pending, processing, shipped, etc.)
- **Recent Orders** — Last 10 orders with quick actions
- **Top Products** — Best-selling products
- **Business Health** — Overall system health score
- **Backend Status** — Live connection indicator (green/amber/red dot)

---

## 3. Product Management

**Location:** Admin → Products (`/#/admin/products`)

### Product List
- Paginated table with search, filter, and sort
- Columns: Image, Name, SKU, Price, Stock, Category, Status, Actions
- Bulk actions: Delete selected, change status

### Create / Edit Product

#### Basic Information
| Field | Required | Description |
|-------|----------|-------------|
| **Name** | ✅ | Product title (30-60 chars for SEO) |
| **Slug** | ✅ | URL-friendly identifier (auto-generated) |
| **Brand** | ❌ | Select from existing brands |
| **Category** | ✅ | Select from existing categories |
| **Type** | ✅ | Physical, Digital, Variable, External |
| **Price** | ✅ | Base price in store currency |
| **Sale Price** | ❌ | Discounted price |
| **Stock** | ✅ | Inventory count |
| **SKU** | ❌ | Stock Keeping Unit |
| **Barcode** | ❌ | UPC/EAN barcode |
| **GTIN** | ❌ | Global Trade Item Number |
| **ASIN** | ❌ | Amazon Standard Identification Number |

#### Description
| Field | Description |
|-------|-------------|
| **Short Description** | Meta description (70-160 chars for SEO) |
| **Full Description** | Detailed product copy (300+ chars recommended) |
| **Features** | Bullet-point feature highlights |
| **Specifications** | Key-value spec table (size, material, etc.) |

#### Media
- Upload or paste image URLs
- Drag to reorder
- First image = primary / thumbnail

#### Variants
- Add variant groups (e.g., Size: S, M, L)
- Each combination can have its own price/stock

#### Affiliate Settings
| Field | Description |
|-------|-------------|
| **Is Affiliate** | Toggle affiliate linking |
| **Affiliate URL** | Direct merchant URL |
| **Affiliate Partner** | Select partner from affiliate list |

#### Statuses
| Status | Description |
|--------|-------------|
| **Draft** | Not visible on storefront |
| **Review** | Pending approval |
| **Published** | Visible on storefront |
| **Archived** | Hidden, kept for records |

#### Flags
- Featured, Best Seller, New, Coming Soon, Preorder

### Product SEO
- Each product has an SEO score (A-F grade)
- Checks: title length, description depth, image count, reviews, features, tags, specs, slug, SKU
- Suggestions provided for improvement
- Auto-generated meta title and description suggestions

---

## 4. Brand Management

**Location:** Admin → Brands (`/#/admin/brands`)

### Brand Fields
| Field | Required | Description |
|-------|----------|-------------|
| **Name** | ✅ | Brand/designer name |
| **Slug** | ✅ | URL identifier (auto-generated) |
| **Tagline** | ❌ | Short descriptive line |
| **Description** | ❌ | Brand story (150+ chars for SEO) |
| **Image** | ❌ | Banner/hero image |
| **Logo** | ❌ | Brand logo SVG or image |
| **Website** | ❌ | Brand's official website |
| **Instagram** | ❌ | Brand's Instagram handle |
| **Country** | ❌ | Country of origin |
| **Featured** | ❌ | Highlight on landing page |

### SEO
- Each brand gets an SEO score
- Checks: name, description, tagline, image, country

---

## 5. Category Management

**Location:** Admin → Categories (`/#/admin/categories`)

### Category Fields
| Field | Required | Description |
|-------|----------|-------------|
| **Name** | ✅ | Category name |
| **Slug** | ✅ | URL identifier (auto-generated) |
| **Tagline** | ❌ | SEO-friendly tagline |
| **Description** | ❌ | Full description (120+ chars for SEO) |
| **Image** | ❌ | Banner image |

### Collection Builder
**Location:** Admin → Collection Builder (`/#/admin/collection-builder`)
- Create curated product collections
- Add products manually or by category/tag filters
- Set collection order for homepage display

---

## 6. Article Publishing

**Location:** Admin → Articles (`/#/admin/articles`)

### Article List
- Paginated list with status filters
- Columns: Title, Author, Category, Published Date, Status

### Create / Edit Article

| Field | Required | Description |
|-------|----------|-------------|
| **Title** | ✅ | Article headline (30-60 chars for SEO) |
| **Slug** | ✅ | URL-friendly (auto-generated) |
| **Excerpt** | ✅ | Meta description (70-160 chars) |
| **Body** | ✅ | Content paragraphs (800+ chars recommended) |
| **Cover Image** | ✅ | Hero/featured image URL |
| **Author** | ✅ | Display name |
| **Author Role** | ❌ | Title (e.g., "Senior Editor") |
| **Category** | ✅ | Editorial category |
| **Tags** | ❌ | SEO keywords |
| **Read Time** | ❌ | Estimated reading minutes |
| **Featured** | ❌ | Highlight in journal |

### Article SEO
- Checks: title, excerpt, body depth, tags, cover image, slug, read time
- Grade A-F with improvement suggestions

### Author Profiles
**Location:** Admin → Author Profiles
- Manage author bios and profile images
- Displayed on article pages

---

## 7. Media Library

**Location:** Admin → Media (`/#/admin/media`)

### Upload
- Upload images from your computer
- Import from URL
- Import product images in bulk
- Upload to Cloudinary (if configured)

### Manage
- Grid/list view
- Search by filename
- Copy image URL
- Delete media

### Bulk Import
- Import product images from CSV/JSON (batch processing)
- Track import progress with batch ID
- Progress bar shows completion

---

## 8. Affiliate Settings

**Location:** Admin → Affiliates (`/#/admin/affiliates`)

### Affiliate Partners
| Field | Description |
|-------|-------------|
| **Partner Name** | Retailer name |
| **Website URL** | Affiliate URL |
| **Commission** | Commission percentage |
| **Active** | Toggle visibility on storefront |

### Partner List
- Shows linked product count for each partner
- Toggle active/inactive with switch
- Edit or delete partners

### Merchant Import/Export
**Location:** Admin → Merchant Import (`/#/admin/merchant-import`)

- **Import** merchants via CSV or JSON
- **Export** existing merchants
- Preview import before committing
- Validation with error/warning display
- Duplicate detection (auto-update vs. create)
- Progress tracking during import
- Results summary

### Commission Engine
**Location:** Admin → Commission Engine
- Configure commission rules per merchant
- Set tiered commission rates

---

## 9. SEO Settings

### Built-in SEO Features (automatic)
- Dynamic page titles and meta descriptions
- Open Graph tags for social sharing
- Twitter Cards for Twitter/X
- JSON-LD structured data (Organization, WebSite, Product, Article, FAQ, Breadcrumb)
- Canonical URLs
- XML Sitemap at `/sitemap.xml`
- Robots.txt at `/robots.txt`

### SEO Studio
**Location:** Admin → SEO (`/#/admin/seo`)
- Analyze individual pages/products
- SEO scoring per entity (A-F grade)
- Suggestions for improvement
- Auto-generated meta titles and descriptions

### Global SEO Settings
Configured in store settings:
- **Meta Title** — Site-wide default title
- **Meta Description** — Site-wide default description
- **Keywords** — Default keyword set
- **OG Image** — Default social share image
- **Twitter Handle** — @username for Twitter cards

---

## 10. Analytics

**Location:** Admin → Analytics (`/#/admin/analytics`)

### Built-in Analytics
| Report | Description |
|--------|-------------|
| **Overview** | Revenue, orders, customers summary |
| **Sales** | Sales by period (daily/weekly/monthly) |
| **Products** | Top/worst performing products |
| **Customers** | Customer acquisition and behavior |

### External Analytics (configured)
| Platform | ID |
|----------|-----|
| **Google Analytics 4** | `G-Z8MZF8WTFY` |
| **Microsoft Clarity** | `xka0e9jsv0` |
| **Google Search Console** | Sitemap ready for submission |

### Affiliate Analytics
- Click tracking via `/api/v1/affiliates/out`
- Per-merchant analytics
- Commission tracking
- Conversion data

---

## 11. Import / Export

**Location:** Admin → Products → Export / Admin → Merchant Import

### Product Import
See **Product Import Guide** (separate document) for full details.

### Product Export
- Export products to CSV
- All product fields included
- Download triggers automatically

### Merchant Import
- CSV or JSON format
- Preview before importing
- Auto-detects new vs. existing merchants
- Validates: name, ID, commission rate, trust score
- Progress bar and results summary

---

## 12. Additional Admin Sections

| Section | Purpose |
|---------|---------|
| **Orders** | Manage customer orders, update status |
| **Customers** | CRM, customer profiles, notes, tasks, timeline |
| **Coupons** | Create and manage discount codes |
| **Suppliers** | Supplier management for dropshipping |
| **Returns** | Handle return/refund requests |
| **Redirects** | URL redirect management (301, 302) |
| **Popups** | Marketing popup builder (newsletter, coupon, exit-intent) |
| **Design Studio** | Visual theme customization |
| **Notifications** | System alerts, approval requests |
| **Content Platform** | Full editorial CMS |
| **Conversion Optimization** | A/B testing, CRO tools |
| **Business Intelligence** | Deep analytics and reports |
| **Commerce Platform** | Full e-commerce management |
| **Supply Chain** | Supplier automation, purchase orders |
| **Admin Settings** | Global store configuration |
| **System** | Backend configuration, logging, maintenance |
