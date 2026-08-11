# ─── Builder ────────────────────────────────────────────────────────────────
# Installs full deps (incl. devDependencies), generates the Prisma client,
# and compiles TypeScript to dist/.
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─── Production ─────────────────────────────────────────────────────────────
# Production-only deps, Prisma client regenerated against this image's engine
# binary target, compiled output copied in from the builder stage.
FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
USER nodejs

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://localhost:${PORT:-3002}/health" || exit 1

CMD ["node", "dist/server.js"]
