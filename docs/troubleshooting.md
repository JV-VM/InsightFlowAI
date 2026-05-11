# Troubleshooting

This document will collect operational issues and known fixes.

## Planned Coverage

- Docker startup failures
- Database connectivity issues
- Migration problems
- ETL job failures
- AI configuration issues

## Docker Startup

Check service health:

```bash
docker compose ps
```

Read logs:

```bash
docker compose logs api etl-worker ai-analyst web
```

If a service is stuck waiting for dependencies, rebuild the affected image:

```bash
docker compose up -d --build api
```

## Database Connectivity

For host-based API development, the API defaults to:

```text
postgresql://insightflow:insightflow@127.0.0.1:5432/insightflow
```

For container-based API development, Docker Compose injects:

```text
postgresql://insightflow:insightflow@postgres:5432/insightflow
```

Use the correct hostname for the runtime context.

## ETL Worker Failures

The orders pipeline expects CSV sources to include:

```json
{
  "path": "database/seeds/demo-orders.csv"
}
```

Verify the worker can see the seed file by rebuilding it:

```bash
docker compose up -d --build etl-worker
```

## AI Analyst Failures

The AI analyst reads from the `analytics` schema. Run an ETL job and refresh analytics before asking questions:

```bash
curl -X POST http://127.0.0.1:3001/api/analytics/refresh
```

Unsafe SQL-like questions are expected to return `status: "blocked"`.

## Smoke Test Failures

Run:

```bash
corepack pnpm smoke:local
```

If it fails, inspect the service mentioned in the failing step and then rerun the test. The script creates unique users and sources on each run, so reruns do not require manual cleanup.
