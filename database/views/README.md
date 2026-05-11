# Views

This directory stores reusable SQL view definitions.

## Current Views

- `powerbi-reporting-views.sql`: stable `analytics.pbi_*` views for Power BI reporting.

These views are also included in `database/init/001-create-schemas.sql` and the API startup schema sync so fresh local environments expose the same reporting contracts.
