import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { AuthModule } from "../auth/auth.module";
import { EntriesController } from "./entries.controller";
import { EntriesService } from "./entries.service";

@Module({
  imports: [AiModule, AuthModule],
  controllers: [EntriesController],
  providers: [EntriesService],
  exports: [EntriesService],
})
export class EntriesModule {}
