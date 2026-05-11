export const etlJobStatuses = ["QUEUED", "RUNNING", "SUCCEEDED", "FAILED"] as const;
export const etlLogLevels = ["INFO", "WARN", "ERROR"] as const;

export type EtlJobStatus = (typeof etlJobStatuses)[number];
export type EtlLogLevel = (typeof etlLogLevels)[number];

export type EtlJobRecord = {
  id: string;
  dataSourceId: string | null;
  dataSourceName?: string;
  pipeline: string;
  status: EtlJobStatus;
  processedRows: number;
  rejectedRows: number;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  errorMessage?: string;
  createdAt: string;
};

export type EtlJobLogRecord = {
  id: string;
  jobId: string;
  stage: string;
  level: EtlLogLevel;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};
