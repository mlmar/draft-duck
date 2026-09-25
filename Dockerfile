# API image only. Workspaces resolve from the repo root.
FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY app/api/package.json app/api/
COPY app/core/package.json app/core/
# Workspace graph needs the client manifest. Source stays out of the image.
COPY app/client/package.json app/client/

# The lockfile also has client Vite. Its esbuild (0.25) fights tsx's (0.28).
# ignore-scripts skips postinstall. Drop Vite, then install only tsx's esbuild binary.
# Do not `npm rebuild esbuild`: that walks Vite's copy and dies (verify 36187397297).
# HUSKY=0: prepare would call husky, which is omit=dev and not in the image.
ENV HUSKY=0
RUN npm ci --omit=dev --workspace=@draft-duck/api --workspace=@draft-duck/core --include-workspace-root --ignore-scripts \
    && rm -rf node_modules/vite \
    && node node_modules/esbuild/install.js

COPY app/api app/api
COPY app/core app/core
COPY app/data app/data

ENV NODE_ENV=production
# Cloud Run must reach the process. Local listen stays 127.0.0.1 unless HOST is set.
ENV HOST=0.0.0.0
EXPOSE 8080

CMD ["npm", "run", "start", "-w", "@draft-duck/api"]
