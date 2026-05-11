CREATE OR REPLACE VIEW analytics.pbi_sales_overview AS
SELECT
  COALESCE(SUM(revenue), 0)::numeric(14, 2) AS total_revenue,
  COUNT(*) AS total_orders,
  COUNT(DISTINCT customer_key) AS total_customers,
  COALESCE(AVG(revenue), 0)::numeric(14, 2) AS average_order_value,
  MIN(order_date) AS first_order_date,
  MAX(order_date) AS last_order_date
FROM analytics.fact_sales;

CREATE OR REPLACE VIEW analytics.pbi_sales_detail AS
SELECT
  f.sales_key,
  f.order_id,
  f.order_date,
  p.product_sku,
  p.product_name,
  c.customer_email,
  r.region_name,
  m.campaign_name,
  f.quantity,
  f.unit_price,
  f.revenue,
  f.source_id,
  f.job_id,
  f.loaded_at
FROM analytics.fact_sales f
JOIN analytics.dim_product p ON p.product_key = f.product_key
JOIN analytics.dim_customer c ON c.customer_key = f.customer_key
JOIN analytics.dim_region r ON r.region_key = f.region_key
JOIN analytics.dim_campaign m ON m.campaign_key = f.campaign_key;

CREATE OR REPLACE VIEW analytics.pbi_revenue_by_product AS
SELECT
  p.product_sku,
  p.product_name,
  SUM(f.revenue)::numeric(14, 2) AS revenue,
  COUNT(*) AS orders,
  SUM(f.quantity) AS units_sold
FROM analytics.fact_sales f
JOIN analytics.dim_product p ON p.product_key = f.product_key
GROUP BY p.product_sku, p.product_name;

CREATE OR REPLACE VIEW analytics.pbi_revenue_by_region AS
SELECT
  r.region_name,
  SUM(f.revenue)::numeric(14, 2) AS revenue,
  COUNT(*) AS orders,
  COUNT(DISTINCT f.customer_key) AS customers
FROM analytics.fact_sales f
JOIN analytics.dim_region r ON r.region_key = f.region_key
GROUP BY r.region_name;

CREATE OR REPLACE VIEW analytics.pbi_revenue_by_campaign AS
SELECT
  m.campaign_name,
  SUM(f.revenue)::numeric(14, 2) AS revenue,
  COUNT(*) AS orders,
  COUNT(DISTINCT f.customer_key) AS customers
FROM analytics.fact_sales f
JOIN analytics.dim_campaign m ON m.campaign_key = f.campaign_key
GROUP BY m.campaign_name;

CREATE OR REPLACE VIEW analytics.pbi_daily_revenue AS
SELECT
  order_date,
  SUM(revenue)::numeric(14, 2) AS revenue,
  COUNT(*) AS orders,
  COUNT(DISTINCT customer_key) AS customers
FROM analytics.fact_sales
GROUP BY order_date;
