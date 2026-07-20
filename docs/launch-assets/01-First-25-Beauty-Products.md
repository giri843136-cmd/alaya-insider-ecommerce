# ALAYA INSIDER — Launch Assets: First 25 Beauty Products

> **Prepared:** July 2026 | **Purpose:** Production product import batch #1
> **Category:** Beauty & Skincare | **Total Products:** 25

---

## 1. Product Selection Strategy

**Criteria applied:**
- Real, commercially available products on supported merchants (Amazon, Sephora, Nordstrom)
- Mix of price points ($10–$185) to serve budget-conscious through luxury audiences
- Products with proven search demand (each tied to a target keyword from the SEO Master Plan)
- Products the ALAYA INSIDER editorial team can genuinely review/test
- Priority to Amazon availability (highest conversion rate) with Sephora/Nordstrom as alternates

**Merchant allocation:**
- Amazon primary (18 products) — for highest conversion rate via `alayainsider-21`
- Sephora secondary (4 products) — for prestige/exclusive brands
- Nordstrom tertiary (3 products) — for luxury brands

---

## 2. Product Catalog (25 Products)

### Cleansers (5)

| # | Product Name | Brand | Category | Est. Price | Merchant | Est. Commission |
|---|-------------|-------|----------|-----------|----------|----------------|
| 1 | Hydrating Facial Cleanser | CeraVe | Cleanser | $15.99 | Amazon | $0.48 |
| 2 | Gentle Facial Cleanser | Vanicream | Cleanser | $12.99 | Amazon | $0.39 |
| 3 | Superfood Cleanser | Youth To The People | Cleanser | $42.00 | Sephora | $2.10 |
| 4 | Oil Cleanser | DHC Deep Cleansing Oil | Cleanser | $16.00 | Amazon | $0.48 |
| 5 | Micellar Water | Bioderma Sensibio H2O | Cleanser | $18.99 | Amazon | $0.57 |

### Serums & Treatments (8)

| # | Product Name | Brand | Category | Est. Price | Merchant | Est. Commission |
|---|-------------|-------|----------|-----------|----------|----------------|
| 6 | C E Ferulic | SkinCeuticals | Serum (Vitamin C) | $185.00 | Nordstrom | $7.40 |
| 7 | 10% Pure Vitamin C Serum | La Roche-Posay | Serum (Vitamin C) | $42.99 | Amazon | $1.29 |
| 8 | CEO 15% Vitamin C Brightening Serum | Sunday Riley | Serum (Vitamin C) | $85.00 | Sephora | $4.25 |
| 9 | Vitamin C Facial Serum | TruSkin | Serum (Vitamin C) | $19.99 | Amazon | $0.60 |
| 10 | Niacinamide 10% + Zinc 1% | The Ordinary | Serum (Treatment) | $9.50 | Amazon | $0.29 |
| 11 | 2% BHA Liquid Exfoliant | Paula's Choice | Serum (Exfoliant) | $35.00 | Amazon | $1.05 |
| 12 | Retinol 0.5% in Squalane | The Ordinary | Serum (Retinol) | $11.00 | Amazon | $0.33 |
| 13 | Hyaluronic Acid 2% + B5 | The Ordinary | Serum (Hydration) | $10.50 | Amazon | $0.32 |

### Moisturizers (5)

| # | Product Name | Brand | Category | Est. Price | Merchant | Est. Commission |
|---|-------------|-------|----------|-----------|----------|----------------|
| 14 | Daily Moisturizing Lotion | CeraVe | Moisturizer | $16.99 | Amazon | $0.51 |
| 15 | Cicaplast Balm B5 | La Roche-Posay | Moisturizer | $18.99 | Amazon | $0.57 |
| 16 | Honey Halo Ultra-Hydrating Ceramide Moisturizer | Farmacy | Moisturizer | $49.00 | Sephora | $2.45 |
| 17 | Water Cream Facial Moisturizer | Tatcha | Moisturizer | $72.00 | Sephora | $3.60 |
| 18 | Crème de la Mer | La Mer | Moisturizer | $180.00 | Nordstrom | $7.20 |

### Sunscreen (3)

| # | Product Name | Brand | Category | Est. Price | Merchant | Est. Commission |
|---|-------------|-------|----------|-----------|----------|----------------|
| 19 | UV Clear Face Sunscreen SPF 46 | EltaMD | Sunscreen | $44.00 | Amazon | $1.32 |
| 20 | Unseen Sunscreen SPF 40 | Supergoop! | Sunscreen | $38.00 | Amazon | $1.14 |
| 21 | Sensitive Mineral SPF 50 | Blue Lizard | Sunscreen | $17.99 | Amazon | $0.54 |

### Eye Care & Treatments (4)

| # | Product Name | Brand | Category | Est. Price | Merchant | Est. Commission |
|---|-------------|-------|----------|-----------|----------|----------------|
| 22 | Creamy Eye Treatment with Avocado | Kiehl's | Eye Care | $35.00 | Amazon | $1.05 |
| 23 | Advanced Génifique Yeux Eye Cream | Lancôme | Eye Care | $75.00 | Nordstrom | $3.00 |
| 24 | Mighty Patch Original | Hero Cosmetics | Spot Treatment | $13.99 | Amazon | $0.42 |
| 25 | Moisture Surge 100H Auto-Replenishing Hydrator | Clinique | Moisturizer | $55.00 | Amazon | $1.65 |

---

## 3. CSV-Read File Mapping

Below is the populated CSV ready for import via Admin → Merchant Import.

```csv
name,brand,category,type,price,salePrice,stock,sku,asin,tags,shortDescription,description,featured,bestSeller,isNew,affiliate,affiliatePartner,images
Hydrating Facial Cleanser,CeraVe,Cleanser,physical,15.99,,100,SKU-BTY-001,,cleanser,face wash,dry skin,Gentle non-stripping hydrating facial cleanser with essential ceramides that restores the skin barrier while cleansing without disrupting moisture levels.,Formulated with three essential ceramides that restore and maintain the skin's natural barrier. This hydrating non-foaming cleanser removes dirt oil and makeup without stripping the skin or leaving it feeling tight and dry. Suitable for normal to dry skin types. Fragrance-free and non-comedogenic.,true,true,true,true,amazon,[NEED AMAZON PRODUCT URL]
Gentle Facial Cleanser,Vanicream,Cleanser,physical,12.99,,100,SKU-BTY-002,,cleanser,sensitive skin,fragrance free,Dermatologist-developed gentle facial cleanser free of common irritants perfect for sensitive skin and allergy-prone skin types.,Free of dyes fragrance lanolin parabens formaldehyde and other common irritants. This gentle foaming cleanser effectively removes dirt oil and makeup without compromising the skin barrier. Developed with dermatologists and recommended for sensitive skin including those with eczema and rosacea. Non-comedogenic and soap-free.,false,false,false,true,amazon,[NEED AMAZON PRODUCT URL]
Superfood Cleanser,Youth To The People,Cleanser,physical,42.00,,75,SKU-BTY-003,,cleanser,superfood,green,Antioxidant-rich daily gel cleanser infused with kale spinach and green tea to deeply cleanse while nourishing the skin with vitamins and minerals.,This concentrated gel cleanser is made with a proprietary blend of superfoods including kale spinach and green tea to deliver powerful antioxidants and vitamins with every wash. Gently removes makeup dirt and excess oil while maintaining the skin's natural moisture barrier. Suitable for all skin types. Vegan and cruelty-free.,false,false,false,true,sephora,[NEED SEPHORA PRODUCT URL]
DHC Deep Cleansing Oil,DHC,Cleanser,physical,16.00,,80,SKU-BTY-004,,cleansing oil,japanese,makeup remover,Japanese-formulated deep cleansing oil that dissolves makeup and unclogs pores using antioxidant-rich olive oil for a clean refreshed complexion.,Made with 80% olive oil this cult-favorite cleansing oil melts away waterproof makeup sunscreen and excess sebum without stripping the skin. The oil transforms into a milky emulsion upon contact with water rinsing cleanly away. Leaves skin soft smooth and hydrated. Non-comedogenic.,false,false,false,true,amazon,[NEED AMAZON PRODUCT URL]
Sensibio H2O Micellar Water,Bioderma,Cleanser,physical,18.99,,90,SKU-BTY-005,,micellar water,french,sensitive skin,French pharmacy micellar water that gently removes makeup and cleanses sensitive skin without rinsing. A global best-seller for sensitive and reactive skin.,The original micellar water that started the trend. Utilizing patented micelle technology to encapsulate and lift away impurities makeup and pollution particles without rubbing. Contains calming ingredients to soothe sensitive and reactive skin. No rinsing required. Suitable for face eyes and lips. Suitable for even the most sensitive skin types.,false,false,false,true,amazon,[NEED AMAZON PRODUCT URL]
C E Ferulic,SkinCeuticals,Serum,physical,185.00,,50,SKU-BTY-006,,vitamin c,serum,antioxidant,The gold-standard antioxidant serum combining pure vitamin C vitamin E and ferulic acid for advanced environmental protection and visible anti-aging benefits.,The most clinically proven vitamin C serum on the market. This synergistic formula combines 15% pure L-ascorbic acid 1% alpha tocopherol (vitamin E) and 0.5% ferulic acid to neutralize free radicals and provide advanced environmental protection. Independently tested to improve the appearance of fine lines and wrinkles firmness and brightness. Apply 4-5 drops every morning. The dermatologist gold standard.,true,true,false,true,nordstrom,[NEED NORDSTROM PRODUCT URL]
10% Pure Vitamin C Serum,La Roche-Posay,Serum,physical,42.99,,60,SKU-BTY-007,,vitamin c,serum,sensitive skin,Stabilized 10% pure vitamin C serum with salicylic acid and neurosensine to brighten skin and reduce dark spots while soothing sensitive skin.,This dermatologist-formulated serum combines 10% pure vitamin C with salicylic acid and neurosensine to effectively target dark spots uneven skin tone and fine lines while soothing sensitive skin. The stabilized formula ensures maximum antioxidant efficacy. Fragrance-free paraben-free and allergy-tested. Suitable for sensitive skin.,false,false,false,true,amazon,[NEED AMAZON PRODUCT URL]
CEO 15% Vitamin C Brightening Serum,Sunday Riley,Serum,physical,85.00,,40,SKU-BTY-008,,vitamin c,brightening,luxury,High-potency 15% vitamin C serum with fruit enzymes that brightens dull uneven skin and delivers antioxidant protection for a luminous complexion.,A potent brightening serum featuring a highly stable form of vitamin C (THD ascorbate) at 15% concentration. Enhanced with fruit enzymes to gently exfoliate and reveal brighter more even-toned skin. Contains alpha-arbutin and ferulic acid to boost brightening benefits. Lightweight gel texture absorbs quickly. Suitable for all skin types including sensitive.,false,false,false,true,sephora,[NEED SEPHORA PRODUCT URL]
Vitamin C Facial Serum,TruSkin,Serum,physical,19.99,,120,SKU-BTY-009,,vitamin c,budget,hyaluronic acid,Amazon's #1 best-selling vitamin C serum with hyaluronic acid vitamin E and botanicals for brightening and anti-aging at an accessible price point.,Amazon's most popular vitamin C serum. Formulated with a stabilized vitamin C complex combined with hyaluronic acid for hydration vitamin E for nourishment and botanical MSM for skin support. Helps brighten the appearance of dull skin and reduce the look of fine lines and dark spots. Affordable effective and suitable for daily use.,false,false,true,true,amazon,[NEED AMAZON PRODUCT URL]
Niacinamide 10% + Zinc 1%,The Ordinary,Serum,physical,9.50,,200,SKU-BTY-010,,niacinamide,zinc,sebum,High-concentration niacinamide serum with zinc that reduces the appearance of blemishes and congestion while balancing visible sebum activity.,A high-strength vitamin B3 formula that targets multiple skin concerns. 10% Niacinamide works to reduce the appearance of blemishes and congestion while improving skin texture. Zinc PCA helps balance visible sebum activity. Lightweight water-based formula. Apply before moisturizer day and night. Suitable for all skin types.,false,false,true,true,amazon,[NEED AMAZON PRODUCT URL]
2% BHA Liquid Exfoliant,Paula's Choice,Serum,physical,35.00,,80,SKU-BTY-011,,bha,exfoliant,salicylic acid,Leave-on exfoliant with 2% salicylic acid that unclogs pores smooths wrinkles and brightens skin tone. A cult-favorite for achieving smoother more radiant skin.,The cult-favorite leave-on exfoliant that delivers visible results. Formulated with 2% salicylic acid (BHA) to exfoliate inside the pore and on the skin's surface. Unclogs pores smoothes fine lines and wrinkles and brightens uneven skin tone. Contains green tea to soothe. Non-abrasive and alcohol-free. Suitable for daily use on all skin types.,false,false,false,true,amazon,[NEED AMAZON PRODUCT URL]
Retinol 0.5% in Squalane,The Ordinary,Serum,physical,11.00,,100,SKU-BTY-012,,retinol,anti-aging,beginner,Entry-level retinol serum formulated with squalane for gradual introduction to retinoids. Targets fine lines uneven texture and signs of aging.,A gentle entry-point into retinoid skincare. Formulated with 0.5% retinol (encapsulated for gradual release) in a base of squalane and moisturizing ingredients. Targets the appearance of fine lines uneven skin texture and congestion. Ideal for those new to retinol. Use in PM routine only and always follow with SPF in the morning.,false,false,true,true,amazon,[NEED AMAZON PRODUCT URL]
Hyaluronic Acid 2% + B5,The Ordinary,Serum,physical,10.50,,200,SKU-BTY-013,,hyaluronic acid,hydration,plumping,Pure hyaluronic acid serum with vitamin B5 that delivers targeted deep hydration for a plump and bouncy complexion at an accessible price point.,A simple effective hydration serum. Formulated with three forms of hyaluronic acid at varying molecular weights to target different layers of the skin combined with vitamin B5 to enhance surface hydration. Delivers a noticeable plumping effect while improving skin texture. Suitable for all skin types. Layer before moisturizer day and night.,false,false,true,true,amazon,[NEED AMAZON PRODUCT URL]
Daily Moisturizing Lotion,CeraVe,Moisturizer,physical,16.99,,150,SKU-BTY-014,,moisturizer,dry skin,ceramides,Dermatologist-recommended daily moisturizer with three essential ceramides that hydrates and restores the protective skin barrier for normal to dry skin.,The dermatologist-recommended moisturizer trusted by millions. Formulated with three essential ceramides (1 3 6-II) to restore and maintain the skin's natural barrier. Contains hyaluronic acid to attract moisture to the skin's surface. MVE Technology delivers controlled release of ingredients for long-lasting hydration. Fragrance-free non-comedogenic and suitable for sensitive skin.,true,true,false,true,amazon,[NEED AMAZON PRODUCT URL]
Cicaplast Balm B5,La Roche-Posay,Moisturizer,physical,18.99,,100,SKU-BTY-015,,balm,sensitive,repair,Multi-purpose soothing balm with panthenol that repairs irritated compromised skin and provides intense comfort for dry cracked or sensitive skin.,A universal multi-purpose repairing balm formulated with 5% panthenol (vitamin B5) to soothe and repair irritated or compromised skin. Contains shea butter for nourishment and Madecassoside for soothing. Provides immediate comfort to dry cracked chapped or post-procedure skin. Suitable for face body and lips. Fragrance-free and paraben-free.,false,false,false,true,amazon,[NEED AMAZON PRODUCT URL]
Honey Halo Ultra-Hydrating Ceramide Moisturizer,Farmacy,Moisturizer,physical,49.00,,60,SKU-BTY-016,,moisturizer,honey,ceramide,Rich ceramide-infused moisturizer with Echinacea GreenEnvy honey that delivers 72-hour hydration while strengthening the skin barrier for a healthy glow.,A rich yet weightless moisturizer that delivers 72-hour hydration. Formulated with Farmacy's Echinacea GreenEnvy honey to soothe and nourish plus three types of ceramides to strengthen the moisture barrier. Contains shea butter and squalane for deep lasting moisture. The honey-like texture melts into skin leaving it soft supple and radiant. Suitable for normal to dry skin.,false,false,false,true,sephora,[NEED SEPHORA PRODUCT URL]
Water Cream Facial Moisturizer,Tatcha,Moisturizer,physical,72.00,,50,SKU-BTY-017,,moisturizer,luxury,water cream,Lightweight oil-free water cream that floods skin with hydration and nutrients for a healthy-looking glow without heaviness or shine.,A breakthrough water cream that provides 24-hour hydration without heaviness. Formulated with Japanese wild rose to refine the look of pores and a unique blend of hyaluronic acid and Okinawa red algae to deliver deep yet weightless hydration. The gel-cream texture transforms into water upon application. Oil-free and suitable for combination to oily skin types including sensitive.,false,false,false,true,sephora,[NEED SEPHORA PRODUCT URL]
Crème de la Mer,La Mer,Moisturizer,physical,180.00,,30,SKU-BTY-018,,moisturizer,luxury,anti-aging,The iconic luxury moisturizer fermented with Miracle Broth that deeply hydrates restores and transforms the appearance of skin for a luminous youthful look.,The legendary moisturizer that started it all. At the heart of Crème de la Mer is the signature Miracle Broth a potent blend of sea kelp and other nutrient-rich ingredients fermented for months. This rich cream delivers deep hydration while transforming the look and feel of skin. Helps improve the appearance of fine lines wrinkles and loss of firmness. A true investment in luxurious skincare.,false,false,false,true,nordstrom,[NEED NORDSTROM PRODUCT URL]
UV Clear Face Sunscreen SPF 46,EltaMD,Sunscreen,physical,44.00,,80,SKU-BTY-019,,sunscreen,spf,dermatologist,Dermatologist-recommended daily face sunscreen with SPF 46 that protects against UVA/UVB rays while calming sensitive and acne-prone skin with niacinamide.,The #1 dermatologist-recommended daily face sunscreen. This lightweight moisturizing sunscreen contains 9% zinc oxide for transparent broad-spectrum protection with SPF 46. Enriched with niacinamide to calm and soothe sensitive and acne-prone skin. Contains hyaluronic acid for hydration. Oil-free paraben-free and fragrance-free. Leaves no white cast. Suitable for daily wear under makeup.,true,true,false,true,amazon,[NEED AMAZON PRODUCT URL]
Unseen Sunscreen SPF 40,Supergoop!,Sunscreen,physical,38.00,,90,SKU-BTY-020,,sunscreen,invisible,primer,Weightless invisible sunscreen with SPF 40 that doubles as a primer for a smooth makeup-ready finish while protecting against UVA/UVB and blue light.,The award-winning invisible sunscreen that changed the game. This weightless scentless sunscreen is completely clear and leaves zero white cast. Formulated with clean ingredients including red algae and meadowfoam seed to protect against UVA UVB and blue light. Doubles as a makeup-gripping primer. Suitable for all skin tones and types. The go-to daily SPF for anyone who hates sunscreen.,false,false,true,true,amazon,[NEED AMAZON PRODUCT URL]
Sensitive Mineral SPF 50,Blue Lizard,Sunscreen,physical,17.99,,120,SKU-BTY-021,,sunscreen,mineral,sensitive,Budget-friendly mineral sunscreen with SPF 50 that provides reliable broad-spectrum protection for sensitive skin without chemical sunscreens.,A trusted mineral sunscreen for the whole family. Uses zinc oxide and titanium dioxide for mineral-based broad-spectrum protection without chemical sunscreens. The smart bottle turns pink in harmful UV light as a visual reminder to reapply. Fragrance-free paraben-free and dye-free. Suitable for sensitive skin including those with rosacea. Reef-safe formula.,false,false,false,true,amazon,[NEED AMAZON PRODUCT URL]
Creamy Eye Treatment with Avocado,Kiehl's,Eye Care,physical,35.00,,60,SKU-BTY-022,,eye cream,avocado,hydration,Rich nourishing eye cream with avocado oil that hydrates and visibly improves the delicate eye area for a smoother brighter appearance.,A best-selling eye treatment for over 50 years. Formulated with avocado oil to nourish and hydrate the delicate eye area and beta-carotene to help improve the appearance of fine lines. The rich creamy texture provides lasting moisture while improving skin smoothness and brightness. Suitable for all skin types including sensitive eyes and contact lens wearers.,false,false,false,true,amazon,[NEED AMAZON PRODUCT URL]
Advanced Génifique Yeux Eye Cream,Lancôme,Eye Care,physical,75.00,,40,SKU-BTY-023,,eye cream,luxury,anti-aging,Advanced eye cream with bifidus prebiotic and caffeine that visibly reduces the look of dark circles puffiness and signs of fatigue for awakened brighter eyes.,An advanced eye treatment that targets the look of dark circles puffiness and signs of fatigue. Formulated with bifidus prebiotic to strengthen the eye area's barrier and caffeine to reduce the appearance of puffiness. The cooling metal applicator massages and depuffs for an instant awakening effect. Results visible in just 4 weeks.,false,false,false,true,nordstrom,[NEED NORDSTROM PRODUCT URL]
Mighty Patch Original,Hero Cosmetics,Spot Treatment,physical,13.99,,200,SKU-BTY-024,,pimple patch,acne,hydrocolloid,Cult-favorite hydrocolloid pimple patches that absorb blemish impurities while protecting the skin for a clearer calmer complexion overnight.,The original star of the pimple patch category. These hydrocolloid patches absorb the fluid in blemishes while protecting the skin from picking and environmental irritants. Each patch creates an optimal healing environment for blemishes. Clear nearly invisible design works for day or night wear. Dermatologist-tested and non-irritating. Simply clean the affected area apply and leave on for 6-8 hours.,false,false,false,true,amazon,[NEED AMAZON PRODUCT URL]
Moisture Surge 100H Auto-Replenishing Hydrator,Clinique,Moisturizer,physical,55.00,,70,SKU-BTY-025,,moisturizer,hylauronic,gel cream,Refreshing oil-free gel-cream that delivers 100 hours of continuous hydration while strengthening the skin's moisture barrier for a plump dewy complexion.,An oil-free gel-cream that delivers 100 hours of continuous hydration. Formulated with aloe water and hyaluronic acid to flood skin with moisture and a unique Auto-Replenishing technology that helps skin activate its own natural hydration sources. Strengthens the skin's moisture barrier with each application. Suitable for all skin types including sensitive. No parabens phthalates or fragrance.,false,false,false,true,amazon,[NEED AMAZON PRODUCT URL]
```

> **⚠️ IMAGE SOURCE NOTE:** Replace `[NEED AMAZON PRODUCT URL]` with actual Amazon product page URLs during import. Image URLs must be sourced directly from:
> - Amazon product detail pages (right-click → "Copy Image Address")
> - Sephora.com product images
> - Nordstrom.com product images
> - Pexels.com (for editorial/hero images — credit required)

---

## 4. Target Keyword Mapping

| # | Product | Primary Keyword | Search Intent | Est. Monthly Volume |
|---|---------|----------------|--------------|---------------------|
| 1 | CeraVe Hydrating Cleanser | "best face wash for dry skin" | Commercial | 14,000 |
| 2 | Vanicream Gentle Cleanser | "best cleanser for sensitive skin" | Commercial | 8,500 |
| 3 | Youth To The People Superfood Cleanser | "best natural face wash" | Commercial | 3,200 |
| 4 | DHC Deep Cleansing Oil | "best cleansing oil" | Commercial | 6,500 |
| 5 | Bioderma Sensibio H2O | "best micellar water" | Commercial | 12,000 |
| 6 | SkinCeuticals C E Ferulic | "best vitamin c serum" | Commercial | 28,000 |
| 7 | La Roche-Posay 10% Vitamin C | "best vitamin c serum for sensitive skin" | Commercial | 3,800 |
| 8 | Sunday Riley CEO | "best vitamin c serum luxury" | Commercial | 2,100 |
| 9 | TruSkin Vitamin C Serum | "best affordable vitamin c serum" | Commercial | 5,500 |
| 10 | The Ordinary Niacinamide | "best niacinamide serum" | Commercial | 18,000 |
| 11 | Paula's Choice 2% BHA | "best exfoliating toner" | Commercial | 10,000 |
| 12 | The Ordinary Retinol | "best retinol serum for beginners" | Commercial | 7,000 |
| 13 | The Ordinary Hyaluronic Acid | "best hyaluronic acid serum" | Commercial | 15,000 |
| 14 | CeraVe Daily Moisturizing Lotion | "best face moisturizer for dry skin" | Commercial | 22,000 |
| 15 | La Roche-Posay Cicaplast Balm | "best moisturizer for sensitive skin" | Commercial | 9,000 |
| 16 | Farmacy Honey Halo | "best moisturizer for dry skin" | Commercial | 5,000 |
| 17 | Tatcha Water Cream | "best moisturizer for oily skin" | Commercial | 8,000 |
| 18 | La Mer Crème | "best luxury moisturizer" | Commercial | 4,500 |
| 19 | EltaMD UV Clear SPF 46 | "best face sunscreen" | Commercial | 20,000 |
| 20 | Supergoop! Unseen Sunscreen | "best sunscreen for face" | Commercial | 25,000 |
| 21 | Blue Lizard Mineral SPF 50 | "best mineral sunscreen" | Commercial | 6,500 |
| 22 | Kiehl's Creamy Eye Treatment | "best eye cream for dry skin" | Commercial | 6,000 |
| 23 | Lancôme Génifique Yeux | "best eye cream for dark circles" | Commercial | 12,000 |
| 24 | Hero Cosmetics Mighty Patch | "best pimple patches" | Commercial | 10,000 |
| 25 | Clinique Moisture Surge 100H | "best gel moisturizer" | Commercial | 4,500 |

---

## 5. Import Validation Checklist

- [ ] All 25 products have accurate names and brand names
- [ ] Categories match existing admin categories (create "Cleanser", "Serum", "Moisturizer", "Sunscreen", "Eye Care", "Spot Treatment" if needed)
- [ ] Prices match current merchant listing prices (verify before import)
- [ ] SKUs are unique and identifiable
- [ ] ASIN numbers are added for Amazon products (improves affiliate linking)
- [ ] Image URLs are sourced from actual merchant/stock image sites
- [ ] Affiliate partners are correctly set ("amazon", "sephora", "nordstrom")
- [ ] Affiliate is set to "true" for all products
- [ ] Short descriptions are 120-160 characters (SEO optimized)
- [ ] Full descriptions are 300+ characters (SEO depth)
- [ ] Tags include 3-5 relevant keywords per product
- [ ] Featured/best seller flags set appropriately
- [ ] Preview import first — verify no parsing errors

---

## 6. Post-Import Quality Check

- [ ] Visit `/#/shop` — verify all 25 products appear
- [ ] Click 5+ products — verify product detail pages load
- [ ] Check images render correctly (no broken image icons)
- [ ] Verify prices display correctly
- [ ] Test affiliate link: add `?tag=alayainsider-21` to one Amazon link, click through
- [ ] Filter by category "Cleanser" — verify category filter works
- [ ] Run SEO analysis on 3 products — check scores
- [ ] Verify products appear in site search
