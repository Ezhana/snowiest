# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH
WORKDIR /workspace
RUN corepack enable

FROM base AS deps
COPY . .
RUN pnpm install --frozen-lockfile

FROM deps AS build
ARG NUXT_PUBLIC_SITE_URL=https://snowiest.me
ENV NUXT_PUBLIC_SITE_URL=${NUXT_PUBLIC_SITE_URL}
RUN pnpm nx run web:build

FROM node:${NODE_VERSION}-bookworm-slim AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000
WORKDIR /app
COPY --from=build /workspace/apps/web/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
