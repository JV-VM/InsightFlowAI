FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json

RUN corepack enable && pnpm install --filter @insightflow/api... --no-frozen-lockfile

COPY apps/api ./apps/api

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["pnpm", "start:dev"]
