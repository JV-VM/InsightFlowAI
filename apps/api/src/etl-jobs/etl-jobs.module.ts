import { Module } from "@nestjs/common";
import { EtlJobsController } from "./etl-jobs.controller";
import { EtlJobsService } from "./etl-jobs.service";

@Module({
  controllers: [EtlJobsController],
  providers: [EtlJobsService],
})
export class EtlJobsModule {}
