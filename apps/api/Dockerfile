# ============================================
# API Gateway Dockerfile
# Multi-stage build for production optimization
# ============================================

# --------------------------------------------
# Stage 1: Dependencies
# Install production dependencies
# --------------------------------------------
FROM node:20-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace configuration files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy all package.json files for workspace packages
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
COPY packages/utils/package.json ./packages/utils/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# --------------------------------------------
# Stage 2: Builder
# Build the TypeScript code
# --------------------------------------------
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/config/node_modules ./packages/config/node_modules
COPY --from=deps /app/packages/utils/node_modules ./packages/utils/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy source code
COPY packages/types ./packages/types
COPY packages/config ./packages/config
COPY packages/utils ./packages/utils
COPY apps/api ./apps/api
COPY tsconfig.json pnpm-workspace.yaml package.json ./

# Build packages in order
RUN pnpm --filter @price-comparison/types build
RUN pnpm --filter @price-comparison/config build
RUN pnpm --filter @price-comparison/utils build
RUN pnpm --filter @price-comparison/api build

# --------------------------------------------
# Stage 3: Production Runner
# Minimal image for running the API
# --------------------------------------------
FROM node:20-alpine AS runner

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Add labels for container metadata
LABEL org.opencontainers.image.title="Price Comparison API Gateway"
LABEL org.opencontainers.image.description="API Gateway for the Price Comparison Platform"
LABEL org.opencontainers.image.version="1.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 api

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV API_PORT=4000

# Copy workspace config
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./

# Copy built packages
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/config/dist ./packages/config/dist
COPY --from=builder /app/packages/config/package.json ./packages/config/
COPY --from=builder /app/packages/utils/dist ./packages/utils/dist
COPY --from=builder /app/packages/utils/package.json ./packages/utils/

# Copy built API
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Change ownership to non-root user
RUN chown -R api:nodejs /app

# Switch to non-root user
USER api

# Expose API port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Start the API
CMD ["node", "apps/api/dist/index.js"]
