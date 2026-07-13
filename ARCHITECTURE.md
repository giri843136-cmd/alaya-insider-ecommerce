# ALAYA INSIDER — Architecture Overview

## Project Structure

```
alaya-insider-ecommerce-platform/
├── public/                        # Static assets (PWA)
│   ├── manifest.json              # Web App Manifest
│   └── service-worker.js          # Offline caching & push
├── scripts/
│   └── generate-icons.mjs         # PWA icon generator
├── src/
│   ├── App.tsx                    # Root: providers → router → routes
│   ├── main.tsx                   # Entry point + mobile platform init
│   ├── index.css                  # Tailwind v4 + design tokens
│   ├── utils/
│   │   └── cn.ts                  # Tailwind class merge utility
│   ├── lib/                       # ** Core business logic (40+ modules) **
│   ├── context/                   # ** React context providers (15) **
│   ├── components/                # ** Reusable UI components (60+) **
│   │   ├── admin/                 # Admin shell (layout, command palette, notifications)
│   │   ├── ai/                    # AI workspace components
│   │   ├── executive/             # Executive dashboard components
│   │   ├── home/                  # Homepage sections
│   │   ├── mobile/                # Mobile/PWA-specific components
│   │   ├── product/               # Product detail sub-components
│   │   └── ...                    # Shared components (Navbar, Footer, ProductCard, etc.)
│   └── pages/                     # ** Route-level pages (94) **
│       ├── admin/                 # Admin dashboard pages (69)
│       └── ...                    # Storefront pages (25)
├── .gitignore
├── ARCHITECTURE.md
├── README.md
├── index.html                     # HTML entry + PWA meta + SW registration
├── package.json
├── tsconfig.json
├── vite.config.ts
└── dist/
    └── index.html                 # Production build (single file, 628 KB gzip)
```

## Module Map

### Library Modules (`src/lib/`)

| Module | Purpose |
|--------|---------|
| `types.ts` | Shared TypeScript types & interfaces |
| `utils.ts` | Formatting, currency, date, string helpers |
| `hooks.ts` | Custom React hooks (localStorage, media query, scroll, etc.) |
| `cn.ts` | Tailwind class merge |
| `ai.ts` | AI content generation (descriptions, FAQs, features) |
| `aiWorkspace.ts` | AI Workspace engine (agent registry, tasks, memory, decisions, observability, cost) |
| `analytics.ts` | Analytics event tracking & aggregation |
| `backup.ts` | System backup & restore |
| `businessIntelligence.ts` | Business metrics, forecasts, reports |
| `collections.ts` | Product collections |
| `commerce.ts` | Commerce operations |
| `commercePlatform.ts` | Platform commerce engine |
| `communications.ts` | Email, SMS, push notifications |
| `contentPlatform.ts` | CMS, editorial, content management |
| `csv.ts` | CSV import/export |
| `customerExperience.ts` | CX platform |
| `data.ts` | Data platform |
| `developer.ts` | Developer tools |
| `developerPlatform.ts` | Extension SDK, CLI, generators |
| `devops.ts` | CI/CD, environments, deployments, logging |
| `discovery.ts` | Product discovery & browsing |
| `editorialPlatform.ts` | Editorial workflow |
| `executiveIntelligence.ts` | Executive KPIs, reports, forecasting, digital twin, decision intelligence |
| `gateway.ts` | API gateway |
| `globalizationPlatform.ts` | Multi-language, multi-currency, compliance |
| `governancePlatform.ts` | Security, compliance, risk, audit |
| `identity.ts` | Authentication, SSO, MFA |
| `integrations.ts` | Third-party integrations |
| `intelligence.ts` | AI platform (models, agents, knowledge graph) |
| `jobs.ts` | Background job queue |
| `legal.ts` | Legal document management |
| `marketingPlatform.ts` | Campaign automation, analytics |
| `media.ts` | DAM (digital asset management) |
| `microservices.ts` | Microservice architecture |
| `mobilePlatform.ts` | PWA, device detection, offline queue, sync, voice, performance monitoring |
| `navigationPlatform.ts` | Mega menu & IA |
| `observability.ts` | Logs, traces, metrics, incidents |
| `operationsPlatform.ts` | Release mgmt, maintenance, DR |
| `orderStatus.ts` | Order tracking states |
| `recommendations.ts` | AI recommendation engine |
| `security.ts` | Encryption, session, audit, injection detection |
| `seed.ts` | Demo data seeding |
| `seo.ts` | SEO metadata, schema, sitemaps |
| `seoEngine.ts` | Programmatic SEO engine |
| `services.ts` | Service registry |
| `testingPlatform.ts` | QA & testing platform |
| `workflows.ts` | Workflow engine |
| `workflowsBpm.ts` | BPM platform |

### Context Architecture (`src/context/`)

```mermaid
graph TD
    SP[StoreProvider] --> LP[LanguageProvider]
    LP --> TP[ThemeProvider]
    TP --> AP[AuthProvider]
    AP --> AccP[AccountProvider]
    AccP --> TostP[ToastProvider]
    TostP --> SecP[SecurityProvider]
    SecP --> IP[IdentityProvider]
    IP --> GP[GatewayProvider]
    GP --> CP[CommunicationProvider]
    CP --> OP[ObservabilityProvider]
    OP --> DP[DataProvider]
    DP --> IntP[IntelligenceProvider]
    IntP --> BIP[BusinessIntelligenceProvider]
    BIP --> ComP[CommerceProvider]
    ComP --> QVP[QuickViewProvider]
    QVP --> R[Router]

    style SP fill:#9c7a4b20,stroke:#9c7a4b
    style R fill:#9c7a4b10,stroke:#9c7a4b40
```

### Context Architecture (text)

```
StoreProvider
├── LanguageProvider
│   └── ThemeProvider
│       └── AuthProvider
│           └── AccountProvider
│               └── ToastProvider
│                   └── SecurityProvider
│                       └── IdentityProvider
│                           └── GatewayProvider
│                               └── CommunicationProvider
│                                   └── ObservabilityProvider
│                                       └── DataProvider
│                                           └── IntelligenceProvider
│                                               └── BusinessIntelligenceProvider
│                                                   └── CommerceProvider
│                                                       └── QuickViewProvider
│                                                           └── Router
```

### Routing Architecture

- **Storefront** (25 routes): `Layout > Outlet` with shared Navbar/Footer/CartDrawer/SEO
- **Admin** (82 routes): `ProtectedRoute > AdminLayout > Outlet` with sidebar navigation
- **Auth boundary**: `/admin/login` is unprotected; all `/admin/*` routes require auth

### Design System

- **CSS Framework**: Tailwind CSS v4 with `@theme` design tokens
- **Theming**: Light/dark mode via CSS custom properties on `:root` / `.dark`
- **Typography**: Inter (sans) + Playfair Display (display/headings)
- **Icons**: Lucide React
- **Colors**: Canvas, surface, ink, muted, accent (gold), success, warning, info, danger
- **Components**: Button variants (`btn-primary`, `btn-outline`, etc.), cards, chips, badges, input fields, glass

### PWA & Offline

- **Service Worker**: Cache-first for assets, network-first for API, stale-while-revalidate for navigation
- **Manifest**: Full PWA manifest with shortcuts, screenshots, maskable icons
- **Offline Queue**: localStorage-based queue with retry logic and background sync
- **Sync Manager**: Cross-device sync with versioning and conflict resolution
- **Performance Monitoring**: LCP, CLS, INP, FCP, TTFB via PerformanceObserver

## Key Architecture Decisions

1. **Single-file production build** via `vite-plugin-singlefile` — entire app in one HTML file
2. **Hash-based routing** (`HashRouter`) — no server-side URL handling needed
3. **Static mock data** — all data is seeded in-memory, no database required
4. **Context-based state** — 15 React contexts form a hierarchical state tree
5. **IndexedDB + localStorage** for persistent client-side storage
6. **Feature-rich admin** — 82 admin pages organized by domain (commerce, AI, marketing, executive, etc.)

## Backend Architecture (Server)

The server provides a REST API for the platform. It is built with Hono on Node.js with PostgreSQL.

### Directory Structure

```
server/
├── src/
│   ├── index.ts                 # Server entry: Hono app, CORS, routes, DB init
│   ├── db.ts                    # Legacy in-memory store (being migrated to PostgreSQL)
│   ├── db/
│   │   ├── index.ts             # PostgreSQL connection pool, transactions, pagination
│   │   ├── schema.sql           # Complete SQL schema (45+ tables)
│   │   ├── migrate.ts           # Migration runner (up/down/status/reset)
│   │   ├── seed.ts              # Seed data migration
│   │   └── repositories/
│   │       ├── base.ts          # Generic CRUD repository
│   │       ├── audit.ts         # Audit logging
│   │       ├── jobs.ts          # Background jobs
│   │       ├── backups.ts       # Backup/restore
│   │       ├── index.ts         # 30 entity-specific repositories
│   │       └── init.ts          # Repository initialization
│   ├── routes/
│   │   ├── index.ts             # Route aggregator
│   │   ├── auth.ts              # Authentication
│   │   ├── commerce.ts          # Commerce (orders, products, etc.)
│   │   ├── payments.ts          # Payment intents, webhooks, refunds, providers
│   │   └── ...                  # Other route files
│   └── services/
│       └── payments/
│           ├── types.ts         # Payment domain types
│           ├── registry.ts      # Payment provider registry
│           ├── stripe.ts        # Stripe provider
│           ├── paypal.ts        # PayPal provider
│           ├── wallet.ts        # Apple Pay / Google Pay
│           ├── webhooks.ts      # Webhook engine
│           ├── paypal-webhook-verify.ts  # PayPal signature verification
│           ├── fraud.ts         # Fraud detection engine
│           └── payment-persistence.ts   # PostgreSQL persistence layer
├── .env.example                 # Environment template
├── tsconfig.json
└── package.json
```

### API Endpoints (v1)

#### System
- `GET /api/v1/system/health` — Health check
- `GET /api/v1/system/info` — Server info

#### Payments
- `POST /api/v1/payments/intent` — Create payment intent
- `POST /api/v1/payments/intent/:id/confirm` — Confirm payment
- `POST /api/v1/payments/intent/:id/capture` — Capture authorized payment
- `POST /api/v1/payments/intent/:id/cancel` — Cancel/void payment
- `GET /api/v1/payments/intent/:id` — Get payment intent
- `POST /api/v1/payments/refund` — Process refund
- `GET /api/v1/payments/providers` — Provider status
- `POST /api/v1/payments/providers/configure` — Configure credentials
- `GET /api/v1/payments/health` — Payment health check
- `GET /api/v1/payments/finance/reconciliation` — Finance reconciliation

#### Webhooks
- `POST /api/v1/webhooks/stripe` — Stripe webhook receiver
- `POST /api/v1/webhooks/paypal` — PayPal webhook receiver
- `GET /api/v1/webhooks/deliveries` — Webhook delivery list
- `GET /api/v1/webhooks/deliveries/:id` — Delivery details
- `GET /api/v1/webhooks/dead-letter` — Dead letter queue
- `POST /api/v1/webhooks/dead-letter/:id/retry` — Retry dead letter
- `GET /api/v1/webhooks/stats` — Webhook statistics

### Database Architecture

- **Pool**: Configurable connection pool (env-based)
- **Transactions**: `withTransaction()` for atomic operations
- **Pagination**: Automatic pagination with search, sort, and filters
- **Audit**: Append-only audit log for every mutation
- **Migrations**: Hash-based change detection, rollback support

### Payment Architecture

```
Client → Payment Routes → PaymentProvider Interface
                                ├── StripeProvider
                                ├── PayPalProvider
                                ├── ApplePayProvider (delegates to Stripe)
                                └── GooglePayProvider (delegates to Stripe)

Webhook → WebhookEngine → Signature Validation
                           ├── Replay Protection (5min)
                           ├── Duplicate Detection
                           ├── Retries (3x: 1/5/15min)
                           └── Dead Letter Queue
                                    ↓
                           PostgreSQL Persistence
                                    ↓
                           Order + Notification + Audit Side Effects

Payment → FraudEngine → Risk Score (0-100)
                         ├── Velocity → IP → Geo → Device → Email
                         ├── Phone → BIN → Amount → History → Failed
                         └── Low/Medium/High/Critical
```

## Key Architecture Decisions

1. **Single-file production build** via `vite-plugin-singlefile` — entire app in one HTML file
2. **Hash-based routing** (`HashRouter`) — no server-side URL handling needed
3. **Hybrid data** — PostgreSQL for persistence, with legacy in-memory store during migration
4. **Context-based state** — 15 React contexts form a hierarchical state tree
5. **Idempotent payments** — PostgreSQL-backed idempotency keys prevent duplicates
6. **Provider abstraction** — All payment providers implement a common interface
7. **Enterprise webhooks** — Signature validation, replay protection, dedup, retries, dead letter queue
8. **Fraud detection** — 10-dimensional risk scoring with configurable thresholds

## Build & Development

```bash
# Frontend
npm run dev       # Start Vite dev server
npm run build     # Production build → dist/index.html (single file)
npm run preview   # Preview production build
npx tsc --noEmit  # Frontend TypeScript type check

# Backend
cd server
npm run dev       # Start dev server (tsx watch)
npm run build     # TypeScript build
npx tsc --noEmit  # Backend TypeScript type check

# Backend environment (.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/alaya_insider
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
```
