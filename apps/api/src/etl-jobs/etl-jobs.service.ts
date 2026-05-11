import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { DatabaseService } from "../database/database.service";
import { RunEtlJobDto } from "./dto/run-etl-job.dto";
import { EtlJobLogRecord, EtlJobRecord, EtlJobStatus, EtlLogLevel } from "./etl-jobs.types";

type EtlJobRow = {
  id: string;
  data_source_id: string | null;
  data_source_name: string | null;
  pipeline: string;
  status: EtlJobStatus;
  processed_rows: number;
  rejected_rows: number;
  started_at: Date | null;
  finished_at: Date | null;
  duration_ms: number | null;
  error_message: string | null;
  created_at: Date;
};

type EtlJobLogRow = {
  id: string;
  job_id: string;
  stage: string;
  level: EtlLogLevel;
  message: string;
  metadata: Record<string, unknown>;
  created_at: Date;
};

type DataSourceForRun = {
  id: string;
  name: string;
  type: string;
  status: string;
  config: Record<string, unknown>;
};

type WorkerLog = {
  stage: string;
  level: EtlLogLevel;
  message: string;
  metadata?: Record<string, unknown>;
};

type WorkerRunResponse = {
  status: Extract<EtlJobStatus, "SUCCEEDED" | "FAILED">;
  processed_rows: number;
  rejected_rows: number;
  logs: WorkerLog[];
};

@Injectable()
export class EtlJobsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll() {
    const result = await this.databaseService.query<EtlJobRow>(
      `
        SELECT j.id, j.data_source_id, s.name AS data_source_name, j.pipeline, j.status,
          j.processed_rows, j.rejected_rows, j.started_at, j.finished_at, j.duration_ms,
          j.error_message, j.created_at
        FROM app.etl_jobs j
        LEFT JOIN app.data_sources s ON s.id = j.data_source_id
        ORDER BY j.created_at DESC
      `,
    );

    return result.rows.map((row) => this.fromJobRow(row));
  }

  async findOne(id: string) {
    const job = await this.getJobById(id);
    const logs = await this.findLogs(id);
    return { ...job, logs };
  }

  async run(payload: RunEtlJobDto) {
    const source = await this.getDataSource(payload.dataSourceId);
    const job = await this.createJob(source.id, payload.pipeline ?? "orders");

    try {
      await this.markJobRunning(job.id);

      if (source.status !== "CONNECTED") {
        throw new Error("Data source must be connected before running ETL");
      }

      const workerResult = await this.runWorker(job.id, source.id, job.pipeline);

      for (const log of workerResult.logs) {
        await this.writeLog(
          job.id,
          log.stage,
          log.level,
          log.message,
          log.metadata ?? {},
        );
      }

      await this.finishJob(
        job.id,
        workerResult.status,
        workerResult.processed_rows,
        workerResult.rejected_rows,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "ETL job failed";
      await this.writeLog(job.id, "failed", "ERROR", message);
      await this.finishJob(job.id, "FAILED", 0, 0, message);
    }

    return this.findOne(job.id);
  }

  async retry(id: string) {
    const existing = await this.getJobById(id);

    if (!existing.dataSourceId) {
      throw new NotFoundException("Original data source is unavailable");
    }

    return this.run({
      dataSourceId: existing.dataSourceId,
      pipeline: existing.pipeline,
    });
  }

  private async getDataSource(id: string) {
    const result = await this.databaseService.query<DataSourceForRun>(
      `
        SELECT id, name, type, status, config
        FROM app.data_sources
        WHERE id = $1
      `,
      [id],
    );

    if (!result.rows[0]) {
      throw new NotFoundException("Data source not found");
    }

    return result.rows[0];
  }

  private async createJob(dataSourceId: string, pipeline: string) {
    const result = await this.databaseService.query<EtlJobRow>(
      `
        INSERT INTO app.etl_jobs (id, data_source_id, pipeline, status)
        VALUES ($1, $2, $3, 'QUEUED')
        RETURNING id, data_source_id, NULL::text AS data_source_name, pipeline, status,
          processed_rows, rejected_rows, started_at, finished_at, duration_ms,
          error_message, created_at
      `,
      [randomUUID(), dataSourceId, pipeline],
    );

    return this.fromJobRow(result.rows[0]);
  }

  private async markJobRunning(id: string) {
    await this.databaseService.query(
      `
        UPDATE app.etl_jobs
        SET status = 'RUNNING', started_at = now()
        WHERE id = $1
      `,
      [id],
    );
    await this.writeLog(id, "queued", "INFO", "ETL job accepted by API orchestrator");
  }

  private async finishJob(
    id: string,
    status: Extract<EtlJobStatus, "SUCCEEDED" | "FAILED">,
    processedRows: number,
    rejectedRows: number,
    errorMessage?: string,
  ) {
    await this.databaseService.query(
      `
        UPDATE app.etl_jobs
        SET status = $2,
          processed_rows = $3,
          rejected_rows = $4,
          finished_at = now(),
          duration_ms = GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (now() - started_at)) * 1000))::int,
          error_message = $5
        WHERE id = $1
      `,
      [id, status, processedRows, rejectedRows, errorMessage ?? null],
    );
  }

  private async getJobById(id: string) {
    const result = await this.databaseService.query<EtlJobRow>(
      `
        SELECT j.id, j.data_source_id, s.name AS data_source_name, j.pipeline, j.status,
          j.processed_rows, j.rejected_rows, j.started_at, j.finished_at, j.duration_ms,
          j.error_message, j.created_at
        FROM app.etl_jobs j
        LEFT JOIN app.data_sources s ON s.id = j.data_source_id
        WHERE j.id = $1
      `,
      [id],
    );

    if (!result.rows[0]) {
      throw new NotFoundException("ETL job not found");
    }

    return this.fromJobRow(result.rows[0]);
  }

  private async findLogs(jobId: string) {
    const result = await this.databaseService.query<EtlJobLogRow>(
      `
        SELECT id, job_id, stage, level, message, metadata, created_at
        FROM app.etl_job_logs
        WHERE job_id = $1
        ORDER BY created_at ASC
      `,
      [jobId],
    );

    return result.rows.map((row) => this.fromLogRow(row));
  }

  private async writeLog(
    jobId: string,
    stage: string,
    level: EtlLogLevel,
    message: string,
    metadata: Record<string, unknown> = {},
  ) {
    await this.databaseService.query(
      `
        INSERT INTO app.etl_job_logs (id, job_id, stage, level, message, metadata)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      `,
      [randomUUID(), jobId, stage, level, message, JSON.stringify(metadata)],
    );
  }

  private fromJobRow(row: EtlJobRow): EtlJobRecord {
    return {
      id: row.id,
      dataSourceId: row.data_source_id,
      dataSourceName: row.data_source_name ?? undefined,
      pipeline: row.pipeline,
      status: row.status,
      processedRows: row.processed_rows,
      rejectedRows: row.rejected_rows,
      startedAt: row.started_at?.toISOString(),
      finishedAt: row.finished_at?.toISOString(),
      durationMs: row.duration_ms ?? undefined,
      errorMessage: row.error_message ?? undefined,
      createdAt: row.created_at.toISOString(),
    };
  }

  private fromLogRow(row: EtlJobLogRow): EtlJobLogRecord {
    return {
      id: row.id,
      jobId: row.job_id,
      stage: row.stage,
      level: row.level,
      message: row.message,
      metadata: row.metadata,
      createdAt: row.created_at.toISOString(),
    };
  }

  private async runWorker(jobId: string, dataSourceId: string, pipeline: string) {
    const response = await fetch(`${this.getWorkerUrl()}/jobs/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        job_id: jobId,
        source_id: dataSourceId,
        pipeline,
      }),
    });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      const detail = typeof body?.detail === "string" ? body.detail : "ETL worker run failed";
      throw new Error(detail);
    }

    return body as WorkerRunResponse;
  }

  private getWorkerUrl() {
    return process.env.ETL_WORKER_URL ?? "http://127.0.0.1:8001";
  }
}
