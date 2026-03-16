import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionGuard } from "../auth/session.guard";
import { CreateEntryDto } from "./dto/create-entry.dto";
import { ListEntriesDto } from "./dto/list-entries.dto";
import { UpdateEntryTagsDto } from "./dto/update-entry-tags.dto";
import { UpdateEntryDto } from "./dto/update-entry.dto";
import { EntriesService } from "./entries.service";

@Controller("entries")
@UseGuards(SessionGuard)
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Get()
  listEntries(@CurrentUser() user: { sub: string }, @Query() query: ListEntriesDto) {
    return this.entriesService.listEntries(user.sub, query);
  }

  @Post()
  createEntry(@CurrentUser() user: { sub: string }, @Body() body: CreateEntryDto) {
    return this.entriesService.createEntry(user.sub, body);
  }

  @Get(":id")
  getEntry(@CurrentUser() user: { sub: string }, @Param("id") id: string) {
    return this.entriesService.getEntry(user.sub, id);
  }

  @Patch(":id")
  updateEntry(
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
    @Body() body: UpdateEntryDto,
  ) {
    return this.entriesService.updateEntry(user.sub, id, body);
  }

  @Delete(":id")
  deleteEntry(@CurrentUser() user: { sub: string }, @Param("id") id: string) {
    return this.entriesService.deleteEntry(user.sub, id);
  }

  @Post(":id/reflect")
  reflect(@CurrentUser() user: { sub: string }, @Param("id") id: string) {
    return this.entriesService.reflectOnEntry(user.sub, id);
  }

  @Get(":id/reflections")
  reflections(@CurrentUser() user: { sub: string }, @Param("id") id: string) {
    return this.entriesService.listReflections(user.sub, id);
  }

  @Put(":id/tags")
  updateTags(
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
    @Body() body: UpdateEntryTagsDto,
  ) {
    return this.entriesService.updateTags(user.sub, id, body.tags);
  }
}
