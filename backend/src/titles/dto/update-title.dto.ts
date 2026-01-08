import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { TitleKind } from "../title-kind.enum";

export class UpdateTitleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsEnum(TitleKind)
  kind?: TitleKind;

  @IsOptional()
  @IsString()
  posterUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
