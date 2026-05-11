import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { DataSourcesService } from "./data-sources.service";
import { CreateDataSourceDto } from "./dto/create-data-source.dto";
import { UpdateDataSourceDto } from "./dto/update-data-source.dto";

@ApiTags("data-sources")
@Controller("data-sources")
export class DataSourcesController {
  constructor(private readonly dataSourcesService: DataSourcesService) {}

  @Get()
  @ApiOperation({ summary: "List configured business data sources" })
  findAll() {
    return this.dataSourcesService.findAll();
  }

  @Post()
  @ApiOperation({ summary: "Create a business data source" })
  create(@Body() payload: CreateDataSourceDto) {
    return this.dataSourcesService.create(payload);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one business data source" })
  findOne(@Param("id") id: string) {
    return this.dataSourcesService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a business data source" })
  update(@Param("id") id: string, @Body() payload: UpdateDataSourceDto) {
    return this.dataSourcesService.update(id, payload);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a business data source" })
  remove(@Param("id") id: string) {
    return this.dataSourcesService.remove(id);
  }

  @Post(":id/test-connection")
  @ApiOperation({ summary: "Test data source connectivity with local mock providers" })
  testConnection(@Param("id") id: string) {
    return this.dataSourcesService.testConnection(id);
  }
}
