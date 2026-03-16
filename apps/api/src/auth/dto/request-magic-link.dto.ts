import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

export class RequestMagicLinkDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsBoolean()
  isRegistration?: boolean;
}
