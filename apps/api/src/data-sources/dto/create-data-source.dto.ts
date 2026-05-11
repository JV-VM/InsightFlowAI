import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsObject, IsOptional, IsString, MinLength } from "class-validator";
import { DataSourceType, dataSourceTypes } from "../data-sources.types";

export class CreateDataSourceDto {
  @ApiProperty({ example: "Shopify Demo Store" })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ enum: dataSourceTypes, example: "ECOMMERCE" })
  @IsIn(dataSourceTypes)
  type!: DataSourceType;

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
