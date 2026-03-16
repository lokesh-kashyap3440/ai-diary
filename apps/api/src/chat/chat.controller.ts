import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionGuard } from "../auth/session.guard";
import { SendChatMessageDto } from "./dto/send-chat-message.dto";
import { ChatService } from "./chat.service";

@Controller("chat")
@UseGuards(SessionGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get("threads")
  listThreads(@CurrentUser() user: { sub: string }) {
    return this.chatService.listThreads(user.sub);
  }

  @Post("messages")
  sendMessage(@CurrentUser() user: { sub: string }, @Body() body: SendChatMessageDto) {
    return this.chatService.sendMessage(user.sub, body);
  }
}
