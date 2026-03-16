import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { ChatMessageDto, ChatThreadDto } from "@ai-diary/types";
import { AiService } from "../ai/ai.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async listThreads(userId: string): Promise<ChatThreadDto[]> {
    const threads = await this.prisma.chatThread.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return threads.map((thread) => this.toThreadDto(thread));
  }

  async sendMessage(
    userId: string,
    payload: { threadId?: string; message: string; relatedEntryId?: string },
  ): Promise<ChatThreadDto> {
    let thread =
      payload.threadId
        ? await this.prisma.chatThread.findUnique({
            where: { id: payload.threadId },
            include: { messages: { orderBy: { createdAt: "asc" } } },
          })
        : null;

    if (thread && thread.userId !== userId) {
      throw new ForbiddenException();
    }

    if (!thread) {
      thread = await this.prisma.chatThread.create({
        data: {
          userId,
          title: payload.message.slice(0, 60),
        },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
    }

    let relatedEntry:
      | {
          id: string;
          title: string;
          body: string;
          moodScore: number | null;
          userId: string;
        }
      | null = null;

    if (payload.relatedEntryId) {
      relatedEntry = await this.prisma.diaryEntry.findUnique({
        where: { id: payload.relatedEntryId },
        select: { id: true, title: true, body: true, moodScore: true, userId: true },
      });

      if (!relatedEntry) {
        throw new NotFoundException("Related entry not found");
      }
      if (relatedEntry.userId !== userId) {
        throw new ForbiddenException();
      }
    }

    await this.prisma.chatMessage.create({
      data: {
        threadId: thread.id,
        role: "user",
        content: payload.message,
        relatedEntryId: payload.relatedEntryId,
      },
    });

    const refreshed = await this.prisma.chatThread.findUniqueOrThrow({
      where: { id: thread.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const assistantReply = await this.aiService.chat({
      message: payload.message,
      history: refreshed.messages.map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      })),
      relatedEntry: relatedEntry
        ? {
            title: relatedEntry.title,
            body: relatedEntry.body,
            moodScore: relatedEntry.moodScore,
          }
        : null,
    });

    const updated = await this.prisma.chatThread.update({
      where: { id: thread.id },
      data: {
        updatedAt: new Date(),
        messages: {
          create: {
            role: "assistant",
            content: assistantReply,
            relatedEntryId: payload.relatedEntryId,
          },
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return this.toThreadDto(updated);
  }

  private toThreadDto(thread: {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    messages: Array<{
      id: string;
      role: string;
      content: string;
      relatedEntryId: string | null;
      createdAt: Date;
    }>;
  }): ChatThreadDto {
    return {
      id: thread.id,
      title: thread.title,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
      messages: thread.messages.map(
        (message): ChatMessageDto => ({
          id: message.id,
          role: message.role === "assistant" ? "assistant" : "user",
          content: message.content,
          relatedEntryId: message.relatedEntryId,
          createdAt: message.createdAt.toISOString(),
        }),
      ),
    };
  }
}
