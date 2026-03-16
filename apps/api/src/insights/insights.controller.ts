import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionGuard } from "../auth/session.guard";
import { InsightsService } from "./insights.service";

@Controller("insights")
@UseGuards(SessionGuard)
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get("summary")
  getSummary(@CurrentUser() user: { sub: string }) {
    return this.insightsService.getSummary(user.sub);
  }
}
