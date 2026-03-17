import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class UpdateEntryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  body?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  moodScore?: number | null;

  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;
}
