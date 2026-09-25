# API image only. Workspaces resolve from the repo root.
FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY app/api/package.json app/api/
COPY app/core/package.json app/core/
# Workspace graph needs the client manifest. Source stays out of the image.
COPY app/client/package.json app/client/

RUN npm ci --omit=dev --workspace=@draft-duck/api --workspace=@draft-duck/core --include-workspace-root

COPY app/api app/api
COPY app/core app/core
COPY app/data app/data

ENV NODE_ENV=production
# Cloud Run must reach the process. Local listen stays 127.0.0.1 unless HOST is set.
ENV HOST=0.0.0.0
EXPOSE 8080

CMD ["npm", "run", "start", "-w", "@draft-duck/api"]
