export const dataSourceTypes = [
  "ECOMMERCE",
  "CRM",
  "MARKETING",
  "SUPPORT",
  "CSV",
] as const;

export const dataSourceStatuses = [
  "DRAFT",
  "CONNECTED",
  "FAILED",
  "DISABLED",
] as const;

export type DataSourceType = (typeof dataSourceTypes)[number];
export type DataSourceStatus = (typeof dataSourceStatuses)[number];

export type DataSourceRecord = {
  id: string;
  name: string;
  type: DataSourceType;
  status: DataSourceStatus;
  schedule: string;
  config: Record<string, unknown>;
  lastConnectionTestAt?: string;
  lastConnectionMessage?: string;
  createdAt: string;
  updatedAt: string;
};
