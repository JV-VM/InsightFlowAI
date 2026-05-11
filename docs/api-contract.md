# API Contract

This document will capture the public REST contract between the frontend and the backend.

## Planned Coverage

- Authentication endpoints
- Data source endpoints
- ETL job endpoints
- Analytics endpoints
- AI assistant endpoints
- Report endpoints

## Authentication

Base path: `/api/auth`

- `POST /register` creates a local development user and returns `{ token, user }`.
- `POST /login` authenticates an existing local development user and returns `{ token, user }`.
- `GET /me` returns the current user profile when called with a bearer token.

Users are stored in `app.users`. Passwords are persisted as salted scrypt hashes; raw passwords are never returned by the API.

## Data Sources

Base path: `/api/data-sources`

Supported source types:

- `ECOMMERCE`
- `CRM`
- `MARKETING`
- `SUPPORT`
- `CSV`

Supported statuses:

- `DRAFT`
- `CONNECTED`
- `FAILED`
- `DISABLED`

### Create

`POST /api/data-sources`

```json
{
  "name": "Shopify Demo Store",
  "type": "ECOMMERCE",
  "schedule": "daily",
  "config": {
    "provider": "shopify",
    "apiKey": "local-demo-key"
  }
}
```

### List

`GET /api/data-sources`

Returns an array of configured source records.

### Update

`PATCH /api/data-sources/:id`

Accepts partial updates for `name`, `type`, `status`, `schedule`, and `config`.

### Delete

`DELETE /api/data-sources/:id`

Removes and returns the deleted source record.

### Test Connection

`POST /api/data-sources/:id/test-connection`

Runs a local mock provider check and updates the source status. CSV sources require `config.path`; fake API sources accept a mock provider name and return a deterministic success response.

## ETL Jobs

Base path: `/api/etl-jobs`

Supported statuses:

- `QUEUED`
- `RUNNING`
- `SUCCEEDED`
- `FAILED`

### Run

`POST /api/etl-jobs/run`

```json
{
  "dataSourceId": "3988f451-9c47-42b3-af22-46a9836ff7c7",
  "pipeline": "orders"
}
```

Creates a persisted job, delegates record-level work to the Python ETL worker, writes stage logs, and returns the completed job with logs. The `orders` pipeline loads extracted rows into `raw.orders` and validated rows into `staging.orders`.

### List

`GET /api/etl-jobs`

Returns recent ETL jobs with source names and row counts.

### Detail

`GET /api/etl-jobs/:id`

Returns one ETL job with ordered logs.

### Retry

`POST /api/etl-jobs/:id/retry`

Creates a new run using the original job's source and pipeline.

## Analytics

Base path: `/api/analytics`

### Refresh

`POST /api/analytics/refresh`

Reloads the analytics star schema from `staging.orders`.

### Overview

`GET /api/analytics/overview`

Returns:

```json
{
  "totalRevenue": 1689,
  "totalOrders": 5,
  "totalCustomers": 4,
  "averageOrderValue": 337.8
}
```

### Revenue Series

- `GET /api/analytics/revenue/daily`
- `GET /api/analytics/revenue/products`
- `GET /api/analytics/revenue/regions`
- `GET /api/analytics/revenue/campaigns`

Each endpoint returns chart-ready rows:

```json
[
  {
    "label": "Insight Board",
    "value": 894,
    "orders": 2
  }
]
```

## AI Analyst

Base URL: `NEXT_PUBLIC_AI_URL`, defaulting to `http://localhost:8002`.

### Suggested Questions

`GET /ai/suggested-questions`

Returns supported prompt starters for the frontend.

### Ask Question

`POST /ai/question`

```json
{
  "question": "Which products generated the most revenue?"
}
```

Answered response:

```json
{
  "question": "Which products generated the most revenue?",
  "status": "answered",
  "intent": "top_products",
  "summary": "Top product is Insight Board with $894.00 revenue across 2 orders.",
  "sqlPreview": "SELECT ... FROM analytics.fact_sales ...",
  "data": [
    {
      "product_name": "Insight Board",
      "revenue": 894,
      "orders": 2
    }
  ]
}
```

Unsafe requests return `status: "blocked"` and do not execute SQL.

### Audit Log

`GET /ai/audit-log`

Returns recent answered, blocked, and unsupported analyst questions from `app.ai_question_logs`.
