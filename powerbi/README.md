# Power BI

This directory documents the reproducible Power BI reporting layer for InsightFlow AI.

## Local Connection

Start PostgreSQL and make sure analytics have been refreshed after an ETL run.

```bash
docker compose up -d postgres etl-worker ai-analyst
```

Power BI Desktop connection settings:

| Setting | Value |
| --- | --- |
| Connector | PostgreSQL database |
| Server | `localhost:5432` |
| Database | `insightflow` |
| Username | `insightflow` |
| Password | `insightflow` |
| Data connectivity mode | Import for portfolio screenshots, DirectQuery for interactive local demos |

If Power BI prompts for a PostgreSQL provider, install Npgsql using the Power BI Desktop instructions.

## Reporting Views

Use these views from the `analytics` schema:

- `analytics.pbi_sales_overview`
- `analytics.pbi_sales_detail`
- `analytics.pbi_daily_revenue`
- `analytics.pbi_revenue_by_product`
- `analytics.pbi_revenue_by_region`
- `analytics.pbi_revenue_by_campaign`

The SQL source for these views lives in `database/views/powerbi-reporting-views.sql` and is also applied by the database bootstrap.

## Report Pages

### Executive Overview

Recommended visuals:

- Card: total revenue from `pbi_sales_overview.total_revenue`
- Card: total orders from `pbi_sales_overview.total_orders`
- Card: total customers from `pbi_sales_overview.total_customers`
- Card: average order value from `pbi_sales_overview.average_order_value`
- Line chart: `pbi_daily_revenue.order_date` by `pbi_daily_revenue.revenue`
- Bar chart: `pbi_revenue_by_product.product_name` by `pbi_revenue_by_product.revenue`

### Sales Performance

Recommended visuals:

- Table: `pbi_sales_detail`
- Bar chart: `pbi_revenue_by_product.product_name` by `revenue`
- Column chart: `pbi_revenue_by_product.product_name` by `units_sold`

### Customers And Regions

Recommended visuals:

- Bar chart: `pbi_revenue_by_region.region_name` by `revenue`
- Card/table: `pbi_revenue_by_region.customers`
- Matrix: region by orders and revenue

### Marketing

Recommended visuals:

- Bar chart: `pbi_revenue_by_campaign.campaign_name` by `revenue`
- Table: campaign, orders, customers, revenue

### Pipeline Health

Use the API or direct PostgreSQL connection to `app.etl_jobs` and `app.etl_job_logs` for operational reporting. Keep this page separate from business KPIs so report consumers can distinguish business outcomes from platform health.

## Rebuild Procedure

1. Run a CSV source through the app's Pipelines page.
2. Open the Dashboard or Analytics page to refresh the analytics star schema.
3. Open Power BI Desktop.
4. Connect to PostgreSQL using the settings above.
5. Select the reporting views from the `analytics` schema.
6. Build the report pages listed above.
7. Save the `.pbix` under `powerbi/reports/` if binary report assets are being tracked.
8. Export screenshots to `powerbi/screenshots/` for documentation.

## Current Asset Status

No `.pbix` binary is committed yet. The report is reproducible from PostgreSQL views and the page specifications in this file.
