FROM node:22-alpine AS base

FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile --ignore-scripts;

FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && pnpm run build;

FROM base AS runner

WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist

ENTRYPOINT ["node", "dist/index.js"]