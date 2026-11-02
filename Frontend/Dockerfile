# ── Stage 1: Build React Frontend ────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --prefer-offline

# Copy source & build
COPY index.html vite.config.js tsconfig.json ./
COPY src/ ./src/
COPY public/ ./public/
RUN npm run build

# ── Stage 2: Build Backend ────────────────────────────────────────────────────
FROM node:20-alpine AS backend-builder

WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci --omit=dev --prefer-offline

# ── Stage 3: Production Image ─────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Labels
LABEL name="e-disiplin-asn" \
      version="1.0.0" \
      description="E-Disiplin ASN — Platform Terpadu Pengawasan Disiplin Pegawai"

# Copy backend dependencies
COPY --from=backend-builder /app/server/node_modules ./server/node_modules

# Copy backend source
COPY server/src/ ./server/src/
COPY server/package.json ./server/package.json

# Copy built frontend into dist/ (agar Express bisa serve dari ../dist)
COPY --from=frontend-builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p ./server/uploads && chown -R node:node /app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-5000}/api/health || exit 1

# Run as non-root user
USER node

WORKDIR /app/server

EXPOSE 5000

CMD ["node", "src/server.js"]
