# Deployment

This document will describe how to run the system locally and how to package it for containerized deployment.

## Planned Coverage

- Docker Compose workflows
- Service configuration
- Secrets and environment variables
- Migration and seed order
- Production hardening checklist

## Reporting Configuration

Power BI connects directly to PostgreSQL. For local demos, expose PostgreSQL on `POSTGRES_PORT` and connect to:

- Server: `localhost:5432`
- Database: `insightflow`
- Schema: `analytics`

The reporting views are named with the `analytics.pbi_*` prefix and are created by database bootstrap.

## Local Release Gate

Before considering the local build releasable, run:

```bash
docker compose up -d --build
corepack pnpm smoke:local
```

The Compose file includes healthchecks for `web`, `api`, `etl-worker`, `ai-analyst`, and PostgreSQL.
