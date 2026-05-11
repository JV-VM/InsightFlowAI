import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { RunEtlJobDto } from "./dto/run-etl-job.dto";
import { EtlJobsService } from "./etl-jobs.service";

@ApiTags("etl-jobs")
@Controller("etl-jobs")
export class EtlJobsController {
  constructor(private readonly etlJobsService: EtlJobsService) {}

  @Get()
  @ApiOperation({ summary: "List ETL jobs" })
  findAll() {
    return this.etlJobsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an ETL job and its logs" })
  findOne(@Param("id") id: string) {
    return this.etlJobsService.findOne(id);
  }

  @Post("run")
  @ApiOperation({ summary: "Run a manual ETL job for a data source" })
  run(@Body() payload: RunEtlJobDto) {
    return this.etlJobsService.run(payload);
  }

  @Post(":id/retry")
  @ApiOperation({ summary: "Retry an ETL job with the same source and pipeline" })
  retry(@Param("id") id: string) {
    return this.etlJobsService.retry(id);
  }
}
