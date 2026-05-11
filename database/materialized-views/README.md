# Materialized Views

No materialized views are required for the current MVP dataset.

The Phase 6 Power BI layer uses regular `analytics.pbi_*` views because the local row volume is small and the views stay immediately consistent after `POST /api/analytics/refresh`.

Future candidates:

- `analytics.mv_daily_revenue`
- `analytics.mv_product_revenue`
- `analytics.mv_region_revenue`
- `analytics.mv_campaign_revenue`
