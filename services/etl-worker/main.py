import csv
import os
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import FastAPI
from pydantic import BaseModel
import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

app = FastAPI(title="InsightFlow ETL Worker", version="0.1.0")


class PipelineRunRequest(BaseModel):
    source_id: str
    job_id: str
    pipeline: str = "orders"


class PipelineLog(BaseModel):
    stage: str
    level: str
    message: str
    metadata: dict[str, Any] = {}


class PipelineRunResponse(BaseModel):
    status: str
    source_id: str
    job_id: str
    pipeline: str
    processed_rows: int
    rejected_rows: int
    logs: list[PipelineLog]


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "etl-worker",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/jobs/run", response_model=PipelineRunResponse)
def run_job(payload: PipelineRunRequest) -> PipelineRunResponse:
    logs: list[PipelineLog] = []

    with psycopg.connect(get_database_url(), row_factory=dict_row) as connection:
        ensure_tables(connection)
        source = get_source(connection, payload.source_id)

        if source["status"] != "CONNECTED":
            raise ValueError("Data source must be connected before running ETL")

        if payload.pipeline != "orders":
            raise ValueError("Only the orders pipeline is available in the MVP")

        records = extract_records(source)
        logs.append(
            PipelineLog(
                stage="extract",
                level="INFO",
                message=f"Extracted {len(records)} source records",
                metadata={"sourceType": source["type"]},
            )
        )

        rejected_rows = load_raw(connection, payload.job_id, payload.source_id, records)
        valid_records, validation_rejections = validate_orders(records)
        rejected_rows += validation_rejections
        logs.append(
            PipelineLog(
                stage="validate",
                level="INFO",
                message="Validated order records",
                metadata={"acceptedRows": len(valid_records), "rejectedRows": rejected_rows},
            )
        )

        staging_count = load_staging(connection, payload.job_id, payload.source_id, valid_records)
        logs.append(
            PipelineLog(
                stage="transform",
                level="INFO",
                message="Normalized order dates, numeric values, and currency fields",
            )
        )
        logs.append(
            PipelineLog(
                stage="load_raw",
                level="INFO",
                message="Loaded extracted records into raw.orders",
                metadata={"rows": len(records)},
            )
        )
        logs.append(
            PipelineLog(
                stage="load_staging",
                level="INFO",
                message="Loaded validated records into staging.orders",
                metadata={"rows": staging_count},
            )
        )
        logs.append(
            PipelineLog(
                stage="load_analytics",
                level="INFO",
                message="Analytics refresh queued for Phase 4",
            )
        )
        connection.commit()

    return PipelineRunResponse(
        status="SUCCEEDED",
        source_id=payload.source_id,
        job_id=payload.job_id,
        pipeline=payload.pipeline,
        processed_rows=staging_count,
        rejected_rows=rejected_rows,
        logs=logs,
    )


def get_database_url() -> str:
    return os.getenv(
        "DATABASE_URL",
        "postgresql://insightflow:insightflow@127.0.0.1:5432/insightflow",
    )


def ensure_tables(connection: psycopg.Connection) -> None:
    connection.execute(
        """
        CREATE SCHEMA IF NOT EXISTS raw;
        CREATE SCHEMA IF NOT EXISTS staging;

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
        """
    )


def get_source(connection: psycopg.Connection, source_id: str) -> dict[str, Any]:
    row = connection.execute(
        """
        SELECT id, name, type, status, config
        FROM app.data_sources
        WHERE id = %s
        """,
        [source_id],
    ).fetchone()

    if not row:
        raise ValueError("Data source not found")

    return dict(row)


def extract_records(source: dict[str, Any]) -> list[dict[str, str]]:
    if source["type"] != "CSV":
        return [
            {
                "order_id": "MOCK-1001",
                "order_date": "2026-01-15",
                "customer_email": "mock@example.com",
                "product_sku": "SKU-MOCK-01",
                "product_name": f"{source['name']} Mock Product",
                "region": "North",
                "quantity": "1",
                "unit_price": "199.00",
                "currency": "USD",
                "campaign": "mock-provider",
            }
        ]

    path = source["config"].get("path")

    if not isinstance(path, str) or not path:
        raise ValueError("CSV source requires config.path")

    csv_path = resolve_source_path(path)
    with csv_path.open(newline="", encoding="utf-8") as csv_file:
        return [dict(row) for row in csv.DictReader(csv_file)]


def resolve_source_path(path: str) -> Path:
    candidates = [
        Path(path),
        Path.cwd() / path,
        Path.cwd().parent / path,
        Path.cwd().parent.parent / path,
    ]

    for candidate in candidates:
        if candidate.exists():
            return candidate

    raise ValueError(f"CSV source file not found: {path}")


def load_raw(
    connection: psycopg.Connection,
    job_id: str,
    source_id: str,
    records: list[dict[str, str]],
) -> int:
    connection.execute("DELETE FROM raw.orders WHERE job_id = %s", [job_id])
    rejected_rows = 0

    for index, record in enumerate(records, start=1):
        try:
            connection.execute(
                """
                INSERT INTO raw.orders (id, job_id, source_id, row_number, payload)
                VALUES (%s, %s, %s, %s, %s::jsonb)
                """,
                [str(uuid4()), job_id, source_id, index, Jsonb(record)],
            )
        except Exception:
            rejected_rows += 1

    return rejected_rows


def validate_orders(records: list[dict[str, str]]) -> tuple[list[dict[str, Any]], int]:
    valid_records: list[dict[str, Any]] = []
    rejected_rows = 0

    for record in records:
        try:
            order_date = date.fromisoformat(record["order_date"])
            quantity = int(record["quantity"])
            unit_price = Decimal(record["unit_price"])
            currency = record["currency"].upper()

            if quantity <= 0 or unit_price < 0:
                raise ValueError("Invalid quantity or unit price")

            valid_records.append(
                {
                    "order_id": record["order_id"],
                    "order_date": order_date,
                    "customer_email": record["customer_email"].lower(),
                    "product_sku": record["product_sku"],
                    "product_name": record["product_name"],
                    "region": record["region"],
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "currency": currency,
                    "campaign": record.get("campaign") or None,
                    "revenue": unit_price * quantity,
                }
            )
        except (KeyError, ValueError, InvalidOperation):
            rejected_rows += 1

    return valid_records, rejected_rows


def load_staging(
    connection: psycopg.Connection,
    job_id: str,
    source_id: str,
    records: list[dict[str, Any]],
) -> int:
    connection.execute("DELETE FROM staging.orders WHERE job_id = %s", [job_id])

    for record in records:
        connection.execute(
            """
            INSERT INTO staging.orders (
              id, job_id, source_id, order_id, order_date, customer_email,
              product_sku, product_name, region, quantity, unit_price, currency,
              campaign, revenue
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            [
                str(uuid4()),
                job_id,
                source_id,
                record["order_id"],
                record["order_date"],
                record["customer_email"],
                record["product_sku"],
                record["product_name"],
                record["region"],
                record["quantity"],
                record["unit_price"],
                record["currency"],
                record["campaign"],
                record["revenue"],
            ],
        )

    return len(records)
