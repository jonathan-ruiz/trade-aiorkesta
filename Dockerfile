# Multi-stage build for trade.aiorkesta.com
# Supports monorepo structure with apps/web frontend

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy lockfile and package.json (supports npm/pnpm/yarn/bun)
COPY package*.json yarn.lock* pnpm-lock.yaml* bun.lockb* ./

# Install dependencies based on lockfile
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm install --frozen-lockfile; \
  elif [ -f yarn.lock ]; then \
    yarn install --frozen-lockfile; \
  elif [ -f bun.lockb ]; then \
    npm install -g bun && bun install --frozen-lockfile; \
  else \
    npm ci; \
  fi

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm run build; \
  elif [ -f yarn.lock ]; then \
    yarn build; \
  elif [ -f bun.lockb ]; then \
    npm install -g bun && bun run build; \
  else \
    npm run build; \
  fi

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 trader

# Copy built artifacts
# Adjust these paths once the actual structure is defined
COPY --from=builder /app/public ./public
COPY --from=builder --chown=trader:nodejs /app/.next/standalone ./
COPY --from=builder --chown=trader:nodejs /app/.next/static ./.next/static

USER trader

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
