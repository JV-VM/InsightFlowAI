# Database

This directory contains PostgreSQL bootstrap scripts, future migrations, seeds, and SQL assets.

## Schema Responsibilities

- `app`: application tables such as users, data sources, jobs, and logs
- `raw`: untouched imported records
- `staging`: validated and partially normalized records
- `analytics`: star schema tables, KPI views, and BI-ready data

## Current State

Phase 0 includes a bootstrap SQL file that creates the four base schemas when PostgreSQL starts for the first time.
