FROM node:22-slim AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/video/package.json ./packages/video/
COPY packages/payments/package.json ./packages/payments/

RUN pnpm install --frozen-lockfile

COPY . .

# Build the API and all its workspace dependencies (note the three dots)
RUN pnpm --filter @physio/api... build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app /app
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/main.js"]