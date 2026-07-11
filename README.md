# ALAYA INSIDER — Premium Editorial Shopping Platform

> **Enterprise-grade ecommerce platform** with AI Workspace, Executive Intelligence, PWA, full admin suite, and billion-dollar-ready architecture.

## Overview

ALAYA INSIDER is a complete enterprise ecommerce platform built as a single-page React application. It combines a luxury editorial storefront with a comprehensive admin dashboard, AI-powered business operations, executive intelligence, and progressive web app capabilities — all delivered as a single production HTML file.

### Key Capabilities

| Domain | Modules |
|--------|---------|
| **Commerce** | Products, categories, brands, orders, cart, checkout, coupons, returns, suppliers, gateways |
| **Marketing** | Campaigns, affiliates, SEO, analytics, popups, recommendations |
| **Content** | CMS, editorial, journal, media/DAM, PIM, collection builder |
| **Customer** | Accounts, CRM, CX platform, reviews, support |
| **AI & Automation** | AI workspace, agent registry, task manager, knowledge graph, decision engine, memory platform |
| **Executive** | CEO/COO/CMO/CTO/CFO dashboards, business health, forecasting, digital twin, decision intelligence |
| **Operations** | Workflows, BPM, notifications, queues, reporting, administration |
| **Infrastructure** | Observability, DevOps, security, identity, gateway, data platform |
| **Mobile/PWA** | Offline mode, service worker, install prompt, voice search, gesture support, virtual lists |
| **Globalization** | Multi-language, multi-currency, localization |

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# TypeScript validation
npx tsc --noEmit
```

## Architecture

The platform follows a modular architecture:

- **40+ library modules** in `src/lib/` — business logic, data, and utilities
- **15 React contexts** — hierarchical state management (auth, commerce, AI, etc.)
- **60+ reusable components** — UI primitives, layouts, mobile, admin shell
- **94 page files** — 25 storefront + 69 admin dashboard pages
- **HashRouter** — no server-side routing required

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the complete module map and architecture details.

## Documentation

| Guide | Audience | Covers |
|-------|----------|--------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Engineers | Full module map, context tree, routing, design system, PWA architecture |
| [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | Developers | Onboarding, coding standards, component patterns, contribution workflow |
| [OPERATIONS.md](./OPERATIONS.md) | DevOps | Deployment, monitoring, backup, scaling, release checklist |
| [SECURITY.md](./SECURITY.md) | Security | Auth, CSP, XSS protection, audit logging, hardening |
| [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) | Administrators | Admin panel walkthrough, common tasks for all sections |
| [AI_WORKSPACE.md](./AI_WORKSPACE.md) | AI Operators | Agent registry, knowledge graph, RAG, model management, observability |
| [RUNBOOKS.md](./RUNBOOKS.md) | On-call | Incident response, failure runbooks, disaster recovery, health checks |
| [COMMERCE.md](./COMMERCE.md) | Commerce Managers | Product types, affiliate ecosystem, checkout flow, order management |
| [PWA.md](./PWA.md) | Developers | Manifest, service worker, offline queue, sync, performance monitoring |

## Tech Stack

- **Runtime**: React 19, TypeScript 5.9
- **Build**: Vite 7, Tailwind CSS v4
- **Routing**: React Router v7 (HashRouter)
- **Icons**: Lucide React
- **Utilities**: clsx, tailwind-merge
- **PWA**: Custom service worker + manifest (no external plugin)
- **Output**: Single-file HTML via `vite-plugin-singlefile` (~2.8 MB / 628 KB gzip)

## Project Stats

| Metric | Value |
|--------|-------|
| Source files | 191 |
| Library modules | 40+ |
| Context providers | 15 |
| Reusable components | 60+ |
| Page files | 94 |
| Storefront routes | 25 |
| Admin routes | 82 |
| TypeScript errors | **0** |
| Build size | 2,796 KB (628 KB gzip) |

## License

Proprietary — ALAYA INSIDER Enterprise Platform
