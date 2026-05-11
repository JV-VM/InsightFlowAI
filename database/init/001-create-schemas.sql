CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS raw;
CREATE SCHEMA IF NOT EXISTS staging;
CREATE SCHEMA IF NOT EXISTS analytics;

CREATE TABLE IF NOT EXISTS app.users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'ANALYST',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.data_sources (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ECOMMERCE', 'CRM', 'MARKETING', 'SUPPORT', 'CSV')),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONNECTED', 'FAILED', 'DISABLED')),
  schedule TEXT NOT NULL DEFAULT 'manual',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_connection_test_at TIMESTAMPTZ,
  last_connection_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.etl_jobs (
  id UUID PRIMARY KEY,
  data_source_id UUID REFERENCES app.data_sources(id) ON DELETE SET NULL,
  pipeline TEXT NOT NULL DEFAULT 'orders',
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED')),
  processed_rows INTEGER NOT NULL DEFAULT 0,
  rejected_rows INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.etl_job_logs (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES app.etl_jobs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'INFO' CHECK (level IN ('INFO', 'WARN', 'ERROR')),
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS raw.orders (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL,
  source_id UUID NOT NULL,
  row_number INTEGER NOT NULL,
  payload JSONB NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.orders (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL,
  source_id UUID NOT NULL,
  order_id TEXT NOT NULL,
  order_date DATE NOT NULL,
  customer_email TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  region TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL,
  campaign TEXT,
  revenue NUMERIC(14, 2) NOT NULL,
  loaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics.dim_product (
  product_key BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_sku TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS analytics.dim_customer (
  customer_key BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_email TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS analytics.dim_region (
  region_key BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  region_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS analytics.dim_campaign (
  campaign_key BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  campaign_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS analytics.fact_sales (
  sales_key BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id TEXT NOT NULL,
  order_date DATE NOT NULL,
  product_key BIGINT NOT NULL REFERENCES analytics.dim_product(product_key),
  customer_key BIGINT NOT NULL REFERENCES analytics.dim_customer(customer_key),
  region_key BIGINT NOT NULL REFERENCES analytics.dim_region(region_key),
  campaign_key BIGINT NOT NULL REFERENCES analytics.dim_campaign(campaign_key),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  revenue NUMERIC(14, 2) NOT NULL,
  source_id UUID NOT NULL,
  job_id UUID NOT NULL,
  loaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE VIEW analytics.v_dashboard_overview AS
SELECT
  COALESCE(SUM(revenue), 0)::numeric(14, 2) AS total_revenue,
  COUNT(*) AS total_orders,
  COUNT(DISTINCT customer_key) AS total_customers,
  COALESCE(AVG(revenue), 0)::numeric(14, 2) AS average_order_value
FROM analytics.fact_sales;

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

CREATE TABLE IF NOT EXISTS app.ai_question_logs (
  id UUID PRIMARY KEY,
  question TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('answered', 'blocked', 'unsupported', 'error')),
  intent TEXT,
  sql_preview TEXT,
  summary TEXT NOT NULL,
  result_rows JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
