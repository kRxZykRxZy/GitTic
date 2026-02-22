# ---- Stage 1: Base ----
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ---- Stage 2: Install deps ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages ./packages
RUN pnpm install --frozen-lockfile

# ---- Stage 3: Build ----
FROM base AS build
WORKDIR /app

# Copy node_modules from deps stage BEFORE copying source
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=deps /app/package.json /app/package.json
COPY --from=deps /app/pnpm-workspace.yaml /app/pnpm-workspace.yaml
COPY --from=deps /app/.npmrc /app/.npmrc

# Now copy the full source code, including tsconfig.json
COPY . .

# Build all workspace packages
RUN pnpm run build

# ---- Stage 4: Production ----
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache git
WORKDIR /app

# Copy built output and lockfiles
COPY --from=build /app/packages /app/packages
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Install only production deps
RUN pnpm install --prod --frozen-lockfile

# Create data directories
RUN mkdir -p /app/data/repos /app/data/backups /app/data/artifacts

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV DB_DRIVER=sqlite
ENV SQLITE_PATH=/app/data/platform.sqlite
ENV GIT_STORAGE_PATH=/app/data/repos
ENV BACKUP_PATH=/app/data/backups
ENV ARTIFACTS_PATH=/app/data/artifacts

EXPOSE 3000 3001

CMD ["node", "packages/backend/dist/index.js"]
