# Multi-stage: `dev` keeps the Vite dev server + HMR for local docker-compose
# development; `prod` builds the static bundle and serves it with a plain
# static file server. Nothing here defaults to `dev` implicitly — every
# caller (docker-compose.yml, the release workflow) must pass `target`
# explicitly, so a build can never silently ship the dev server as "prod"
# again (see docs/KNOWN_ISSUES.md).

FROM node:20-alpine AS base
WORKDIR /app
COPY package.json ./
RUN npm install

# ── dev: used by docker-compose.yml (local development, HMR via volume mount) ──
FROM base AS dev
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

# ── build: produces the static production bundle ───────────────────────────────
FROM base AS build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY . .
RUN npm run build

# ── prod: serves the built bundle only — no dev server, no source, no node_modules
# dev-deps. `serve -s` rewrites unknown paths to index.html for React Router. ──
FROM node:20-alpine AS prod
WORKDIR /app
RUN npm install -g serve@14
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
