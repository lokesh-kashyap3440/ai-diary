import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(80)
  displayName!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
