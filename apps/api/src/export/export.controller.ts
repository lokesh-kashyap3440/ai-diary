import { Controller, Get, Header, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionGuard } from "../auth/session.guard";
import { PrismaService } from "../prisma/prisma.service";

@Controller("export")
@UseGuards(SessionGuard)
export class ExportController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("json")
  @Header("Content-Type", "application/json")
  async exportJson(@CurrentUser() user: { sub: string }) {
    const [profile, entries, chats, settings] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: user.sub },
        select: { id: true, email: true, displayName: true, createdAt: true },
      }),
      this.prisma.diaryEntry.findMany({
        where: { userId: user.sub },
        include: { tags: true, reflections: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.chatThread.findMany({
        where: { userId: user.sub },
        include: { messages: true },
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.reminderSetting.findUnique({ where: { userId: user.sub } }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      profile,
      entries,
      chats,
      reminders: settings,
    };
  }
}
