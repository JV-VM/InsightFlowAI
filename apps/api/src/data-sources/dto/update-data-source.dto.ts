import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsObject, IsOptional, IsString, MinLength } from "class-validator";
import { DataSourceStatus, dataSourceStatuses, DataSourceType, dataSourceTypes } from "../data-sources.types";

export class UpdateDataSourceDto {
  @ApiProperty({ example: "Shopify Demo Store", required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiProperty({ enum: dataSourceTypes, example: "ECOMMERCE", required: false })
  @IsOptional()
  @IsIn(dataSourceTypes)
  type?: DataSourceType;

  @ApiProperty({ enum: dataSourceStatuses, example: "CONNECTED", required: false })
  @IsOptional()
  @IsIn(dataSourceStatuses)
  status?: DataSourceStatus;

  @ApiProperty({ example: "daily", required: false })
  @IsOptional()
  @IsString()
  schedule?: string;

  @ApiProperty({
    example: { provider: "shopify", apiKey: "local-demo-key" },
    required: false,
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
