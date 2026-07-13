# ALAYA INSIDER — Admin Guide

> **Target audience**: Store administrators, operations managers.
> **Last updated**: July 2026

---

## 1. Accessing the Admin Panel

Navigate to `/#/admin` and log in with your admin credentials.

**Default login**: Admin panel is accessed via `/admin/login`. After authentication, you are redirected to the Dashboard at `/#/admin`.

**Keyboard shortcut**: Press `⌘K` (Mac) or `Ctrl+K` (Windows) to open the Command Palette for instant navigation to any admin page.

---

## 2. Admin Dashboard (`/#/admin`)

The main dashboard provides:

- **Revenue overview**: Total revenue, AOV (average order value), affiliate revenue
- **Orders**: Recent orders with status badges, open orders count
- **Products**: Low stock alerts, top categories, top brands
- **Customers**: Total customers, conversion rate

---

## 3. Commerce Management

### Products (`/#/admin/products`)
Manage the product catalog. Add, edit, delete products with:
- Images, pricing, variants, stock tracking
- Categories, brands, tags
- Affiliate links and commission tracking
- Digital product support

### Categories (`/#/admin/categories`)
Organize products into categories and subcategories. Each category can have:
- Name, slug, description, image
- Associated products (via category ID)
- SEO metadata

### Brands (`/#/admin/brands`)
Manage brand profiles with:
- Name, logo, description, website
- Featured flag for homepage display
- Associated products

### Orders (`/#/admin/orders`)
View and manage customer orders:
- Order status tracking (pending → processing → paid → packed → shipped → delivered)
- Order details with line items, customer info, totals
- Returns and refunds management

### Coupons (`/#/admin/coupons`)
Create discount codes:
- Percentage or fixed amount discounts
- Minimum spend requirements
- Applicable products/categories
- Usage limits and expiry dates

### Suppliers (`/#/admin/suppliers`)
Manage fulfillment partners with:
- Contact information, lead times
- Product assignments
- Performance metrics

### Returns (`/#/admin/returns`)
Process return requests:
- Status tracking (requested → approved → received → processed → refunded)
- Customer communication
- Refund processing

---

## 4. Customer Management

### Customers (`/#/admin/customers`)
View customer profiles with:
- Order history, wishlist items
- Loyalty points, store credit
- Address book
- Account status

### CRM (`/#/admin/crm`)
Customer Relationship Management:
- Customer segments and cohorts
- Communication history
- Support ticket tracking
- Engagement scoring

### CX Platform (`/#/admin/customer-experience`)
Customer Experience intelligence:
- NPS surveys and scores
- Sentiment analysis
- Customer journey mapping
- Feedback management

### Reviews (`/#/admin/reviews`)
Moderate product reviews:
- Approve/reject reviews
- Reply to customer reviews
- Rating analytics

---

## 5. Content Management

### Journal (`/#/admin/journal`)
Manage editorial content:
- Articles with rich text, images, featured products
- Author profiles, categories, tags
- SEO metadata (title, description, OpenGraph)
- Scheduled publishing

### Homepage (`/#/admin/homepage`)
Compose the storefront homepage:
- Enable/disable sections (hero, categories, flash deals, featured, bestsellers, etc.)
- Reorder sections
- Configure hero slides

### Media Library (`/#/admin/media`)
Digital Asset Management:
- Upload and organize images
- Image metadata (alt text, caption, credit)
- Usage tracking

### Design Studio (`/#/admin/design`)
Customize the storefront appearance:
- Logo, favicon, brand colors
- Typography settings
- Layout options

---

## 6. Marketing

### Marketing (`/#/admin/marketing`)
Campaign management:
- Create and track marketing campaigns
- UTM parameter management
- Campaign performance analytics

### Affiliates (`/#/admin/affiliates`)
Partner management:
- Onboard affiliate partners
- Commission rate configuration
- Performance tracking
- Payout management

### SEO Studio (`/#/admin/seo`)
Search Engine Optimization:
- Page-level SEO metadata
- JSON-LD schema generation
- Sitemap configuration
- Content optimization scores
- Programmatic SEO (via `seoEngine.ts`)

---

## 7. AI & Automation

### AI Workspace (`/#/admin/ai`)
Central AI operations hub:
- Agent registry and monitoring
- Task assignment and scheduling
- Prompt library management
- Knowledge graph visualization
- Cost tracking and analytics

### Workflows (`/#/admin/workflows`)
Automation engine:
- Visual workflow builder
- Trigger configuration (events, schedules, webhooks)
- Action chains with conditions
- Workflow execution history

### BPM Platform (`/#/admin/workflows-bpm`)
Business Process Management:
- BPMN-compatible process designer
- Decision tables and rules
- Approval workflows (sequential, parallel, consensus)
- Process analytics and optimization

---

## 8. Analytics & Intelligence

### Analytics (`/#/admin/analytics`)
Platform analytics:
- Traffic, orders, revenue trends
- Product performance
- Customer acquisition metrics

### Business Intelligence (`/#/admin/business-intelligence`)
Advanced BI:
- Revenue forecasting
- Cohort analysis
- Custom report builder
- Data export (CSV)

### Executive Intelligence (`/#/admin/executive-intelligence`)
C-level dashboards:
- CEO: Revenue, growth, market position
- COO: Operations efficiency, fulfillment
- CMO: Marketing ROI, CAC, LTV
- CTO: Platform health, performance
- CFO: Financial metrics, P&L

---

## 9. Operations

### System (`/#/admin/system`)
System administration:
- Background jobs queue
- Scheduled tasks
- System health
- Performance metrics

### Observability (`/#/admin/observability`)
Platform monitoring:
- Structured log viewer
- Distributed tracing (span waterfall)
- Health checks dashboard
- Incident management

### Security (`/#/admin/security`)
Security center:
- Session management (active sessions, revoke)
- Security audit log
- Authentication policies
- Rate limiting configuration

### DevOps (`/#/admin/devops`)
Development operations:
- CI/CD pipeline status
- Environment management
- Deployment history
- Feature flags

---

## 10. Mobile & PWA

### Mobile Experience (`/#/admin/mobile-experience`)
Mobile platform management:
- Device detection analytics
- Offline queue viewer
- Platform capabilities (battery, memory, cores)

### PWA Dashboard (`/#/admin/pwa-dashboard`)
Progressive Web App:
- Service worker status
- Install prompt analytics
- Core Web Vitals (LCP, CLS, INP)
- Performance history

### Synchronization (`/#/admin/synchronization`)
Cross-device sync:
- Sync snapshots with versioning
- Offline queue processing
- Conflict resolution strategies

### Performance Dashboard (`/#/admin/performance-dashboard`)
Performance monitoring:
- Overall performance score
- Device optimization recommendations
- Core Web Vitals gauges
- Page load breakdown

---

## 11. Configuration

### Settings (`/#/admin/settings`)
Store-wide configuration:
- Store name, description, contact info
- Currency and regional settings
- Shipping rates and free shipping thresholds
- Feature flags (wishlist, compare, journal, affiliate, etc.)
- Social media links

### Navigation (`/#/admin/navigation`)
Mega menu configuration:
- Navigation groups and items
- Mega menu layout (columns, images)
- Taxonomy and category organization

---

## 12. Common Tasks

### Adding a Product
1. Go to **Products** → **Add Product**
2. Fill in: name, description, price, images
3. Select category and brand
4. Set stock level and variants (if applicable)
5. Save — product appears on storefront immediately

### Processing an Order
1. Go to **Orders**
2. Find the order by number or customer name
3. Update status as it progresses (processing → packed → shipped)
4. Add tracking information if available

### Creating a Coupon
1. Go to **Coupons** → **Add Coupon**
2. Set code, discount type (percentage/fixed), value
3. Optionally set minimum spend, applicable products
4. Set usage limits and expiry
5. Save — customers can use the code at checkout

### Viewing Security Logs
1. Go to **Security**
2. View the audit log table with timestamps, actions, and actors
3. Filter by action type or date range
