# ALAYA INSIDER — Backend API Dockerfile
# ============================================================================
# Multi-stage build for production deployment on Railway.
#
# Build:  docker build -t alaya-insider-api -f server/Dockerfile server/
# Run:    docker run -p 3001:3001 -e DATA_DIR=/data alaya-insider-api
#
# Environment variables (set in Railway dashboard):
#   PORT              — Server port (default: 3001)
#   HOST              — Server host (default: 0.0.0.0)
#   DATA_DIR          — Persistent storage path (default: /data)
#   BIRD_API_KEY      — Bird API key for transactional email
#   BIRD_EMAIL_FROM   — Sender email address for Bird
#   TWILIO_*          — Twilio credentials for SMS (optional)
# ============================================================================

# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci

# Copy source and compile
COPY . .
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine AS production

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Create data directory for persistent JSON store
# On Railway, mount a volume at /data and set DATA_DIR=/data
RUN mkdir -p /data && chown -R appuser:appgroup /data /app

# Copy only production artifacts
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

# Ensure schema.sql is available in the dist/db directory for migrations
COPY --from=build /app/src/db/schema.sql ./dist/db/schema.sql

# Switch to non-root user (principle of least privilege)
USER appuser

EXPOSE 3001

# Environment defaults
ENV DATA_DIR=/data
ENV NODE_ENV=production
ENV HOST=0.0.0.0

# Security: limit heap memory, suppress Node.js core deprecation warnings in production
# Run apk upgrade to patch base image CVE layers
RUN apk upgrade --no-cache
ENV NODE_OPTIONS="--max-old-space-size=512"

# Health check (pure Node.js — no external deps needed)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||3001)+'/api/v1/system/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# Start the compiled server
CMD ["node", "dist/index.js"]
