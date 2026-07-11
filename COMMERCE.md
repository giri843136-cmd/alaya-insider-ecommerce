# ALAYA INSIDER — Commerce Platform Guide

> **Target audience**: Commerce managers, affiliate managers, operations.
> **Last updated**: July 2026

---

## 1. Commerce Architecture

The commerce platform manages the complete product lifecycle across direct sales, affiliate partnerships, and marketplace integrations.

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/commerce.ts` | Core commerce operations (products, cart, checkout, coupons) |
| `src/lib/commercePlatform.ts` | Platform-level commerce engine (inventory, pricing, fulfillment) |
| `src/lib/affiliateCommerce.ts` | Affiliate/marketplace management, commission engine, price intelligence |
| `src/context/CommerceContext.tsx` | Cart, wishlist, compare state management |
| `src/lib/seoEngine.ts` | Commerce SEO (product schema, affiliate disclosure) |

---

## 2. Product Types

| Type | Description | Example |
|------|-------------|---------|
| **Physical** | Tangible goods with shipping | Bags, jewelry, candles |
| **Digital** | Downloadable content | Style guides, workbooks |
| **Affiliate** | Partner-linked products (commission-based) | Curated partner items |

---

## 3. Affiliate Ecosystem

### Affiliate Partners

The platform supports an affiliate commerce model where partners list products and earn commissions on sales.

### Commission Models

| Model | Description |
|-------|-------------|
| **Percentage** | Fixed % of sale price |
| **Fixed** | Flat fee per conversion |
| **Tiered** | Increasing % based on volume |
| **Performance** | Variable rate based on metrics |

### Marketplace Registry

Multiple marketplace networks can be configured with:
- Integration credentials (API key, webhook URL)
- Commission rates and terms
- Product feed sync schedules
- Failover rules for availability

### Price Intelligence

- **Price history**: Track price changes over time
- **Price alerts**: Notify when competitor prices change
- **Price comparison**: Compare across marketplaces
- **Competitive analysis**: Market positioning insights

### Revenue Intelligence

- **Revenue attribution**: Track which channels drive sales
- **Revenue forecasting**: Predict future revenue based on trends
- **Conversion funnel**: Analyze drop-off points
- **A/B testing**: Compare pricing/messaging variants

---

## 4. Checkout Flow

```mermaid
flowchart LR
    A[Cart] --> B[Checkout]
    B --> C[Shipping Info]
    C --> D[Payment]
    D --> E[Confirmation]
    E --> F[Order Created]
```

The checkout process:
1. Customer adds items to cart
2. Proceeds to checkout form
3. Enters shipping and payment details
4. Places order
5. Order is created with status "pending"

**Note**: Payment is simulated — no actual payment processing occurs.

---

## 5. Coupon System

Coupons can be created with:
- **Type**: Percentage off or fixed amount
- **Value**: Discount amount
- **Conditions**: Minimum spend, applicable products/categories
- **Limits**: Usage count, per-customer limit
- **Stackable**: Can combine with other offers

---

## 6. Order Management

### Order Statuses

```
pending → processing → paid → packed → shipped → delivered
                                                    ↓
                                              completed
    ↑                                         refunded
 cancelled (from any state)
```

### Fulfillment

- **Suppliers**: Manage fulfillment partners with lead times
- **Returns**: Process returns with status tracking
- **Digital delivery**: Digital products are "delivered" on payment confirmation

---

## 7. SEO for Commerce

Each product generates:
- **JSON-LD Schema**: `Product` schema with price, availability, ratings
- **OpenGraph tags**: Social sharing previews
- **Affiliate disclosure**: Proper `rel="sponsored"` on affiliate links
- **Canonical URLs**: Prevent duplicate content

Access **SEO Studio** (`/#/admin/seo`) to manage:
- Product-level SEO metadata
- Schema validation
- Content optimization scores
