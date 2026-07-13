# ALAYA INSIDER — Developer Guide

> **Target audience**: Senior engineers onboarding to the platform.
> **Last updated**: July 2026

---

## 1. Repository Overview

```
alaya-insider-ecommerce-platform/
├── public/                        # Static PWA assets
│   ├── manifest.json              # Web App Manifest (SVG icons, screenshots, shortcuts)
│   ├── service-worker.js          # Offline caching & push notification handler
│   ├── icons/                     # PWA icons (generated SVG)
│   ├── screenshots/               # PWA screenshot assets (generated SVG)
│   └── robots.txt                 # Crawler directives
├── scripts/
│   └── generate-icons.mjs         # PWA icon & screenshot SVG generator
├── src/
│   ├── App.tsx                    # Root: 15 providers → HashRouter → 107 routes
│   ├── main.tsx                   # Entry point: mobile platform + resource hints init
│   ├── index.css                  # Tailwind CSS v4 + design tokens + animations
│   ├── utils/
│   │   └── cn.ts                  # Tailwind class merge (clsx + tailwind-merge)
│   ├── lib/                       # 40+ business logic modules (zero UI)
│   ├── context/                   # 15 React context providers
│   ├── components/                # 60+ reusable UI components
│   │   ├── admin/                 # Admin shell (AdminLayout, CommandPalette, NotificationCenter)
│   │   ├── ai/                    # AI workspace components
│   │   ├── executive/             # Executive dashboard components
│   │   ├── home/                  # Homepage section components
│   │   ├── mobile/                # PWA-specific components (MobileNav, VirtualList, etc.)
│   │   ├── product/               # Product detail sub-components
│   │   └── ...                    # Shared components (Navbar, Footer, ProductCard, SearchModal, etc.)
│   └── pages/                     # 94 route-level page components
│       ├── admin/                 # 69 admin dashboard pages
│       └── ...                    # 25 storefront pages
├── dist/
│   └── index.html                 # Production build (single file, ~629 KB gzip)
├── ARCHITECTURE.md                # Module map, context tree, routing, design system
├── DEVELOPER_GUIDE.md             # ← This file
├── OPERATIONS.md                  # Deployment, monitoring, runbooks
├── SECURITY.md                    # Security architecture & hardening
├── ADMIN_GUIDE.md                 # Admin panel user guide
├── AI_WORKSPACE.md                # AI platform documentation
├── RUNBOOKS.md                    # Incident response procedures
├── COMMERCE.md                    # Commerce platform guide
├── PWA.md                         # PWA & offline architecture
├── README.md                      # Quick-start overview
├── index.html                     # HTML entry point + security headers + SW registration
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript configuration
└── vite.config.ts                 # Vite build config (React + Tailwind + SingleFile)
```

---

## 2. Quick Start

```bash
# Prerequisites: Node.js 20+, npm 10+
npm install
npm run dev          # Vite dev server at http://localhost:5173
npm run build        # Production build → dist/index.html (~629 KB gzip)
npm run preview      # Preview production build
npx tsc --noEmit     # TypeScript type-check
```

---

## 3. Architecture Deep-Dive

### 3.1 Build Pipeline

The platform uses **Vite 7** with three plugins:
- `@vitejs/plugin-react` — JSX transform, Fast Refresh
- `@tailwindcss/vite` — Tailwind CSS v4 JIT compilation
- `vite-plugin-singlefile` — Inlines all JS/CSS/assets into a single `index.html`

**Result**: Entire application is a single HTML file (~2.8 MB / 629 KB gzip). No server-side rendering, no code splitting, no external asset loading at runtime (except web fonts and third-party images).

### 3.2 Routing

Uses `HashRouter` (react-router-dom v7) so no server-side URL rewriting is needed:

```
/#/shop                    → Storefront shop page
/#/product/leather-tote    → Product detail
/#/admin                   → Admin dashboard (protected)
/#/admin/login             → Admin login (unprotected)
```

**Route count**: 25 storefront routes + 82 admin routes = **107 total routes**.

### 3.3 State Management

**15 hierarchical React contexts** (see ARCHITECTURE.md for the full tree):

| Context | Purpose | Persistence |
|---------|---------|-------------|
| `StoreProvider` | Root data store (products, orders, settings, brands, articles) | localStorage |
| `AuthProvider` | Authentication state, admin session, token rotation | localStorage |
| `CommerceProvider` | Cart, wishlist, compare | localStorage |
| `ThemeProvider` | Light/dark theme toggle | localStorage |
| `ToastProvider` | Toast notification queue | In-memory |
| `SecurityProvider` | Security audit logging | localStorage |

### 3.4 Data Layer

All data is **static and in-memory**, seeded via `src/lib/seed.ts`. No database, no API calls, no network requests for business data.

**Persistence mechanisms**:
- `localStorage` — Theme preference, auth session, cart, wishlist, recent searches
- `IndexedDB` (via `idb-keyval` wrapper in `mobilePlatform.ts`) — Offline queue, sync snapshots
- In-memory arrays — Products, orders, customers, AI agents, analytics data

---

## 4. Coding Standards

### 4.1 File Organization

```
src/lib/          → Pure TypeScript modules (no React imports)
src/context/      → React context providers + hooks
src/components/   → Reusable UI components (one file per component)
src/pages/        → Route-level page components
src/pages/admin/  → Admin dashboard pages
```

### 4.2 Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| Library files | `camelCase.ts` | `mobilePlatform.ts` |
| React components | `PascalCase.tsx` | `ProductCard.tsx` |
| Context files | `PascalCase.tsx` | `AuthContext.tsx` |
| Page components | `PascalCase.tsx` | `AdminProducts.tsx` |
| CSS classes | `kebab-case` | `btn-primary`, `container-edge` |
| Types/interfaces | `PascalCase` | `Product`, `OrderStatus` |
| Functions | `camelCase` | `formatPrice`, `detectPii` |
| Constants | `UPPER_SNAKE` | `MAX_RETRY_COUNT` |

### 4.3 Component Patterns

**Functional components with hooks** (no class components except `ErrorBoundary`):

```tsx
import { memo, useCallback } from "react";
import { cn } from "@/utils/cn";

interface Props {
  product: Product;
  onSelect?: (id: string) => void;
}

export const ProductCard = memo(function ProductCard({ product, onSelect }: Props) {
  const handleSelect = useCallback(() => onSelect?.(product.id), [onSelect, product.id]);

  return (
    <button onClick={handleSelect} className={cn("card", className)}>
      {product.name}
    </button>
  );
});
```

**Key patterns**:
- `React.memo` for all reusable components
- `useCallback` for event handlers passed as props
- `useMemo` for derived data (filtering, sorting, mapping)
- Props interface exported or defined at the top of the file
- Named exports (no `export default` for components)

### 4.4 Styling Pattern

Uses **Tailwind CSS v4** with custom design tokens:

```tsx
// Component-level classes
<button className="btn-primary btn-md">Click me</button>

// Conditional classes with cn() utility
<div className={cn("card p-5", isActive && "ring-2 ring-accent")}>

// Theming via CSS custom properties
<div className="bg-canvas text-ink">
```

**Available CSS utilities** (defined in `index.css`):
- `.btn`, `.btn-primary`, `.btn-outline`, `.btn-ghost`, `.btn-dark`, `.btn-sm/md/lg`
- `.card`, `.card-hover`
- `.input-field`, `.label-field`
- `.badge`, `.chip`, `.chip-active`
- `.glass`, `.glass-accent`, `.glass-heavy`
- `.skeleton`, `.reveal`, `.reveal-stagger`
- `.container-edge` (max-width 1280px, responsive padding)
- `.text-display-xl/l/m`, `.text-eyebrow`, `.text-label`

### 4.5 Imports Order

1. External libraries (react, react-router-dom, lucide-react)
2. Internal utilities (`@/utils/cn`, `../lib/types`, `../lib/utils`)
3. Context hooks (`../context/StoreContext`, `../context/CommerceContext`)
4. Components (`../components/ui`, `../components/ProductCard`)
5. CSS (only in `main.tsx`)

---

## 5. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Single-file build** | Zero server dependencies, deploy anywhere (CDN, S3, GitHub Pages) |
| **HashRouter** | No server-side URL handling needed |
| **Static mock data** | Demo/prototype ready immediately; swap for real API in production |
| **15 contexts** | Clean separation of concerns; avoids prop-drilling without over-engineering |
| **No external state library** | React Context + useReducer sufficient for the data model size |
| **LocalStorage + IndexedDB** | Client-side only architecture; data persists across sessions |
| **SVG PWA icons** | Generated programmatically, no design tooling required |
| **Custom service worker** | Full control over caching strategy without heavy framework dependencies |

---

## 6. Testing

The platform has **no formal test suite** (all testing is manual via the dev server). When adding tests:

```bash
# Run TypeScript type-check (the primary validation)
npx tsc --noEmit

# Verify production build
npm run build
```

---

## 7. Contribution Workflow

1. **Read the architecture docs** — Start with `ARCHITECTURE.md` and this guide
2. **Understand the pattern** — Read existing components in the area you're modifying
3. **Make focused changes** — One concern per commit
4. **Run the typecheck** — `npx tsc --noEmit` must pass with zero errors
5. **Verify the build** — `npm run build` must succeed
6. **Review for regressions** — Check that existing functionality still works

### 7.1 Review Checklist

Before submitting changes, verify:
- [ ] TypeScript compilation passes (`npx tsc --noEmit`)
- [ ] Production build succeeds (`npm run build`)
- [ ] No `console.log` left in source code
- [ ] No `@ts-ignore` added (acceptable only in extreme cases)
- [ ] No hardcoded URLs or credentials
- [ ] New components use `React.memo` where appropriate
- [ ] Event handlers use `useCallback` if passed as props
- [ ] Imports are clean (no dead imports)
- [ ] Changes follow existing naming conventions
- [ ] Responsive breakpoints are considered
- [ ] Dark mode rendering is verified

---

## 8. Environment & Configuration

All configuration is in `src/lib/seed.ts` and the `StoreContext`:

```tsx
const { settings } = useStore();
// settings.storeName, settings.currency, settings.features, etc.
```

**No `.env` files required** — the platform works with zero configuration after `npm install`.

---

## 9. Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| `react` | UI framework | 19.x |
| `react-dom` | DOM renderer | 19.x |
| `react-router-dom` | Client-side routing | 7.x |
| `lucide-react` | Icon library | Latest |
| `clsx` | Conditional class joining | Latest |
| `tailwind-merge` | Tailwind class conflict resolution | Latest |
| `@vitejs/plugin-react` | Vite React plugin | 7.x |
| `@tailwindcss/vite` | Tailwind CSS v4 Vite plugin | 4.x |
| `vite-plugin-singlefile` | Inline all assets into HTML | Latest |
| `vite` | Build tool | 7.x |
| `typescript` | Type checking | 5.9 |
| `tailwindcss` | CSS framework | 4.x |
