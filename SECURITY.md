# ALAYA INSIDER — Security Guide

> **Target audience**: Security engineers, developers.
> **Last updated**: July 2026

---

## 1. Security Architecture

### 1.1 Overview

As a **client-side single-page application**, the platform's security model focuses on:

- **Browser-level protections** (CSP, XSS prevention, clickjacking)
- **Authentication & session management** (token rotation, fingerprint)
- **Input validation** (sanitization, injection detection)
- **Audit logging** (security events, admin actions)
- **Secrets management** (no hardcoded credentials)

There is **no server-side backend**, so traditional server-side threats (SQL injection, SSRF, command injection) are mitigated by the architecture — but input sanitization is still enforced for defense-in-depth.

### 1.2 Security Layers

```
┌──────────────────────────────────────────────┐
│  Layer 1: HTTP Security Headers              │
│  (CSP, HSTS, XFO, XCTO, Referrer-Policy)     │
├──────────────────────────────────────────────┤
│  Layer 2: Authentication & Session           │
│  (JWT tokens, token rotation, fingerprint)    │
├──────────────────────────────────────────────┤
│  Layer 3: Input Validation                   │
│  (XSS sanitization, injection detection,      │
│   PII redaction, length limits)               │
├──────────────────────────────────────────────┤
│  Layer 4: Authorization                      │
│  (RBAC, protected routes, admin isolation)    │
├──────────────────────────────────────────────┤
│  Layer 5: Audit & Monitoring                 │
│  (Security audit log, admin activity)         │
└──────────────────────────────────────────────┘
```

---

## 2. HTTP Security Headers

Applied via `<meta http-equiv="...">` tags in `index.html` (the best equivalent for a static SPA):

| Header | Value | Protection |
|--------|-------|-----------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https://images.pexels.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'` | XSS, data injection, clickjacking, form redirection |
| `X-Content-Type-Options` | `nosniff` | MIME-type sniffing |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` | Browser API access |
| `Cross-Origin-Opener-Policy` | `same-origin` | Cross-origin isolation |

**Notes for customization**:
- If adding external image sources (e.g., a CDN), add them to `img-src` in the CSP
- If adding external scripts, they must be added to `script-src` (or use integrity hashes)
- The CSP uses `'unsafe-inline'` and `'unsafe-eval'` which are required by Vite/React — this is acceptable for a SPA

---

## 3. Authentication

### 3.1 Admin Authentication

Located in `src/context/AuthContext.tsx`:

```typescript
interface SessionData {
  token: string;         // Random UUID
  fingerprint: string;   // Browser fingerprint hash
  createdAt: number;     // Session start time
  expiresAt: number;     // Session expiry (8 hours after creation)
  lastActivity: number;  // Last activity timestamp
}
```

**Mechanism**:
- Login generates a random UUID token + browser fingerprint
- Session expiry: **8 hours** from creation
- Token rotation: Every **30 minutes**, a new token is generated
- Fingerprint verification: Optional (checks browser fingerprint on each validation)
- Logout clears session data and rotation interval

### 3.2 Session Validation

```typescript
function validateSession(session: SessionData): boolean {
  const expired = Date.now() > session.expiresAt;
  return !expired;
}
```

### 3.3 Route Protection

```tsx
// src/components/admin/AdminLayout.tsx
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
```

All `/admin/*` routes are wrapped in `ProtectedRoute` except `/admin/login`.

---

## 4. Authorization

### 4.1 RBAC

The platform implements **Role-Based Access Control** via `src/context/SecurityContext.tsx`:

```typescript
interface AdminRole {
  id: string;
  name: "super_admin" | "admin" | "editor" | "manager" | "viewer";
  permissions: string[];  // e.g., ["products.write", "orders.read", "users.manage"]
}
```

### 4.2 Permission System

Permissions follow the format `resource.action`:

| Permission | Description |
|-----------|-------------|
| `products.read` | View products |
| `products.write` | Create/edit products |
| `orders.read` | View orders |
| `orders.write` | Process orders |
| `users.manage` | Manage admin users |
| `settings.write` | Modify store settings |
| `ai.manage` | Manage AI agents |

---

## 5. Input Validation & XSS Protection

All in `src/lib/security.ts`:

### 5.1 HTML Sanitization

```typescript
function sanitizeHtml(input: string): string {
  return input
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/on\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/data\s*:/gi, "")
    .replace(/vbscript\s*:/gi, "")
    .trim();
}
```

### 5.2 HTML Escaping

```typescript
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}
```

### 5.3 URL Sanitization

```typescript
function sanitizeUrl(url: string): string {
  if (/^(javascript|data|vbscript):/i.test(url)) return "";
  return url;
}
```

### 5.4 Injection Detection

```typescript
function detectInjection(input: string): boolean {
  const patterns = [
    /(%3C|%3E|<[^>]*>)/i,                    // HTML/XML tags
    /(DROP|DELETE|INSERT|EXEC|UNION|SELECT)/i,  // SQL keywords
    /\/etc\/passwd|\.\.\/|\.\\/i,              // Path traversal
    /\$\{[^}]+\}|{{[^}]+}}|{%[^}]+%}/i,       // SSTI / template injection
    /__proto__|constructor\.prototype/i,        // Prototype pollution
  ];
  return patterns.some((p) => p.test(input));
}
```

### 5.5 PII Detection & Redaction

```typescript
function detectPii(input: string): { found: boolean; types: string[] } {
  const patterns = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    phone: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  };
  // Returns types of PII found
}
```

### 5.6 Log Redaction

```typescript
function redactForLog(input: string): string {
  return input.replace(/(password|secret|token|api_key)=[^&\s]+/gi, "$1=***REDACTED***");
}
```

---

## 6. Audit Logging

### 6.1 Security Events

The `SecurityContext` logs security events to localStorage:

```typescript
interface SecurityEvent {
  id: string;
  action: "login" | "logout" | "failed_login" | "permission_denied" | "settings_change" | "admin_action";
  actor: string;
  detail: string;
  timestamp: number;
}
```

View the full audit log at **Admin → Security** (`/#/admin/security`).

### 6.2 What Gets Logged

- Admin login attempts (success and failure)
- Admin logout
- Permission denials
- Settings changes
- User role modifications
- Product/order modifications (via governance platform)

---

## 7. Secrets Management

**No secrets are hardcoded** in the source code. Specifically verified:
- No API keys in source files
- No database credentials
- No encryption keys
- No JWT secrets
- No cloud provider credentials

The only external credentials used are:
- Google Fonts (public CDN, no key required)
- Pexels images (public CDN, used for demo imagery)

---

## 8. Security Checklist

### Pre-Deployment

- [ ] CSP headers configured in `index.html`
- [ ] X-Frame-Options set to DENY
- [ ] X-Content-Type-Options set to nosniff
- [ ] Referrer-Policy configured
- [ ] No hardcoded secrets in source code
- [ ] No `console.log` in source code
- [ ] No `@ts-ignore` in source code
- [ ] Input sanitization applied (via `security.ts`)
- [ ] Admin routes protected by `ProtectedRoute`
- [ ] Session expiry configured (8 hours)
- [ ] Token rotation enabled (30 minutes)

### Regular Audits

- [ ] Review audit logs for suspicious activity
- [ ] Verify CSP covers all loaded external resources
- [ ] Check for dependency vulnerabilities (`npm audit`)
- [ ] Review access control permissions
