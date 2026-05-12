FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/package.json

RUN corepack enable && pnpm install --filter @insightflow/api... --no-frozen-lockfile

COPY apps/api ./apps/api

WORKDIR /app/apps/api

RUN pnpm build

EXPOSE 3001

CMD ["pnpm", "start"]
