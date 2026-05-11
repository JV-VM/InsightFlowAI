# ETL Pipeline

This document will describe the ETL lifecycle from source extraction to analytics refresh.

## Planned Coverage

- Pipeline stages
- Validation rules
- Cleaning rules
- Failure handling
- Logging and observability

## Current Reference

- [ETL Flow PlantUML](./plantuml/etl-flow.puml)

## Current Phase 3 Contract

The API exposes a persisted local orchestrator at `POST /api/etl-jobs/run`.

Current deterministic stages:

1. `queued`
2. `extract`
3. `validate`
4. `transform`
5. `load_raw`
6. `load_staging`
7. `load_analytics`

The API creates the job and delegates record-level execution to the Python ETL worker. The worker loads extracted rows into `raw.orders`, validates and normalizes accepted records into `staging.orders`, then returns metrics and stage logs for the API to persist in `app.etl_jobs` and `app.etl_job_logs`.

## CSV MVP Contract

Seed file: `database/seeds/demo-orders.csv`

Required columns:

- `order_id`
- `order_date`
- `customer_email`
- `product_sku`
- `product_name`
- `region`
- `quantity`
- `unit_price`
- `currency`
- `campaign`

Initial cleaning rules:

- `order_date` must parse to a date.
- `quantity` must parse to a positive integer.
- `unit_price` must parse to a non-negative decimal.
- `currency` is normalized to uppercase.
- Empty optional campaign values are treated as unattributed.

## Current Load Behavior

- CSV sources read from `config.path`.
- Fake API sources emit one deterministic mock order record.
- All extracted rows are inserted into `raw.orders`.
- Valid orders are inserted into `staging.orders`.
- Invalid orders are counted as rejected rows and omitted from staging.
- Analytics loading is represented by the `load_analytics` log stage until Phase 4 creates the analytical model.
