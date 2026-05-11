# ADR 0001: Monorepo Tooling And Local Topology

## Status

Accepted

## Context

InsightFlow AI combines multiple runtimes:

- Next.js frontend
- NestJS backend
- Python ETL worker
- Python AI analyst service
- PostgreSQL

The repository needs a predictable local structure before application code is added.

## Decision

- Use a monorepo layout with `apps/`, `services/`, `database/`, `docs/`, and `powerbi/`
- Use `pnpm` as the Node workspace package manager
- Keep Python services outside the Node workspace
- Use Docker Compose as the baseline local orchestration mechanism
- Bootstrap PostgreSQL with the four planned schemas at container initialization
- Keep documentation and PlantUML sources in the repository from the start

## Consequences

- Service ownership is clear before framework scaffolding begins
- Local development can converge on stable service names and ports early
- Database conventions are established before ETL and analytics code exists
- Later phases can replace placeholder containers without changing the topology
