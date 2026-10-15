# ==============================================================================
# Guided Annual Planner — Production Multi-Stage Dockerfile
# Security: Non-root execution, dumb-init signal handling, zero baked secrets
# ==============================================================================

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests for caching
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/

# Reproducible installation of dependencies
RUN npm ci

# Copy source code and build configs
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/
COPY tsconfig.base.json ./

# Compile all workspaces (shared -> server -> client)
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Production runtime stage
FROM node:20-alpine AS runner

# Install dumb-init for reliable PID 1 process supervision and signal forwarding
RUN apk add --no-cache dumb-init wget

WORKDIR /app

# Set default production environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Copy workspace package manifests
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install strictly production dependencies
RUN npm ci --omit=dev

# Copy compiled artifacts from builder
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# Switch to the non-root 'node' user provided by node:20-alpine
USER node

# Expose API and frontend application port
EXPOSE 5000

# Container healthcheck targeting the /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Execute server via dumb-init for graceful SIGTERM/SIGINT shutdown handling
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["npm", "run", "start"]
