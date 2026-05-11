# API Service

This directory contains the Phase 1 NestJS backend scaffold.

Planned modules:

- `auth`
- `users`
- `data-sources`
- `etl-jobs`
- `analytics`
- `ai`
- `reports`
- `health`
- `common`

Current state:

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- Swagger UI at `/api/docs`

Current limitation:

- Authentication is in-memory for Phase 1 scaffolding and will be moved to PostgreSQL-backed persistence later in the phase.
