import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "Insight Analyst" })
  @IsString()
  name!: string;

  @ApiProperty({ example: "analyst@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "ChangeMe123!" })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: "ANALYST", required: false })
  @IsOptional()
  @IsString()
  role?: string;
}
