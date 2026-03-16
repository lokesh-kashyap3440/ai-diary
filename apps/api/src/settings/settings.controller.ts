import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionGuard } from "../auth/session.guard";
import { UpdateReminderSettingDto } from "./dto/update-reminder-setting.dto";
import { SettingsService } from "./settings.service";

@Controller("settings")
@UseGuards(SessionGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get("reminders")
  getReminderSetting(@CurrentUser() user: { sub: string }) {
    return this.settingsService.getReminderSetting(user.sub);
  }

  @Put("reminders")
  updateReminderSetting(
    @CurrentUser() user: { sub: string },
    @Body() body: UpdateReminderSettingDto,
  ) {
    return this.settingsService.updateReminderSetting(user.sub, body);
  }
}
