import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AiModule } from "./ai/ai.module";
import { AuthModule } from "./auth/auth.module";
import { ChatModule } from "./chat/chat.module";
import { EntriesModule } from "./entries/entries.module";
import { ExportModule } from "./export/export.module";
import { HealthModule } from "./health/health.module";
import { InsightsModule } from "./insights/insights.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SettingsModule } from "./settings/settings.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "../../.env",
    }),
    PrismaModule,
    AiModule,
    AuthModule,
    ChatModule,
    EntriesModule,
    SettingsModule,
    ExportModule,
    InsightsModule,
    HealthModule,
  ],
})
export class AppModule {}
