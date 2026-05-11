# Testing Strategy

This document will define the local and CI testing strategy.

## Planned Coverage

- Unit tests
- Integration tests
- End-to-end smoke tests
- Test data strategy
- Container-based local verification

## Local Smoke Test

Start the local services:

```bash
docker compose up -d --build
```

Run the smoke test:

```bash
corepack pnpm smoke:local
```

The smoke test exercises:

- API health
- AI analyst health
- user registration, login, and profile lookup
- CSV source registration and connection testing
- ETL orders pipeline through the Python worker
- analytics refresh and KPI totals
- AI analyst supported question
- AI analyst blocked unsafe SQL-like request

Environment overrides:

```bash
API_BASE_URL=http://127.0.0.1:3001/api AI_BASE_URL=http://127.0.0.1:8002 corepack pnpm smoke:local
```

## Build Checks

```bash
corepack pnpm --dir apps/api build
corepack pnpm --dir apps/web build
python3 -m py_compile services/etl-worker/main.py
python3 -m py_compile services/ai-analyst/main.py
```

## Test Data

The canonical MVP source file is:

```text
database/seeds/demo-orders.csv
```

The smoke test creates a new CSV data source pointing at that file. Each run writes new app, ETL, analytics, and AI audit rows into PostgreSQL.

## CI Candidate

A future CI workflow should run:

1. `docker compose up -d --build`
2. wait for service healthchecks
3. `corepack pnpm smoke:local`
4. collect container logs on failure
