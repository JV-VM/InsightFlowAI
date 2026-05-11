import os
import re
from threading import Lock
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any
from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

app = FastAPI(title="InsightFlow AI Analyst", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("WEB_ORIGIN", "http://localhost:3000,http://127.0.0.1:3000").split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

schema_lock = Lock()
schema_ready = False


class QuestionRequest(BaseModel):
    question: str


class QueryDefinition(BaseModel):
    intent: str
    description: str
    sql: str
    summary_template: str


BLOCKED_SQL_TERMS = {
    "alter",
    "create",
    "delete",
    "drop",
    "grant",
    "insert",
    "merge",
    "revoke",
    "truncate",
    "update",
}

QUERY_REGISTRY: dict[str, QueryDefinition] = {
    "overview": QueryDefinition(
        intent="overview",
        description="Summarize total revenue, orders, customers, and average order value.",
        sql="""
            SELECT
              COALESCE(SUM(revenue), 0)::numeric(14, 2) AS total_revenue,
              COUNT(*)::int AS total_orders,
              COUNT(DISTINCT customer_key)::int AS total_customers,
              COALESCE(AVG(revenue), 0)::numeric(14, 2) AS average_order_value
            FROM analytics.fact_sales
        """,
        summary_template=(
            "Sales total ${total_revenue} across {total_orders} orders from "
            "{total_customers} customers. Average order value is ${average_order_value}."
        ),
    ),
    "top_products": QueryDefinition(
        intent="top_products",
        description="Rank products by revenue.",
        sql="""
            SELECT p.product_name, SUM(f.revenue)::numeric(14, 2) AS revenue, COUNT(*)::int AS orders
            FROM analytics.fact_sales f
            JOIN analytics.dim_product p ON p.product_key = f.product_key
            GROUP BY p.product_name
            ORDER BY revenue DESC
            LIMIT 5
        """,
        summary_template="Top product is {product_name} with ${revenue} revenue across {orders} orders.",
    ),
    "top_regions": QueryDefinition(
        intent="top_regions",
        description="Rank regions by revenue.",
        sql="""
            SELECT r.region_name, SUM(f.revenue)::numeric(14, 2) AS revenue, COUNT(*)::int AS orders
            FROM analytics.fact_sales f
            JOIN analytics.dim_region r ON r.region_key = f.region_key
            GROUP BY r.region_name
            ORDER BY revenue DESC
            LIMIT 5
        """,
        summary_template="Top region is {region_name} with ${revenue} revenue across {orders} orders.",
    ),
    "campaigns": QueryDefinition(
        intent="campaigns",
        description="Rank campaigns by revenue.",
        sql="""
            SELECT c.campaign_name, SUM(f.revenue)::numeric(14, 2) AS revenue, COUNT(*)::int AS orders
            FROM analytics.fact_sales f
            JOIN analytics.dim_campaign c ON c.campaign_key = f.campaign_key
            GROUP BY c.campaign_name
            ORDER BY revenue DESC
            LIMIT 5
        """,
        summary_template="Top campaign is {campaign_name} with ${revenue} revenue across {orders} orders.",
    ),
    "daily_revenue": QueryDefinition(
        intent="daily_revenue",
        description="Show revenue by order date.",
        sql="""
            SELECT order_date, SUM(revenue)::numeric(14, 2) AS revenue, COUNT(*)::int AS orders
            FROM analytics.fact_sales
            GROUP BY order_date
            ORDER BY order_date
            LIMIT 30
        """,
        summary_template="Daily revenue is available for {orders} order rows in the returned result set.",
    ),
}


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "ai-analyst",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/ai/suggested-questions")
def suggested_questions() -> dict[str, list[str]]:
    return {
        "items": [
            "Summarize sales performance.",
            "Which products generated the most revenue?",
            "Which region performed best?",
            "Which campaign drove the most revenue?",
            "Show daily revenue.",
        ]
    }


@app.post("/ai/question")
def ask_question(payload: QuestionRequest) -> dict[str, object]:
    question = payload.question.strip()
    blocked_reason = get_block_reason(question)

    with psycopg.connect(get_database_url(), row_factory=dict_row) as connection:
        ensure_tables_once(connection)

        if blocked_reason:
            response = {
                "question": question,
                "status": "blocked",
                "intent": None,
                "summary": blocked_reason,
                "sqlPreview": None,
                "data": [],
            }
            write_audit_log(connection, question, "blocked", None, None, blocked_reason, [])
            connection.commit()
            return response

        query = classify_question(question)

        if not query:
            summary = "I can answer sales overview, product, region, campaign, and daily revenue questions."
            response = {
                "question": question,
                "status": "unsupported",
                "intent": None,
                "summary": summary,
                "sqlPreview": None,
                "data": [],
            }
            write_audit_log(connection, question, "unsupported", None, None, summary, [])
            connection.commit()
            return response

        assert_safe_sql(query.sql)
        rows = [serialize_row(row) for row in connection.execute(query.sql).fetchall()]
        summary = summarize(query, rows)
        response = {
            "question": question,
            "status": "answered",
            "intent": query.intent,
            "summary": summary,
            "sqlPreview": normalize_sql(query.sql),
            "data": rows,
        }
        write_audit_log(
            connection,
            question,
            "answered",
            query.intent,
            normalize_sql(query.sql),
            summary,
            rows,
        )
        connection.commit()
        return response


def get_database_url() -> str:
    return os.getenv(
        "DATABASE_URL",
        "postgresql://insightflow:insightflow@127.0.0.1:5432/insightflow",
    )


def ensure_tables(connection: psycopg.Connection) -> None:
    connection.execute(
        """
        CREATE SCHEMA IF NOT EXISTS app;

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
        """
    )


def ensure_tables_once(connection: psycopg.Connection) -> None:
    global schema_ready

    if schema_ready:
        return

    with schema_lock:
        if schema_ready:
            return

        ensure_tables(connection)
        connection.commit()
        schema_ready = True


def get_block_reason(question: str) -> str | None:
    lowered = question.lower()
    terms = set(re.findall(r"[a-z_]+", lowered))

    if terms & BLOCKED_SQL_TERMS:
        return "Blocked because the AI analyst only supports read-only analytics questions."

    if ";" in question or "--" in question or "/*" in question:
        return "Blocked because the question looks like an unsafe SQL attempt."

    return None


def classify_question(question: str) -> QueryDefinition | None:
    lowered = question.lower()

    if any(term in lowered for term in ["product", "sku", "item"]):
        return QUERY_REGISTRY["top_products"]

    if any(term in lowered for term in ["region", "north", "south", "east", "west"]):
        return QUERY_REGISTRY["top_regions"]

    if any(term in lowered for term in ["campaign", "marketing", "attribution"]):
        return QUERY_REGISTRY["campaigns"]

    if any(term in lowered for term in ["daily", "date", "trend", "over time"]):
        return QUERY_REGISTRY["daily_revenue"]

    if any(term in lowered for term in ["sales", "revenue", "orders", "overview", "summarize", "summary"]):
        return QUERY_REGISTRY["overview"]

    return None


def assert_safe_sql(sql: str) -> None:
    normalized = normalize_sql(sql).lower()

    if not normalized.startswith("select "):
        raise ValueError("Only SELECT statements are allowed")

    if " analytics." not in f" {normalized}":
        raise ValueError("Queries must target the analytics schema")

    if any(re.search(rf"\b{term}\b", normalized) for term in BLOCKED_SQL_TERMS):
        raise ValueError("Blocked unsafe SQL statement")


def summarize(query: QueryDefinition, rows: list[dict[str, Any]]) -> str:
    if not rows:
        return "No analytics rows are available yet. Run an ETL job and refresh analytics first."

    first = rows[0]
    summary = query.summary_template

    for key, value in first.items():
        summary = summary.replace("{" + key + "}", format_value(value))

    return summary


def write_audit_log(
    connection: psycopg.Connection,
    question: str,
    status: str,
    intent: str | None,
    sql_preview: str | None,
    summary: str,
    rows: list[dict[str, Any]],
) -> None:
    connection.execute(
        """
        INSERT INTO app.ai_question_logs (
          id, question, status, intent, sql_preview, summary, result_rows
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        [str(uuid4()), question, status, intent, sql_preview, summary, Jsonb(rows)],
    )


def normalize_sql(sql: str) -> str:
    return " ".join(sql.split())


def serialize_row(row: dict[str, Any]) -> dict[str, Any]:
    serialized: dict[str, Any] = {}

    for key, value in row.items():
        if isinstance(value, Decimal):
            serialized[key] = float(value)
        elif isinstance(value, (date, datetime)):
            serialized[key] = value.isoformat()
        else:
            serialized[key] = value

    return serialized


def format_value(value: Any) -> str:
    if isinstance(value, float):
        return f"{value:,.2f}"

    if isinstance(value, int):
        return f"{value:,}"

    return str(value)


@app.get("/ai/audit-log")
def audit_log() -> dict[str, list[dict[str, Any]]]:
    with psycopg.connect(get_database_url(), row_factory=dict_row) as connection:
        ensure_tables_once(connection)
        rows = connection.execute(
            """
            SELECT id, question, status, intent, summary, created_at
            FROM app.ai_question_logs
            ORDER BY created_at DESC
            LIMIT 25
            """
        ).fetchall()

    return {
        "items": [serialize_row(dict(row)) for row in rows]
    }
