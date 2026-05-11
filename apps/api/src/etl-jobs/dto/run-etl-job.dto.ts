import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";

export class RunEtlJobDto {
  @ApiProperty({ example: "7f019943-9869-4ff8-9e02-530e161bc2e0" })
  @IsUUID()
  dataSourceId!: string;

  @ApiProperty({ example: "orders", required: false })
  @IsOptional()
  @IsString()
  pipeline?: string;
}
