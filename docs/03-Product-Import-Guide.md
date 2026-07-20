# ALAYA INSIDER — Product Import Guide

> **Version:** 1.0.0 | **Last updated:** 2026-07-20

---

## 1. Overview

Products can be imported into ALAYA INSIDER using:
- **CSV** — Best for 50+ products from spreadsheets
- **JSON** — Best for API-driven transfers or migrations

The import pipeline runs in the Admin panel with:
- Preview mode (parse without saving)
- Per-row validation with detailed error messages
- Duplicate detection by slug/product ID
- Rollback support (API-level create/update tracking)
- Real-time progress bar

---

## 2. CSV Template

### Column Headers (exact order)

```csv
name,brand,category,type,price,salePrice,stock,sku,barcode,gtin,asin,tags,shortDescription,description,featured,bestSeller,isNew,affiliate,affiliateUrl,affiliatePartner,images
```

### Example Row

```csv
Silk Crepe Maxi Dress,Alaya Studio,Womens Fashion,physical,295,249,50,SKU-SCMD-001,8712345678905,,,evening wear,dress,silk,The epitome of evening elegance...,This exquisite silk crepe maxi dress...,false,true,true,true,https://amazon.com/dp/B0ABC12345,amazon,https://images.pexels.com/photo1.jpg
```

### Full Example (3 products)

```csv
name,brand,category,type,price,salePrice,stock,sku,barcode,gtin,asin,tags,shortDescription,description,featured,bestSeller,isNew,affiliate,affiliateUrl,affiliatePartner,images
Cashmere Crew Neck Sweater,Alaya Studio,Womens Fashion,physical,225,195,100,SKU-CCNS-001,8712345678901,,,cashmere,sweater,knitwear,Luxuriously soft cashmere crew neck...,Handcrafted from 100% Mongolian cashmere...,true,true,false,true,https://amazon.com/dp/B0XYZ12345,amazon,https://images.pexels.com/photo1.jpg
Italian Leather Tote,Artisan Leather,Accessories,physical,450,395,25,SKU-ILT-001,8712345678902,,B0ABC67890,leather,tote,handbag,Handcrafted Italian leather tote...,Full-grain Italian leather tote with gold hardware...,false,true,true,false,,,https://images.pexels.com/photo2.jpg
Minimalist Ceramic Vase,Homestead,Home & Living,physical,85,65,200,SKU-MCV-001,8712345678903,,,ceramic,vase,minimal,Clean-lined ceramic vase for modern spaces...,Wheel-thrown ceramic vase with matte glaze finish...,true,false,true,true,https://wayfair.com/vase,wayfair,https://images.pexels.com/photo3.jpg
```

---

## 3. Required Fields

| Column | Validation | Notes |
|--------|-----------|-------|
| **name** | ✅ Required | Product title. If missing, row is rejected with "Missing name" error. |
| **category** | ✅ Required | Must match an existing category slug. If missing, row falls to "uncategorised". |
| **price** | ✅ Numeric | Must be a valid number. If invalid, row is still imported with price set to 0. |

---

## 4. Optional Fields

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| **brand** | string | Empty | Must match an existing brand slug |
| **type** | string | `physical` | Options: `physical`, `digital`, `variable`, `external` |
| **salePrice** | number | Empty | Leave blank if no sale |
| **stock** | number | `0` | Inventory count |
| **sku** | string | Auto-generated | Leave blank for auto-generation |
| **barcode** | string | Empty | UPC or EAN barcode |
| **gtin** | string | Empty | Global Trade Item Number |
| **asin** | string | Empty | Amazon ASIN for affiliate linking |
| **tags** | string | Empty | Comma or `/` separated keywords |
| **shortDescription** | string | Empty | Meta description (70-160 chars best for SEO) |
| **description** | string | Empty | Full product description (300+ chars best for SEO) |
| **featured** | boolean | `false` | `true` or `false` |
| **bestSeller** | boolean | `false` | `true` or `false` |
| **isNew** | boolean | `false` | `true` or `false` |
| **affiliate** | boolean | `false` | Is this an affiliate-linked product? |
| **affiliateUrl** | string | Empty | Full URL to merchant product page |
| **affiliatePartner** | string | Empty | Must match an affiliate partner name |
| **images** | string | Empty | Newline-separated image URLs |

---

## 5. JSON Format

```json
[
  {
    "name": "Cashmere Crew Neck Sweater",
    "brand": "Alaya Studio",
    "category": "Womens Fashion",
    "type": "physical",
    "price": 225,
    "salePrice": 195,
    "stock": 100,
    "sku": "SKU-CCNS-001",
    "barcode": "8712345678901",
    "tags": ["cashmere", "sweater", "knitwear"],
    "shortDescription": "Luxuriously soft cashmere crew neck...",
    "description": "Handcrafted from 100% Mongolian cashmere...",
    "featured": true,
    "bestSeller": true,
    "affiliate": true,
    "affiliateUrl": "https://amazon.com/dp/B0XYZ12345",
    "affiliatePartner": "amazon",
    "images": ["https://images.pexels.com/photo1.jpg"]
  }
]
```

### JSON Import Rules
- Must be an array of objects
- Each object follows the same field rules as CSV
- Arrays (tags, images) are native JSON arrays
- Boolean values are native booleans (not strings)

---

## 6. Validation Rules

### Per-Row Validation

| Check | Rule | Error Example |
|-------|------|---------------|
| **Name** | Must be non-empty | `Missing name` |
| **Category** | Must be non-empty | `Missing category` |
| **Price** | Must be valid number | `Invalid price` |
| **Commission Rate** (merchants) | 0-100 | `Commission rate must be 0-100` |
| **Trust Score** (merchants) | 0-100 | Warning: `Trust score must be 0-100` |

### Duplicate Detection

- **Products:** Compared by slug (derived from name)
- **Merchants:** Compared by slug/ID
- New items marked with green "New" badge
- Existing items marked with amber "Update" badge
- Duplicates skip creation and trigger update instead

---

## 7. Import Process

### Step-by-Step

1. **Prepare your CSV/JSON file** using the template above
2. Navigate to **Admin → Merchant Import** (`/#/admin/merchant-import`)
   - For products: use the Products page export/import
3. **Upload** your file or paste the content
4. **Preview** — the system parses and validates every row
5. **Review errors** — rows with errors are highlighted in red
6. **Confirm import** — click "Import X products"
7. **Monitor progress** — progress bar shows completion
8. **Review results** — summary shows imported/updated/errors

### Preview Table Columns

| Column | Description |
|--------|-------------|
| **#** | Row number |
| **Name** | Product/merchant name (red if missing) |
| **ID** | Identifier (auto-generated if missing) |
| **Countries** | (Merchants) Target countries |
| **Comm.** | (Merchants) Commission rate |
| **Priority** | (Merchants) Failover priority |
| **Status** | New / Update / Error |

---

## 8. Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Missing name` | Product name is blank | Fill in the name column |
| `Missing category` | Category is blank | Specify an existing category |
| `Invalid price` | Price is not a number | Use numeric format (no currency symbols) |
| `Parse error` | Malformed CSV/JSON | Check quotes, commas, and brackets |
| `Duplicate` | Product/merchant already exists | Will auto-update instead of creating |
| `Commission rate must be 0-100` | Invalid commission value | Set between 0 and 100 |
| `API create failed` | Backend error | Check Railway logs for details |
| `API update failed` | Backend error | Check Railway logs for details |

---

## 9. Best Practices

### Before Importing
1. **Export the current catalog** first as backup
2. **Start with 5 test products** to validate your format
3. **Verify categories exist** — create missing categories first
4. **Verify brands exist** — brands are matched by name
5. **Verify affiliate partners exist** — add missing partners first
6. **Use shortDescriptions of 70-160 characters** — best for SEO
7. **Use full descriptions of 300+ characters** — improves search ranking

### SEO Optimization for Products
- **Title:** 30-60 characters, include primary keyword
- **Short description:** 120-160 characters, include secondary keywords
- **Full description:** 300+ characters, naturally incorporate keywords
- **Tags:** 3-8 relevant tags
- **Images:** 3+ high-quality images
- **Features:** 3+ bullet-point features
- **Specifications:** 4+ key-value pairs for rich results

### Bulk Import Strategy
- **≤ 100 products:** Single CSV file, all at once
- **100-500 products:** Split into category-based batches
- **500+ products:** Import by category, one category at a time
- **First import:** Start with Beauty (highest affiliate commission)

### Affiliate Products
- Set `affiliate=true` and provide a valid `affiliateUrl`
- Set `affiliatePartner` to the merchant name
- Products display "Buy on [Partner]" buttons
- All affiliate links route through click tracking

---

## 10. Post-Import Checklist

- [ ] Verify products appear on the shop page (`/#/shop`)
- [ ] Click through to 3-5 product detail pages
- [ ] Test affiliate links — ensure redirect works
- [ ] Check product images load correctly
- [ ] Verify prices and sale prices display correctly
- [ ] Check categories filter works
- [ ] Run SEO analysis on imported products
- [ ] Submit updated sitemap to Google Search Console
