# ALAYA INSIDER — Railway Support Evidence Package

> **Prepared:** July 13, 2026
> **Status:** Production API returning HTTP 429 for ALL external requests

---

## 1. Project ID

```
f608e91f-f9f3-4848-b5ac-a991dade39d6
```

## 2. Service ID

```
8508d9cb-1a56-47aa-bac7-5c4e2c8c2bba
```

## 3. Environment ID

```
production
```

## 4. Latest Deployment ID

```
40b21a62-bc5f-4a42-a305-229dc18099bd  (SUCCESS, 2026-07-13 15:22:46 UTC)
```

### Previous Deployment IDs (SUCCESS)

| Deployment ID | Status | Date |
|---------------|--------|------|
| `40b21a62-bc5f-4a42-a305-229dc18099bd` | SUCCESS (Latest) | 2026-07-13 |
| `740140d9-f9ff-40b4-9c4b-bf802e6986e3` | SUCCESS | 2026-07-13 |
| `a8a3ca3c-020e-4a61-b228-030ee33bfc05` | SUCCESS | 2026-07-13 |
| `990170a1-4bc9-43c8-b596-fe62bfed7e5d` | SUCCESS | 2026-07-13 |

### Failed Deployments

| Deployment ID | Status | Date |
|---------------|--------|------|
| `adb3d4c1-ef5d-437b-843f-10ff8b86fbf0` | FAILED | 2026-07-11 |
| `39aff784-f172-4954-b055-00ae737d2bc3` | FAILED | 2026-07-11 |

### Removed Deployments

```
62934649-83cc-4ae6-b06b-b6498298b9c2
4ab8ad58-3bb9-41b7-b402-ff3772b1b13d
07491c2e-c5b5-4982-b441-04706d0ae17a
48fe4be9-d28c-46b9-9a6a-ad88e8fae212
865e178d-e38c-47cc-9dee-514f50d7ee57
33d998f3-2d10-4c19-b81a-d1b4eb270566
020d5614-3ee8-4d0e-8014-64c133f90100
b0bfa858-5adb-404d-bd42-6a41309b981d
076bfc5c-c8ab-480f-a59d-ddf493eb9d4d
9f969138-b9f2-48be-a899-b899792fab6f
41031989-38b0-4cd3-a34f-a35755742020
f53bdf35-bfcb-4cf3-9ec5-77125249765d
d4c8fe5c-70b4-4095-8748-ca449ca13749
d0d1a2d0-2d15-49b1-94e2-0bd738696b85
```

## 5. Region

```
sin1 (Singapore — inferred from x-railway-edge and x-hikari-trace headers)
```

## 6. Domain

```
https://alaya-insider-api-production.up.railway.app
```

## 7. Custom Domains

None configured. No custom domain is set in `railway.json` or Railway dashboard.

## 8. Railway Runtime

| Property | Value |
|----------|-------|
| Node version | v24.16.0 |
| NODE_ENV | production |
| PORT | 3001 (default, configured via Railway) |
| HOST | 0.0.0.0 |
| Server framework | Hono v4.7.7 |
| Start command | `node dist/index.js` |
| Build system | Docker (multi-stage, node:20-alpine) |

### Runtime Logs (Startup Sequence)

```
[DB] Connection established to postgres.railway.internal
[DB] Pool initialized for database (env: production)
[DB] Schema verified — 92 tables present
[DB] Migration schema already applied
[PAYMENTS] Payment providers initialized
[DB] Seed migration skipped — 0 new rows to migrate
Server started on port 3001 (production)
```

## 9. Docker Image Information

| Property | Value |
|----------|-------|
| Base image | `node:20-alpine` |
| Builder | Railway DOCKERFILE builder |
| Dockerfile path | `Dockerfile` |
| Build stage | Multi-stage (build → production) |
| Exposed port | 3001 |
| Health check | `node -e "require('http').get('http://localhost:$(PORT||3001)/api/v1/system/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"` |
| CMD | `["node", "dist/index.js"]` |
| Compiled files | 74 JS files compiled, schema.sql copied |

### railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/api/v1/system/health",
    "healthcheckTimeout": 10
  }
}
```

## 10. Build Logs

```
[DB] Connection pool initialized for database@postgres.railway.internal:5432 (env: production)
[DB] Connection established
[PAYMENTS] Payment providers initialized
[DB] Schema verified — 92 tables present
[DB] Migration schema already applied
<-- GET /api/v1/system/health
--> GET /api/v1/system/health 200 35ms
```

## 11. Runtime Logs (Full)

The logs confirm:
- The application starts successfully
- Database connects and 92 tables are verified
- Payment providers are initialized
- Internal health checks return **HTTP 200** consistently
- **No external request logs appear** — only internal Railway health checks
- **No 429 errors logged** by the application
- **No rate limiter activation** (`RATE_LIMIT_EXCEEDED` never appears in logs)
- **No unhandled errors or crashes**

## 12. Restart History

- July 11, 2026: ~104 container restarts triggered by failed deployments
- July 13, 2026: 4 successful deployments, no restarts
- Current: Container running stably with 0 recent restarts

## 13. Health Check History

Railway logs show health checks passing consistently:

```
<-- GET /api/v1/system/health
--> GET /api/v1/system/health 200 7ms
<-- GET /api/v1/system/health
--> GET /api/v1/system/health 200 35ms
<-- GET /api/v1/system/health
--> GET /api/v1/system/health 200 12ms
```

All internal health checks return HTTP 200. The health endpoint is correctly registered and responding.

## 14. All x-hikari-trace IDs Collected

| x-hikari-trace | x-railway-edge |
|----------------|----------------|
| `sin1.d1nj` | `sin1` |
| `sin1.98a6` | `sin1` |
| `sin1.tr00` | `sin1` |
| `sin1.hs0s` | `sin1` |
| `sin1.nzn2` | `sin1` |

## 15. Full Request/Response Headers

### Curl Command Used

```bash
curl -s -v https://alaya-insider-api-production.up.railway.app/api/v1/system/health
```

### Request Headers

```
> GET /api/v1/system/health HTTP/1.1
> Host: alaya-insider-api-production.up.railway.app
> User-Agent: curl/8.19.0
> Accept: */*
```

### Response Headers

```
< HTTP/1.1 429 Too Many Requests
< content-type: text/plain; charset=utf-8
< server: railway-hikari
< x-railway-edge: sin1
< x-hikari-trace: sin1.nzn2
< content-length: 12
< date: Mon, 13 Jul 2026 08:45:00 GMT
```

### Response Body (exact 12 bytes)

```
rate limited
```

### Full Header Collection (All Tested Endpoints)

The EXACT SAME response is returned for ALL of these endpoints:

| Endpoint | Method | Status | Server | Body |
|----------|--------|--------|--------|------|
| `/` | GET | 429 | railway-hikari | `rate limited` |
| `/` | HEAD | 429 | railway-hikari | `rate limited` |
| `/` | OPTIONS | 429 | railway-hikari | `rate limited` |
| `/health` | GET | 429 | railway-hikari | `rate limited` |
| `/api/v1/system/health` | GET | 429 | railway-hikari | `rate limited` |
| `/api/v1/system/health` | HEAD | 429 | railway-hikari | `rate limited` |
| `/api/v1/system/health` | OPTIONS | 429 | railway-hikari | `rate limited` |
| `/api/v1/system/info` | GET | 429 | railway-hikari | `rate limited` |
| `/api/v1/products` | GET | 429 | railway-hikari | `rate limited` |
| `/api/v1/auth/login` | POST | 429 | railway-hikari | `rate limited` |

## 16. Internal Health Check Evidence

Railway logs confirm the application IS running correctly and the health endpoint IS responding:

```
<-- GET /api/v1/system/health
--> GET /api/v1/system/health 200 7ms
```

This proves:
- The application container is running
- The Hono server is listening on the correct port
- The health endpoint is correctly registered
- Database connectivity works
- The rate limiter does NOT block health endpoints (our code has the fix)
- **The HTTP 200 response is only returned to internal Railway health checks**
- **External requests receive HTTP 429 from the edge proxy before reaching our app**

## 17. Why the Application is NOT Producing the 429

We have ruled out every application-level cause:

| Potential Cause | Evidence It's NOT the Issue |
|----------------|---------------------------|
| **Rate limiter blocking health** | Our compiled `dist/middleware/rateLimiter.js` explicitly exempts `/system/health` and `/system/info` paths (line 30: `path.includes("/system/health")`). Internal health checks return HTTP 200, proving the exemption works. |
| **Rate limiter blocking OPTIONS** | Our compiled code exempts OPTIONS method (line 24: `c.req.method === "OPTIONS"`). |
| **Rate limiter returning wrong format** | Our rate limiter returns JSON: `{"code":"RATE_LIMIT_EXCEEDED","message":"...","status":429}`. The edge proxy returns plain text: `rate limited`. |
| **Middleware blocking** | Our rate limiter adds `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers. The edge proxy response has NONE of these. |
| **CORS middleware** | CORS is correctly configured and would return proper headers. Edge proxy response has NO CORS headers. |
| **Any middleware returning 429** | No middleware in our app returns plain-text responses. All errors return JSON. |
| **Application not running** | Railway logs show `GET /api/v1/system/health 200 7ms` — application is responding correctly to internal health checks. |
| **Wrong port** | Health check succeeds on port 3001 (default Railway PORT). |
| **Wrong health endpoint path** | railway.json healthcheckPath is `/api/v1/system/health` — matches our handler. |
| **Auth middleware** | Root `/` and `/health` have NO auth middleware applied. They still return 429. |

**Conclusive proof:** The response comes from `railway-hikari`, not our Hono server. This is proven by:
1. **Server header:** `railway-hikari` vs our Hono server
2. **Content-Type:** `text/plain` vs `application/json`
3. **Body format:** `rate limited` (plain text) vs `{"code":"RATE_LIMIT_EXCEEDED","message":"...","status":429}` (JSON)
4. **Missing rate limit headers:** Our code adds `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` to EVERY response — none are present in the edge proxy response
5. **Railway infrastructure headers:** `x-hikari-trace` and `x-railway-edge` present
6. **Universal application:** ALL endpoints return the same 429, including routes our app doesn't define (like `/health` without `/api/v1` prefix)

## 18. Exact Curl Commands Used for Reproduction

```bash
# Basic health check — should return 200
curl -v https://alaya-insider-api-production.up.railway.app/api/v1/system/health

# CORS preflight test — should return 204
curl -v -X OPTIONS \
  -H "Origin: https://alayainsider.com" \
  -H "Access-Control-Request-Method: GET" \
  https://alaya-insider-api-production.up.railway.app/api/v1/system/health

# Auth endpoint test — should return 401 (not 429)
curl -v -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' \
  https://alaya-insider-api-production.up.railway.app/api/v1/auth/login

# Root endpoint — should return 404 or SPA HTML (not 429)
curl -v https://alaya-insider-api-production.up.railway.app/

# System info — should return 200
curl -v https://alaya-insider-api-production.up.railway.app/api/v1/system/info
```

## 19. Expected Response (If Working Correctly)

```json
HTTP/1.1 200 OK
content-type: application/json; charset=utf-8
access-control-allow-origin: *
x-request-id: req_abc123_def
x-ratelimit-limit: 100
x-ratelimit-remaining: 99
x-ratelimit-reset: 1626123456

{
  "status": "healthy",
  "version": "2.0.0",
  "uptime": 1234.56,
  "timestamp": 1626123456789,
  "environment": "production",
  "database": {
    "status": "healthy",
    "poolTotal": 10,
    "poolActive": 1,
    "poolIdle": 9,
    "latencyMs": 2
  }
}
```

## 20. Actual Response (Current Blocked State)

```http
HTTP/1.1 429 Too Many Requests
content-type: text/plain; charset=utf-8
server: railway-hikari
x-railway-edge: sin1
x-hikari-trace: sin1.nzn2
content-length: 12
date: Mon, 13 Jul 2026 08:45:00 GMT

rate limited
```

## 21. DNS & SSL Verification

| Check | Result |
|-------|--------|
| Domain resolves | ✅ `69.46.46.31` |
| SSL certificate | ✅ Valid, Let's Encrypt (CN=*.up.railway.app) |
| Valid from | Jul 3, 2026 |
| Valid to | Oct 1, 2026 |
| Issuer | Let's Encrypt YE1 |
| alayainsider.com resolves | ✅ Hostinger IPs (93.127.173.16, 91.108.106.69) |

## 22. Concise Problem Statement for Railway Engineers

**Subject:** Production outage — `railway-hikari` edge proxy returning HTTP 429 for ALL requests

**Service:** `alaya-insider-api` (Project: `f608e91f`, Service: `8508d9cb`)

**Deployment:** Latest: `40b21a62` (SUCCESS). All recent deployments are SUCCESS.

**Symptom:** Every external HTTP request to `https://alaya-insider-api-production.up.railway.app` returns HTTP 429 with body `rate limited` from `railway-hikari`. This affects ALL endpoints and ALL HTTP methods (GET, HEAD, OPTIONS, POST) uniformly.

**Internal health checks succeed:** The Railway health check system reports HTTP 200 for `GET /api/v1/system/health`. The application is running correctly inside the container.

**Root cause hypothesis:** The service experienced approximately 104 container restarts on July 11 due to early deployment failures. This rapid restart pattern likely triggered Railway's edge-level anti-abuse protection at the `railway-hikari` proxy layer. The application code has since been fixed (rate limiter now exempts health endpoints), confirmed compiled and deployed, but the edge proxy continues to block ALL external traffic.

**Evidence the block is at the edge layer:**
1. Response `Server: railway-hikari` — not our Hono application
2. Response body is plain text `rate limited` — our app returns JSON
3. Response has `x-hikari-trace` and `x-railway-edge` headers — Railway infrastructure only
4. No application-level headers present (`X-RateLimit-Limit`, `X-Request-Id`)
5. ALL endpoints return identical 429 — including routes our app doesn't define
6. Internal Railway health checks reach our app (HTTP 200), but external requests are blocked before reaching the container

**Requested action:** Please investigate and reset the edge proxy rate limit for this service. Provide any available trace IDs (`x-hikari-trace: sin1.*`) for investigation.

---

*End of evidence package*
