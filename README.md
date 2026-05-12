# InsightFlow AI

InsightFlow AI is a full-stack business intelligence automation platform built around Next.js, NestJS, Python services, PostgreSQL, and Power BI.

The repository is currently scaffolded through Phase 7 local release hardening:

- Monorepo folder structure
- Local Docker Compose topology
- Database schema bootstrap for `app`, `raw`, `staging`, and `analytics`
- Planning and documentation baseline
- Initial PlantUML sources
- Next.js login and protected dashboard routes
- NestJS health and PostgreSQL-backed auth endpoints
- Data source registration UI and mock connection testing endpoints
- PostgreSQL-backed data source persistence
- ETL job orchestration API, persisted job logs, and pipeline run UI
- Python ETL worker loading MVP order records into `raw.orders` and `staging.orders`
- Analytics star schema, KPI endpoints, and dashboard metrics
- AI analyst service with predefined safe analytical queries, SQL guardrails, and audit logs
- Power BI reporting views, report page specification, and in-app reports page
- Docker healthchecks, release-gate smoke test, and expanded operational docs

## Repository Layout

```text
apps/
  web/             Next.js frontend
  api/             NestJS backend
services/
  etl-worker/      Python ETL service
  ai-analyst/      Python FastAPI AI service
database/
  init/            PostgreSQL bootstrap SQL
  migrations/      Future migration files
  seeds/           Future seed datasets and loaders
  schemas/         Schema documentation
  views/           Analytical view definitions
  materialized-views/
docs/
  adr/             Architecture decision records
  plantuml/        Source diagrams
powerbi/
  reports/         Power BI assets
  screenshots/     Documentation screenshots
```

## Local Baseline

The current `docker-compose.yml` provides a development topology for:

- `postgres`
- `web`
- `api`
- `etl-worker`
- `ai-analyst`

The application services expose Phase 7 runtime behavior: the API has health, auth, data source, ETL job, and analytics endpoints; the web app has login, protected dashboard, source registration, pipeline run, analytics, AI analyst, and reports screens; the ETL worker loads MVP order data into PostgreSQL; the AI analyst answers guarded analytical questions; Power BI can consume stable `analytics.pbi_*` views; and the stack has healthchecks plus a smoke-test release gate.

## Getting Started

1. Optional: copy `.env.example` to `.env` if you want to override defaults early
2. Start the local stack:

```bash
docker compose up -d --build
```

3. Verify PostgreSQL is healthy:

```bash
docker compose ps
```

4. Run the end-to-end smoke test:

```bash
corepack pnpm smoke:local
```

For host-based API development outside Docker, start PostgreSQL first and rely on the API's default local connection string:

```bash
docker compose up -d postgres etl-worker
ETL_WORKER_URL=http://127.0.0.1:8001 corepack pnpm --dir apps/api start:dev
```

## Render Deployment

The repository includes a `render.yaml` Blueprint for the full stack:

- `insightflow-web`: public frontend
- `insightflow-api`: public API
- `insightflow-etl-worker`: private ETL service
- `insightflow-ai-analyst`: public AI service
- `insightflow-postgres`: managed PostgreSQL

Import the repo into Render as a Blueprint and let it create the stack from `render.yaml`. The blueprint wires the API to the worker and the services to the managed database. The frontend build uses the public API and AI URLs defined in the blueprint, so keep those service names unchanged unless you update the URLs too.

## Documentation

- [Scope Document](./InsightFlow_AI_Project_Scope.md)
- [Implementation Roadmap](./docs/implementation-roadmap.md)
- [Documentation Index](./docs/README.md)

## Current Priorities

- Add deeper unit/integration test coverage around API services and Python loaders
- Capture final portfolio screenshots and optional Power BI `.pbix`
