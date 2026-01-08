import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { TitleKind } from "../title-kind.enum";

export class CreateTitleDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEnum(TitleKind)
  kind: TitleKind;

  @IsOptional()
  @IsString()
  posterUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
