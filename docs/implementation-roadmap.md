# InsightFlow AI Implementation Roadmap

## Purpose

This roadmap turns the project scope into an execution plan with clear phase boundaries, subtasks, and phase exit criteria.

The target end state is:

- Locally runnable with `docker compose up --build`
- Locally testable with automated checks and smoke tests
- Deployable from container images with environment-driven configuration
- Documented with extensive Markdown guides and PlantUML source diagrams

## Delivery Principles

- Build vertical slices early so each phase leaves the system in a runnable state.
- Keep PostgreSQL as the shared source of truth across app, ETL, analytics, and BI.
- Favor deterministic local development: seeded data, mock APIs, scripted setup, repeatable Docker workflows.
- Treat documentation as a first-class deliverable in every phase, not only at the end.
- Gate AI features behind read-only SQL policies and explicit query guards.

## Final Definition Of Done

The roadmap is complete when all of the following are true:

- `docker compose up --build` starts `web`, `api`, `postgres`, `etl-worker`, and `ai-analyst`
- `.env.example` is sufficient to bootstrap a local environment
- Database migrations and seed scripts prepare `raw`, `staging`, `analytics`, and `app` schemas
- At least one full ETL flow runs locally from source ingestion to analytics tables
- The web dashboard shows live metrics from PostgreSQL
- The AI analyst answers approved business questions against seeded analytical data
- Power BI can connect to documented analytics views
- The repository includes setup, architecture, API, ETL, AI, deployment, testing, and troubleshooting docs
- PlantUML source files cover architecture, container deployment, and ETL data flow

## Recommended Phase Structure

## Phase 0 - Foundation And Planning

### Goal

Create a stable repository baseline, define standards, and lock in the developer workflow.

### Subtasks

- Create the monorepo folder structure from the project scope
- Choose and document the workspace toolchain for Node and Python services
- Define branching, naming, environment variable, and commit conventions
- Add base `README.md`, `docs/README.md`, and architecture decision placeholders
- Establish the initial Docker Compose topology and service naming
- Define the first version of the database schemas: `app`, `raw`, `staging`, `analytics`
- Create starter PlantUML diagrams for architecture, deployment, and ETL flow
- Write a milestone tracker that maps modules to delivery phases

### Deliverables

- Repository skeleton
- Base documentation structure
- Initial Docker Compose draft
- Initial PlantUML sources

### Exit Criteria

- The repository layout matches the intended platform architecture
- New contributors can understand the service boundaries from documentation alone
- Phase ownership and scope boundaries are documented

## Phase 1 - Platform Skeleton And Authentication

### Goal

Stand up the main services and deliver the first working full-stack slice.

### Subtasks

- Scaffold the Next.js frontend with Sass Modules and route structure
- Scaffold the NestJS backend with Swagger, configuration, and health checks
- Scaffold the Python ETL worker and FastAPI AI service with health endpoints
- Provision PostgreSQL and migration tooling
- Implement `app.users` and authentication tables
- Build register, login, and `me` endpoints with JWT auth
- Add a protected frontend shell with login flow and session persistence
- Add base Dockerfiles for `web`, `api`, `etl-worker`, and `ai-analyst`
- Create local smoke tests for service startup and auth flow

### Deliverables

- Running frontend, backend, Python services, and database
- Authentication flow
- Health endpoints
- Swagger baseline

### Exit Criteria

- A user can register and log in locally
- All services start together in Docker
- Health and auth smoke tests pass

## Phase 2 - Data Sources And Mock Providers

### Goal

Allow the application to register and validate business data sources before ETL orchestration.

### Subtasks

- Model `app.data_sources` and supporting enums
- Implement CRUD endpoints for data sources
- Add connection test endpoints and status handling
- Create fake source providers for e-commerce, CRM, marketing, and support data
- Define CSV import contract and storage approach for local development
- Build frontend pages for listing, creating, editing, and testing data sources
- Add API and UI validation rules for source configuration
- Document source types, payload contracts, and expected schedules

### Deliverables

- Data source backend module
- Mock provider endpoints or fixtures
- Data sources frontend flow
- Source contract documentation

### Exit Criteria

- A user can register a fake API source and a CSV source
- The platform can validate connectivity for supported source types
- Source definitions are persisted and visible in the UI

## Phase 3 - ETL Backbone And Operational Logging

### Goal

Deliver the first end-to-end ingestion pipeline with traceable job execution.

### Subtasks

- Create `app.etl_jobs`, `app.etl_job_logs`, and pipeline status models
- Implement manual ETL run and retry endpoints in NestJS
- Build ETL worker pipeline stages: extract, validate, transform, load raw, load staging, load analytics, log results
- Add Pydantic validation models and record-level error handling
- Create `raw` and `staging` tables for the MVP sources
- Implement duplicate handling, date normalization, numeric cleaning, and currency normalization
- Persist job metrics such as processed rows, rejected rows, duration, and final status
- Build frontend pipeline run list, job detail, and log viewer screens
- Add integration tests for a successful ETL run and a controlled failure path

### Deliverables

- ETL orchestration flow
- Pipeline log model
- Raw and staging layer
- Pipeline monitoring UI

### Exit Criteria

- A user can manually trigger an ETL job
- The job writes logs and status updates visible in the UI
- Cleaned records land in `raw` and `staging` tables

## Phase 4 - Analytics Model And KPI Delivery

### Goal

Transform cleaned data into a usable analytical model and expose business KPIs to the dashboard.

### Subtasks

- Create star schema dimensions and fact tables in `analytics`
- Define surrogate key strategy and dimension loading rules
- Implement fact loading for sales and related campaign or region references
- Add analytical SQL views and materialized views for dashboard queries
- Build backend analytics endpoints for overview, revenue, products, regions, customers, and campaigns
- Add chart-ready response contracts for the frontend
- Build dashboard cards, tables, and charts using seeded analytics data
- Add database query tests for KPI correctness
- Document the data model, KPI definitions, and transformation logic

### Deliverables

- `analytics` star schema
- KPI endpoints
- Dashboard pages populated from real data
- Data model documentation

### Exit Criteria

- The dashboard shows metrics generated from analytics tables
- KPI definitions are documented and reproducible
- Materialized views refresh as part of the ETL process where needed

## Phase 5 - AI Analyst Assistant

### Goal

Add a safe AI analysis layer on top of the analytical model.

### Subtasks

- Implement FastAPI question and report-summary endpoints
- Create prompt templates for classification, SQL selection, summarization, and executive reporting
- Restrict database access to read-only analytical queries
- Implement SQL guardrails for allowed statements, schemas, limits, and timeouts
- Build a predefined query registry for common business questions
- Add fallback guarded SQL generation for supported analytical intents
- Create the frontend AI analyst page with chat, result table, SQL preview, and suggested prompts
- Persist question history or request audit logs as needed in `app`
- Add tests for blocked SQL, allowed SQL, and stable answer formatting
- Document AI safety rules, prompt strategy, and operational limitations

### Deliverables

- AI analyst service
- Safe SQL execution policy
- AI analyst frontend
- AI architecture and safety docs

### Exit Criteria

- The AI analyst answers approved questions against local seeded data
- Unsafe SQL attempts are rejected reliably
- The UI exposes both insight summaries and supporting result sets

## Phase 6 - Power BI Integration And Reporting Layer

### Goal

Make the analytics layer consumable by external BI tooling and document the reporting workflow.

### Subtasks

- Stabilize Power BI-facing views in `analytics`
- Create a Power BI connection guide for local PostgreSQL and containerized PostgreSQL
- Define the report page specification for executive overview, sales, customers, marketing, and pipeline health
- Produce a starter `.pbix` file or a documented report build procedure
- Capture report screenshots for repository documentation
- Add a reports page in the frontend linking to assets, screenshots, and setup instructions
- Document table-to-visual mappings and KPI meanings for each report page

### Deliverables

- Power BI integration guide
- Reporting assets or reproducible report instructions
- Reports page in the web app

### Exit Criteria

- Power BI can connect to the analytics schema using the documented steps
- Report pages are defined and reproducible
- Reporting documentation is complete enough for a reviewer to rebuild the report

## Phase 7 - Quality, Docker Hardening, And Release Documentation

### Goal

Finish the project as a locally testable and container-deployable platform with portfolio-grade documentation.

### Subtasks

- Harden Dockerfiles with reproducible builds and explicit runtime dependencies
- Finalize `docker-compose.yml` for local development and smoke-test execution
- Add startup ordering, readiness checks, and seed/bootstrap scripts
- Create a single command path for local setup, database migration, seeding, and smoke testing
- Add automated test coverage across frontend, backend, ETL worker, and AI service
- Add end-to-end smoke tests covering login, source registration, ETL execution, KPI rendering, and AI question flow
- Document deployment configuration for local Docker and a production-like container environment
- Expand Markdown documentation: setup, architecture, ADRs, API contracts, data model, ETL flow, AI safety, Power BI usage, testing, troubleshooting, deployment
- Finalize PlantUML sources and include render/export instructions
- Capture screenshots and write a portfolio case study narrative

### Deliverables

- Production-ready local Docker environment
- Automated test and smoke-test workflow
- Extensive Markdown documentation set
- Final PlantUML documentation pack

### Exit Criteria

- A fresh clone can be started locally with documented commands
- Core workflows are testable without manual database intervention
- The project is understandable from docs without reading the code first

## Suggested Documentation Set

These files should exist by the end of the roadmap:

- `README.md`
- `docs/README.md`
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/etl-pipeline.md`
- `docs/ai-assistant.md`
- `docs/api-contract.md`
- `docs/testing.md`
- `docs/deployment.md`
- `docs/troubleshooting.md`
- `docs/adr/`
- `powerbi/README.md`

## Suggested PlantUML Set

These source diagrams should exist by the end of the roadmap:

- `docs/plantuml/system-context.puml`
- `docs/plantuml/container-deployment.puml`
- `docs/plantuml/etl-flow.puml`
- `docs/plantuml/data-model-star-schema.puml`
- `docs/plantuml/ai-question-flow.puml`

## Recommended Build Order

1. Complete Phases 0 and 1 before writing feature code.
2. Finish Phase 2 before building ETL orchestration in Phase 3.
3. Finish Phase 3 before investing heavily in dashboard work from Phase 4.
4. Finish Phase 4 before enabling AI query execution in Phase 5.
5. Leave Phase 7 as a strict release gate, not an optional cleanup phase.

## Risk Notes

- Power BI assets may not be fully source-controllable if built only in the desktop client, so the repository should include screenshots and a rebuild guide even if a `.pbix` file is present.
- AI-generated SQL should remain secondary to predefined analytical queries until KPI definitions are stable.
- The fastest way to lose confidence in this project is to defer test automation and documentation until the end.
