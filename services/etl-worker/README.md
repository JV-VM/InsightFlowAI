# ETL Worker

This directory contains the Phase 1 ETL worker scaffold.

Planned responsibilities:

- Extract data from APIs and CSV files
- Validate and clean records
- Load `raw`, `staging`, and `analytics` schemas
- Persist job logs and processing metrics

Current state:

- FastAPI application in `main.py`
- `GET /health`
- `POST /jobs/run` placeholder for Phase 3 orchestration
