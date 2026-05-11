import { Module } from "@nestjs/common";
import { AnalyticsModule } from "./analytics/analytics.module";
import { AuthModule } from "./auth/auth.module";
import { DataSourcesModule } from "./data-sources/data-sources.module";
import { DatabaseModule } from "./database/database.module";
import { EtlJobsModule } from "./etl-jobs/etl-jobs.module";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    DatabaseModule,
    HealthModule,
    AuthModule,
    DataSourcesModule,
    EtlJobsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
