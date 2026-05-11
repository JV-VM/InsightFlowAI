# InsightFlow AI — Project Scope Documentation

## 1. Project Overview

**InsightFlow AI** is a full-stack Business Intelligence Automation Platform designed to demonstrate skills in data engineering, ETL pipelines, data modeling, data analysis, SQL, AI development, API integration, automated workflows, Python, LLM prompt engineering, Microsoft Power BI, and full-stack development with TypeScript.

The platform allows users to connect business data sources, process raw data through ETL pipelines, store the transformed data in a PostgreSQL analytical model, visualize metrics through a web dashboard, integrate reports with Power BI, and ask business questions through an AI analyst assistant.

The project is designed as a professional portfolio-grade system that shows the ability to build complete software products, not only isolated features.

---

## 2. Project Objective

The main objective of InsightFlow AI is to create a realistic business intelligence platform where raw business data can be transformed into actionable insights.

The project should demonstrate the following abilities:

- Building full-stack web applications with **Next.js**, **NestJS**, and **TypeScript**.
- Creating ETL pipelines with **Python**.
- Designing analytical data models using **PostgreSQL**.
- Working with staging tables, fact tables, and dimension tables.
- Performing data analysis using SQL and Python.
- Building automated workflows for scheduled data processing.
- Integrating APIs as data sources.
- Creating AI-powered business analysis using LLMs.
- Building dashboards for business metrics.
- Connecting analytical data to **Microsoft Power BI**.
- Documenting architecture and technical decisions clearly.

---

## 3. Core Concept

The system receives business data from multiple sources, processes it, stores it in a structured analytical database, and exposes insights through dashboards and AI-powered analysis.

### General Data Flow

```txt
Raw Data Sources
      ↓
Data Extraction
      ↓
Validation
      ↓
Transformation
      ↓
Loading into PostgreSQL
      ↓
Analytical Data Model
      ↓
Dashboard + Power BI Reports
      ↓
AI Analyst Assistant
```

---

## 4. Main Use Case

A business user wants to understand company performance without manually cleaning spreadsheets or writing complex SQL queries.

The user can:

1. Register a data source.
2. Run an ETL pipeline.
3. Monitor pipeline execution logs.
4. View business KPIs in the dashboard.
5. Ask the AI analyst questions about the data.
6. Open a Power BI report connected to the analytical database.

Example questions the AI assistant should answer:

```txt
Which products generated the highest revenue this month?
Why did revenue decrease last week?
Which marketing campaign had the best ROI?
Which customers are at risk of churn?
Summarize this month's business performance.
Generate an executive summary for management.
```

---

## 5. Target Skill Demonstration

This project is intended to demonstrate the following skill areas:

| Skill Area | How It Is Demonstrated |
|---|---|
| Data Engineering | Ingestion, validation, transformation, and loading of business data. |
| ETL | Python pipelines that extract, transform, and load data into PostgreSQL. |
| ETL Pipeline | Structured pipeline stages with logs, status, and error handling. |
| Data Modeling | Star schema with fact and dimension tables. |
| Data Analysis | SQL queries, KPIs, business metrics, and trend analysis. |
| SQL | Analytical queries, views, materialized views, and transformations. |
| AI Development | AI analyst assistant for business questions and summaries. |
| Data Processing | Cleaning, normalization, deduplication, and aggregation. |
| Automated Workflow | Scheduled ETL jobs and pipeline monitoring. |
| Python | ETL scripts, data validation, transformation, and AI service. |
| API Integration | Fake CRM, e-commerce, marketing, and support APIs. |
| LLM Prompt Engineering | Prompt templates, SQL generation support, and summary generation. |
| Microsoft Power BI | External BI reporting connected to PostgreSQL. |
| Full-Stack Development | Complete web platform with frontend, backend, database, and services. |
| TypeScript | Next.js frontend and NestJS backend. |
| React | Dashboard UI, charts, tables, and AI assistant interface. |

---

## 6. Technology Stack

### 6.1 Frontend

The frontend should be built with:

```txt
Next.js
React
TypeScript
Sass Modules
TanStack Query
Recharts or Chart.js
```

The frontend is responsible for:

- User interface.
- Dashboard pages.
- Data source management screens.
- ETL job monitoring screens.
- AI analyst chat interface.
- Report previews.
- API communication with the backend.

Styling should be organized using **Sass module files**.

Example:

```txt
DashboardPage.module.scss
DataSourcesPage.module.scss
PipelineLogs.module.scss
AiAssistant.module.scss
```

---

### 6.2 Backend

The backend should be built with:

```txt
NestJS
TypeScript
PostgreSQL
Prisma or Drizzle
JWT Authentication
REST API
Swagger Documentation
```

The backend is responsible for:

- Authentication and user management.
- Data source configuration.
- ETL job orchestration.
- Reading pipeline logs.
- Serving analytical data to the frontend.
- Exposing dashboard metrics.
- Communicating with the AI service.
- Providing secured API endpoints.

---

### 6.3 Data Pipeline

The ETL layer should be built with:

```txt
Python
Pandas
Pydantic
SQLAlchemy
APScheduler or Prefect
```

The data pipeline is responsible for:

- Extracting data from APIs and files.
- Validating incoming records.
- Cleaning malformed data.
- Removing duplicates.
- Normalizing dates and currencies.
- Loading raw records into staging tables.
- Transforming staging data into analytics tables.
- Logging pipeline execution.

---

### 6.4 AI Service

The AI service should be built with:

```txt
Python
FastAPI
OpenAI API or local LLM integration
Prompt templates
SQL safety rules
```

The AI service is responsible for:

- Receiving user questions.
- Classifying analytical intent.
- Choosing safe predefined SQL queries or generating guarded SQL.
- Summarizing query results.
- Producing executive reports.
- Explaining business trends in natural language.

---

### 6.5 Database

The database should use:

```txt
PostgreSQL
```

The database should be separated into schemas:

```txt
raw
staging
analytics
app
```

Recommended schema responsibilities:

| Schema | Responsibility |
|---|---|
| raw | Stores raw imported data before cleaning. |
| staging | Stores validated and partially cleaned data. |
| analytics | Stores star schema tables, facts, dimensions, KPIs, and views. |
| app | Stores application-level data such as users, data sources, jobs, and logs. |

---

### 6.6 BI Reporting

Power BI should be used for external business intelligence reporting.

Power BI should connect to PostgreSQL and consume tables or views from the `analytics` schema.

Power BI report pages may include:

```txt
Executive Overview
Sales Performance
Customer Segmentation
Marketing Campaign ROI
Pipeline Health
```

---

### 6.7 DevOps and Tooling

The project should include:

```txt
Docker Compose
Environment variable configuration
Database seed scripts
Migration scripts
README documentation
Architecture diagrams
Optional CI pipeline
```

Docker Compose should run:

```txt
Next.js frontend
NestJS backend
PostgreSQL database
Python ETL service
Python AI service
```

---

## 7. System Architecture

### 7.1 High-Level Architecture

```txt
                   ┌─────────────────────┐
                   │   Next.js Frontend   │
                   │ React + TypeScript   │
                   │ Sass Modules         │
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │   NestJS Backend     │
                   │ REST API + Auth      │
                   └──────┬───────┬──────┘
                          │       │
              ┌───────────▼───┐   │
              │ PostgreSQL    │   │
              │ App + BI Data │   │
              └───────┬───────┘   │
                      │           │
                      ▼           ▼
          ┌─────────────────┐ ┌─────────────────┐
          │ Python ETL       │ │ Python AI Service│
          │ Pipelines        │ │ FastAPI + LLM    │
          └────────┬────────┘ └────────┬────────┘
                   │                   │
                   ▼                   ▼
          ┌─────────────────┐ ┌─────────────────┐
          │ External APIs    │ │ AI Responses     │
          │ CSV Data Sources │ │ SQL Summaries    │
          └─────────────────┘ └─────────────────┘

                   ┌─────────────────────┐
                   │ Microsoft Power BI   │
                   │ PostgreSQL Reports   │
                   └─────────────────────┘
```

---

## 8. Proposed Repository Structure

```txt
insightflow-ai/
│
├── apps/
│   ├── web/                         # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   ├── services/
│   │   │   ├── styles/
│   │   │   └── types/
│   │   └── package.json
│   │
│   └── api/                         # NestJS backend
│       ├── src/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── data-sources/
│       │   ├── etl-jobs/
│       │   ├── analytics/
│       │   ├── ai/
│       │   ├── reports/
│       │   └── common/
│       └── package.json
│
├── services/
│   ├── etl-worker/                  # Python ETL service
│   │   ├── pipelines/
│   │   ├── extractors/
│   │   ├── transformers/
│   │   ├── loaders/
│   │   ├── validators/
│   │   └── main.py
│   │
│   └── ai-analyst/                  # Python FastAPI AI service
│       ├── prompts/
│       ├── tools/
│       ├── guards/
│       ├── routers/
│       └── main.py
│
├── database/
│   ├── migrations/
│   ├── seeds/
│   ├── schemas/
│   ├── views/
│   └── materialized-views/
│
├── powerbi/
│   ├── reports/
│   ├── screenshots/
│   └── README.md
│
├── docs/
│   ├── architecture.md
│   ├── data-model.md
│   ├── etl-pipeline.md
│   ├── ai-assistant.md
│   ├── api-contract.md
│   └── deployment.md
│
├── docker-compose.yml
├── .env.example
├── README.md
└── package.json
```

---

## 9. Main Modules

## 9.1 Authentication Module

The authentication module handles user access to the platform.

### Features

- Register user.
- Login user.
- JWT authentication.
- Protected dashboard routes.
- Role-ready structure for future expansion.

### Example Roles

```txt
Admin
Analyst
Viewer
```

---

## 9.2 Data Source Module

The data source module allows the user to register sources of business data.

### Supported Sources for MVP

```txt
CSV Upload
Fake E-commerce API
Fake CRM API
Fake Marketing API
Fake Support API
```

### Data Source Fields

```txt
id
name
type
url
status
schedule
createdAt
updatedAt
```

### Example Data Source

```json
{
  "name": "E-commerce Orders API",
  "type": "REST_API",
  "url": "http://localhost:4000/mock/orders",
  "status": "ACTIVE",
  "schedule": "DAILY"
}
```

---

## 9.3 ETL Job Module

The ETL job module tracks pipeline executions.

### Features

- Start ETL job manually.
- View job history.
- View job status.
- View logs.
- Retry failed jobs.
- Store row counts.
- Store execution duration.

### Job Statuses

```txt
PENDING
RUNNING
SUCCESS
FAILED
CANCELLED
```

### Example Job Log

```txt
[10:20:01] Started orders pipeline
[10:20:03] Extracted 15,420 records
[10:20:04] Removed 32 duplicate records
[10:20:06] Normalized date fields
[10:20:08] Loaded data into staging.orders
[10:20:10] Updated analytics.fact_sales
[10:20:11] Job completed successfully
```

---

## 9.4 Analytics Module

The analytics module exposes business metrics to the frontend.

### Example Metrics

```txt
Total Revenue
Total Profit
Monthly Revenue Growth
Average Order Value
Top Products
Sales by Region
Customer Churn Risk
Marketing Campaign ROI
Support Ticket Volume
Conversion Rate
```

### Example API Endpoints

```txt
GET /analytics/overview
GET /analytics/revenue/monthly
GET /analytics/products/top
GET /analytics/customers/segments
GET /analytics/campaigns/roi
GET /analytics/support/summary
```

---

## 9.5 AI Analyst Module

The AI analyst module allows users to ask business questions in natural language.

### Example User Questions

```txt
Summarize this month’s sales.
Which product category performed best?
Why did revenue drop last week?
What customers are most likely to churn?
Generate an executive report for this quarter.
```

### AI Processing Flow

```txt
User Question
      ↓
Intent Classification
      ↓
Safe SQL Selection or SQL Generation
      ↓
Query Execution
      ↓
Result Formatting
      ↓
LLM Summary
      ↓
Dashboard Response
```

### Important Safety Rule

The AI should not execute arbitrary dangerous SQL.

Only allow:

```txt
SELECT queries
Predefined analytical queries
Read-only database access
Limited result size
SQL validation before execution
```

Forbidden:

```txt
DROP
DELETE
UPDATE
INSERT
ALTER
TRUNCATE
CREATE
```

---

## 9.6 Power BI Module

The Power BI module is not necessarily an application module, but a reporting layer connected to the PostgreSQL analytics schema.

### Power BI Deliverables

```txt
.pbix report file
Report screenshots
Documentation for connecting Power BI to PostgreSQL
Explanation of each report page
```

---

## 10. Data Model

## 10.1 Analytical Model

The analytical database should use a star schema.

### Fact Tables

```txt
fact_sales
fact_marketing_campaign
fact_support_ticket
fact_web_event
```

### Dimension Tables

```txt
dim_customer
dim_product
dim_date
dim_region
dim_campaign
dim_channel
```

---

## 10.2 Example Star Schema

```txt
                 dim_customer
                      │
                      │
 dim_product ─── fact_sales ─── dim_date
                      │
                      │
                 dim_region
                      │
                      │
                 dim_campaign
```

---

## 10.3 Example Tables

### fact_sales

```txt
id
order_id
customer_id
product_id
date_id
region_id
campaign_id
quantity
unit_price
gross_revenue
discount
net_revenue
cost
profit
created_at
```

### dim_customer

```txt
id
external_customer_id
name
email
segment
region
created_at
```

### dim_product

```txt
id
external_product_id
name
category
brand
unit_cost
created_at
```

### dim_date

```txt
id
date
year
quarter
month
month_name
week
day
weekday
```

---

## 11. ETL Pipeline Scope

## 11.1 Pipeline Stages

Each ETL pipeline should follow this structure:

```txt
Extract
Validate
Transform
Load Raw
Load Staging
Load Analytics
Generate Metrics
Log Results
```

---

## 11.2 Example Orders Pipeline

```txt
Extract orders from fake e-commerce API
      ↓
Validate required fields
      ↓
Remove duplicated order IDs
      ↓
Normalize currency values
      ↓
Normalize date format
      ↓
Load into raw.orders
      ↓
Transform into staging.orders
      ↓
Load into analytics.fact_sales
      ↓
Refresh materialized views
      ↓
Store job logs
```

---

## 11.3 Validation Rules

Example validation rules:

```txt
Order ID must not be null
Customer ID must not be null
Quantity must be greater than zero
Unit price must be greater than or equal to zero
Order date must be valid
Currency must be supported
Email must be valid when available
```

---

## 11.4 Data Cleaning Rules

Example cleaning rules:

```txt
Trim empty spaces
Standardize email casing
Convert dates to ISO format
Convert currencies when needed
Remove duplicated records
Replace invalid numeric values
Map external product IDs to internal dimension IDs
```

---

## 12. Frontend Scope

The frontend should be a polished dashboard application built with Next.js, React, TypeScript, and Sass modules.

## 12.1 Pages

```txt
/login
/dashboard
/data-sources
/pipelines
/pipelines/[id]
/analytics/sales
/analytics/customers
/analytics/marketing
/ai-analyst
/reports
/settings
```

---

## 12.2 Main Screens

### Dashboard Page

Shows high-level business metrics.

Components:

```txt
RevenueCard
ProfitCard
GrowthCard
TopProductsChart
RevenueTrendChart
SalesByRegionChart
RecentPipelineRunsTable
AiSummaryCard
```

---

### Data Sources Page

Allows users to register and manage data sources.

Components:

```txt
DataSourceTable
CreateDataSourceModal
DataSourceStatusBadge
ConnectionTestButton
```

---

### Pipelines Page

Shows all ETL jobs and their current status.

Components:

```txt
PipelineRunsTable
PipelineStatusBadge
RunPipelineButton
RetryPipelineButton
```

---

### Pipeline Details Page

Shows logs for a specific pipeline execution.

Components:

```txt
PipelineSummaryCard
PipelineTimeline
PipelineLogsViewer
FailedRowsTable
```

---

### AI Analyst Page

Allows the user to ask natural-language business questions.

Components:

```txt
ChatInput
ChatMessageList
GeneratedSQLPreview
InsightCard
ResultTable
SuggestedQuestions
```

---

### Reports Page

Shows Power BI report instructions, screenshots, and exported summaries.

Components:

```txt
PowerBIReportPreview
ReportDownloadCard
ReportDocumentationCard
```

---

## 12.3 Styling Approach

The project should use Sass module files instead of Tailwind CSS.

Example component structure:

```txt
components/
  MetricCard/
    MetricCard.tsx
    MetricCard.module.scss
  PipelineStatusBadge/
    PipelineStatusBadge.tsx
    PipelineStatusBadge.module.scss
  AiChat/
    AiChat.tsx
    AiChat.module.scss
```

Example Sass module:

```scss
.card {
  padding: 1rem;
  border-radius: 0.75rem;
  background: #ffffff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #4b5563;
}

.value {
  margin-top: 0.5rem;
  font-size: 2rem;
  font-weight: 700;
}
```

---

## 13. Backend Scope

The backend should expose REST APIs for the frontend and coordinate work between the database, ETL service, and AI service.

## 13.1 Suggested NestJS Modules

```txt
auth
users
data-sources
etl-jobs
analytics
ai
reports
health
common
```

---

## 13.2 Example API Endpoints

### Authentication

```txt
POST /auth/register
POST /auth/login
GET /auth/me
```

### Data Sources

```txt
GET /data-sources
POST /data-sources
GET /data-sources/:id
PATCH /data-sources/:id
DELETE /data-sources/:id
POST /data-sources/:id/test-connection
```

### ETL Jobs

```txt
GET /etl-jobs
POST /etl-jobs/run
GET /etl-jobs/:id
GET /etl-jobs/:id/logs
POST /etl-jobs/:id/retry
```

### Analytics

```txt
GET /analytics/overview
GET /analytics/revenue/monthly
GET /analytics/products/top
GET /analytics/regions/sales
GET /analytics/customers/segments
GET /analytics/campaigns/roi
```

### AI Analyst

```txt
POST /ai/question
POST /ai/report-summary
GET /ai/suggested-questions
```

### Reports

```txt
GET /reports
GET /reports/powerbi/config
```

---

## 14. AI Analyst Scope

The AI analyst assistant should focus on business intelligence use cases.

## 14.1 Main Capabilities

```txt
Answer business questions
Summarize KPI changes
Explain performance trends
Generate executive summaries
Suggest follow-up questions
Generate safe SQL previews
```

---

## 14.2 Prompt Engineering Structure

Recommended prompt files:

```txt
prompts/
  system_analyst.md
  classify_question.md
  generate_sql.md
  summarize_results.md
  executive_report.md
```

---

## 14.3 Example AI Prompt Goal

The AI should behave like a business intelligence analyst.

It should:

```txt
Use concise business language
Explain numbers clearly
Mention assumptions
Avoid unsupported claims
Use only available data
Recommend practical next steps
```

---

## 15. Power BI Scope

Power BI should be used to show that the project can connect to professional BI tooling.

## 15.1 Report Pages

### Executive Overview

Metrics:

```txt
Total Revenue
Total Profit
Revenue Growth
Profit Margin
Top Region
Top Product Category
```

### Sales Performance

Metrics:

```txt
Revenue by Month
Revenue by Product
Revenue by Region
Average Order Value
Sales Quantity
```

### Customer Segmentation

Metrics:

```txt
Customers by Segment
Revenue by Segment
Repeat Customers
Churn Risk Customers
Customer Lifetime Value
```

### Marketing Campaign ROI

Metrics:

```txt
Campaign Spend
Campaign Revenue
ROI
Conversion Rate
Cost per Acquisition
```

### Pipeline Health

Metrics:

```txt
Successful ETL Runs
Failed ETL Runs
Rows Processed
Average Pipeline Duration
Last Pipeline Execution
```

---

## 16. MVP Scope

The MVP should be focused and achievable.

## 16.1 MVP Features

```txt
User authentication
Register fake data sources
Run ETL manually
Import data from CSV and fake APIs
Store data in PostgreSQL
Transform data into star schema
Display dashboard KPIs
Show ETL job logs
Ask AI questions about business data
Generate AI business summaries
Create Power BI report connected to PostgreSQL
Document the architecture
```

---

## 16.2 MVP Non-Goals

The MVP should not focus on these yet:

```txt
Real payment integration
Multi-tenant billing
Complex role permissions
Real-time streaming data
Advanced ML models
Enterprise-level data governance
Complex drag-and-drop report builder
```

These can be added later as advanced features.

---

## 17. Phase Roadmap

## Phase 0 — Planning and Setup

Deliverables:

```txt
Repository setup
Docker Compose setup
Initial README
Architecture documentation
Database schema draft
API contract draft
UI wireframes
```

---

## Phase 1 — Core Full-Stack Foundation

Deliverables:

```txt
Next.js app setup
NestJS API setup
PostgreSQL setup
Authentication module
Basic dashboard layout
Sass module design system
```

---

## Phase 2 — Data Sources and ETL

Deliverables:

```txt
Data source module
Fake business APIs
CSV import flow
Python ETL worker
Pipeline execution logs
Raw and staging tables
```

---

## Phase 3 — Analytical Model and Dashboard

Deliverables:

```txt
Star schema tables
Analytics SQL views
Dashboard KPI endpoints
Revenue charts
Product charts
Customer charts
Pipeline health charts
```

---

## Phase 4 — AI Analyst

Deliverables:

```txt
FastAPI AI service
Prompt templates
Question classification
Safe SQL execution flow
AI summaries
AI analyst frontend page
Suggested questions
```

---

## Phase 5 — Power BI Integration

Deliverables:

```txt
Power BI connection documentation
Power BI report file
Report screenshots
Analytics views for Power BI
Executive dashboard page
```

---

## Phase 6 — Polish and Portfolio Presentation

Deliverables:

```txt
Final README
Architecture diagrams
Demo video
Screenshots
Deployment guide
Portfolio case study
GitHub repository cleanup
```

---

## 18. Success Criteria

The project is successful if it can demonstrate the following:

```txt
A user can log in.
A user can register or select a data source.
A user can run an ETL job.
The ETL job processes data and stores logs.
The transformed data appears in PostgreSQL analytics tables.
The dashboard displays real metrics from the database.
The AI analyst can answer questions based on the data.
Power BI can connect to the analytical database.
The project is documented well enough for recruiters or clients to understand.
```

---

## 19. Portfolio Positioning

This project can be presented as:

> InsightFlow AI is a full-stack business intelligence automation platform that ingests raw business data from APIs and files, processes it through Python ETL pipelines, models it into a PostgreSQL star schema, exposes analytics through a Next.js and NestJS application, integrates with Power BI, and provides an AI analyst assistant powered by LLM prompt engineering.

This project is suitable for demonstrating skills in:

```txt
Data Engineering
ETL Pipeline Development
Business Intelligence
SQL Analytics
AI Automation
LLM Prompt Engineering
Full-Stack TypeScript Development
API Integration
Power BI Reporting
```

---

## 20. Recommended Final Deliverables

At the end of the project, the repository should include:

```txt
Working Next.js frontend
Working NestJS backend
Working Python ETL service
Working Python AI service
PostgreSQL schema and seed data
Docker Compose environment
Power BI report file or screenshots
Architecture documentation
Data model documentation
API documentation
Demo screenshots
Demo video
Portfolio case study
```

---

## 21. Suggested README Summary

```md
# InsightFlow AI

InsightFlow AI is a full-stack Business Intelligence Automation Platform built with Next.js, NestJS, Python, PostgreSQL, and Power BI.

It demonstrates data engineering, ETL pipelines, data modeling, SQL analytics, AI-powered business analysis, API integration, automated workflows, and full-stack TypeScript development.

The platform ingests raw data from APIs and CSV files, processes it through Python ETL pipelines, stores it in a PostgreSQL analytical star schema, displays KPIs in a Next.js dashboard, integrates with Power BI, and allows users to ask business questions through an AI analyst assistant.
```
