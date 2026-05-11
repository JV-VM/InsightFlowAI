import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { DatabaseService } from "../database/database.service";
import { CreateDataSourceDto } from "./dto/create-data-source.dto";
import { UpdateDataSourceDto } from "./dto/update-data-source.dto";
import { DataSourceRecord, DataSourceStatus, DataSourceType } from "./data-sources.types";

type DataSourceRow = {
  id: string;
  name: string;
  type: DataSourceType;
  status: DataSourceStatus;
  schedule: string;
  config: Record<string, unknown>;
  last_connection_test_at: Date | null;
  last_connection_message: string | null;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class DataSourcesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll() {
    const result = await this.databaseService.query<DataSourceRow>(
      `
        SELECT id, name, type, status, schedule, config, last_connection_test_at,
          last_connection_message, created_at, updated_at
        FROM app.data_sources
        ORDER BY created_at ASC
      `,
    );

    return result.rows.map((row) => this.fromRow(row));
  }

  async findOne(id: string) {
    return this.getById(id);
  }

  async create(payload: CreateDataSourceDto) {
    const result = await this.databaseService.query<DataSourceRow>(
      `
        INSERT INTO app.data_sources (id, name, type, status, schedule, config)
        VALUES ($1, $2, $3, 'DRAFT', $4, $5::jsonb)
        RETURNING id, name, type, status, schedule, config, last_connection_test_at,
          last_connection_message, created_at, updated_at
      `,
      [
        randomUUID(),
        payload.name,
        payload.type,
        payload.schedule ?? "manual",
        JSON.stringify(payload.config ?? {}),
      ],
    );

    return this.fromRow(result.rows[0]);
  }

  async update(id: string, payload: UpdateDataSourceDto) {
    await this.getById(id);

    const updates: string[] = [];
    const values: unknown[] = [];

    this.addUpdate(updates, values, "name", payload.name);
    this.addUpdate(updates, values, "type", payload.type);
    this.addUpdate(updates, values, "status", payload.status);
    this.addUpdate(updates, values, "schedule", payload.schedule);

    if (payload.config !== undefined) {
      values.push(JSON.stringify(payload.config));
      updates.push(`config = $${values.length}::jsonb`);
    }

    if (!updates.length) {
      return this.getById(id);
    }

    values.push(id);
    const result = await this.databaseService.query<DataSourceRow>(
      `
        UPDATE app.data_sources
        SET ${updates.join(", ")}, updated_at = now()
        WHERE id = $${values.length}
        RETURNING id, name, type, status, schedule, config, last_connection_test_at,
          last_connection_message, created_at, updated_at
      `,
      values,
    );

    return this.fromRow(result.rows[0]);
  }

  async remove(id: string) {
    const result = await this.databaseService.query<DataSourceRow>(
      `
        DELETE FROM app.data_sources
        WHERE id = $1
        RETURNING id, name, type, status, schedule, config, last_connection_test_at,
          last_connection_message, created_at, updated_at
      `,
      [id],
    );

    if (!result.rows[0]) {
      throw new NotFoundException("Data source not found");
    }

    return this.fromRow(result.rows[0]);
  }

  async testConnection(id: string) {
    const existing = await this.getById(id);
    const result = this.buildConnectionResult(existing);
    const updateResult = await this.databaseService.query<DataSourceRow>(
      `
        UPDATE app.data_sources
        SET status = $2, last_connection_test_at = now(), last_connection_message = $3,
          updated_at = now()
        WHERE id = $1
        RETURNING id, name, type, status, schedule, config, last_connection_test_at,
          last_connection_message, created_at, updated_at
      `,
      [id, result.ok ? "CONNECTED" : "FAILED", result.message],
    );
    const updated = this.fromRow(updateResult.rows[0]);

    return {
      dataSource: updated,
      ok: result.ok,
      message: result.message,
      checkedAt: updated.lastConnectionTestAt,
      sampleRecordCount: result.sampleRecordCount,
    };
  }

  private async getById(id: string) {
    const result = await this.databaseService.query<DataSourceRow>(
      `
        SELECT id, name, type, status, schedule, config, last_connection_test_at,
          last_connection_message, created_at, updated_at
        FROM app.data_sources
        WHERE id = $1
      `,
      [id],
    );
    const dataSource = result.rows[0];

    if (!dataSource) {
      throw new NotFoundException("Data source not found");
    }

    return this.fromRow(dataSource);
  }

  private buildConnectionResult(dataSource: DataSourceRecord) {
    if (dataSource.type === "CSV") {
      const hasPath = typeof dataSource.config.path === "string" && dataSource.config.path.length > 0;
      return {
        ok: hasPath,
        message: hasPath
          ? "CSV source contract is valid for local ingestion"
          : "CSV sources require config.path before ingestion",
        sampleRecordCount: hasPath ? 25 : 0,
      };
    }

    const provider = typeof dataSource.config.provider === "string"
      ? dataSource.config.provider
      : dataSource.type.toLowerCase();

    return {
      ok: true,
      message: `Mock ${provider} provider accepted the connection`,
      sampleRecordCount: 50,
    };
  }

  private addUpdate(
    updates: string[],
    values: unknown[],
    column: string,
    value: unknown,
  ) {
    if (value === undefined) {
      return;
    }

    values.push(value);
    updates.push(`${column} = $${values.length}`);
  }

  private fromRow(row: DataSourceRow): DataSourceRecord {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.status,
      schedule: row.schedule,
      config: row.config,
      lastConnectionTestAt: row.last_connection_test_at?.toISOString(),
      lastConnectionMessage: row.last_connection_message ?? undefined,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}
