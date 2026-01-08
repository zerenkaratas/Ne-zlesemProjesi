import { IsString } from "class-validator";

export class LoginDto {
  @IsString()
  login: string; // username veya email
  @IsString()
  password: string;
}
