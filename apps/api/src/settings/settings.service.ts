import { Injectable } from "@nestjs/common";
import type { ReminderSettingDto } from "@ai-diary/types";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getReminderSetting(userId: string): Promise<ReminderSettingDto> {
    const setting = await this.prisma.reminderSetting.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    return {
      enabled: setting.enabled,
      hour: setting.hour,
      timezone: setting.timezone,
    };
  }

  async updateReminderSetting(
    userId: string,
    payload: ReminderSettingDto,
  ): Promise<ReminderSettingDto> {
    const setting = await this.prisma.reminderSetting.upsert({
      where: { userId },
      update: payload,
      create: { userId, ...payload },
    });

    return {
      enabled: setting.enabled,
      hour: setting.hour,
      timezone: setting.timezone,
    };
  }
}
