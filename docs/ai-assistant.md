# AI Assistant

This document will describe the AI analyst service, prompt strategy, SQL safety model, and response workflow.

## Planned Coverage

- Prompt structure
- Allowed query patterns
- SQL guardrails
- Result summarization rules
- Operational risks and limitations

## Current Phase 5 Behavior

The AI analyst service is a FastAPI service exposed on port `8002`.

Endpoints:

- `GET /health`
- `GET /ai/suggested-questions`
- `POST /ai/question`
- `GET /ai/audit-log`

The service currently uses a deterministic query registry instead of live model-generated SQL. This keeps Phase 5 safe and repeatable while the analytics schema is still small.

## Supported Question Intents

- `overview`: total revenue, orders, customers, and average order value
- `top_products`: product revenue ranking
- `top_regions`: regional revenue ranking
- `campaigns`: campaign revenue ranking
- `daily_revenue`: revenue by order date

Unsupported questions return an `unsupported` response with suggested analytical boundaries.

## SQL Guardrails

The service only executes predefined `SELECT` statements against the `analytics` schema.

Requests are blocked if they include:

- DDL or DML terms such as `drop`, `delete`, `insert`, `update`, `truncate`, or `alter`
- SQL statement separators such as `;`
- SQL comment markers such as `--` or `/*`

Blocked requests are returned as structured `blocked` responses and written to the audit log.

## Audit Log

Every answered, blocked, or unsupported question is stored in `app.ai_question_logs`.

Stored fields include:

- question text
- status
- classified intent
- SQL preview for answered questions
- summary
- result rows
- timestamp

## Limitations

- No external LLM call is made yet.
- SQL is selected from a registry, not generated dynamically.
- The service reads from `analytics` tables only and assumes analytics have been refreshed after ETL.
