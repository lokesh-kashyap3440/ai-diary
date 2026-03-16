import { IsBoolean, IsInt, IsString, Max, Min } from "class-validator";

export class UpdateReminderSettingDto {
  @IsBoolean()
  enabled!: boolean;

  @IsInt()
  @Min(0)
  @Max(23)
  hour!: number;

  @IsString()
  timezone!: string;
}
