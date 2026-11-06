# One image with the api and both built apps (ADR-026). Build context: the repo root.
FROM node:24-alpine AS build-admin
WORKDIR /app
COPY apps/admin/package.json apps/admin/package-lock.json ./
RUN npm ci
COPY apps/admin ./
RUN npm run build

FROM node:24-alpine AS build-tv
WORKDIR /app
COPY apps/tv/package.json apps/tv/package-lock.json ./
RUN npm ci
COPY apps/tv ./
RUN npm run build

FROM node:24-alpine
ENV NODE_ENV=production WEB_ROOT=/srv/web HOST=0.0.0.0 PORT=8787
WORKDIR /srv/api
COPY apps/api/package.json apps/api/package-lock.json ./
RUN npm ci --omit=dev
# Node runs the TypeScript sources directly (type stripping), so there is no api build step.
COPY apps/api/src ./src
COPY --from=build-admin /app/dist /srv/web/admin
COPY --from=build-tv /app/dist /srv/web/tv
RUN mkdir -p /data/state && chown node /data/state
USER node
EXPOSE 8787
CMD ["node", "src/server.ts"]
