import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  CreateEntryDto,
  EntryDto,
  EntryFiltersDto,
  ReflectionPayload,
  UpdateEntryDto,
} from "@ai-diary/types";
import type { Prisma } from "@prisma/client";
import { AiService } from "../ai/ai.service";
import { PrismaService } from "../prisma/prisma.service";

type ReflectionStatusValue = "pending" | "completed" | "failed";
type ReflectionRecord = {
  id: string;
  status: ReflectionStatusValue;
  summary: string | null;
  moodInterpretation: string | null;
  themes: unknown;
  prompts: unknown;
  errorMessage: string | null;
  createdAt: Date;
};

@Injectable()
export class EntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async listEntries(userId: string, filters: EntryFiltersDto = {}): Promise<EntryDto[]> {
    const where: Prisma.DiaryEntryWhereInput = {
      userId,
      ...(filters.includeDrafts ? {} : { isDraft: false }),
      ...(filters.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: "insensitive" } },
              { body: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filters.tag
        ? {
            tags: {
              some: {
                label: { equals: filters.tag, mode: "insensitive" },
              },
            },
          }
        : {}),
      ...(filters.moodMin != null || filters.moodMax != null
        ? {
            moodScore: {
              ...(filters.moodMin != null ? { gte: filters.moodMin } : {}),
              ...(filters.moodMax != null ? { lte: filters.moodMax } : {}),
            },
          }
        : {}),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: new Date(filters.to) } : {}),
            },
          }
        : {}),
    };

    const entries = await this.prisma.diaryEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        tags: true,
        reflections: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return entries.map((entry: Awaited<typeof entries>[number]) => this.toEntryDto(entry));
  }

  async createEntry(userId: string, payload: CreateEntryDto): Promise<EntryDto> {
    const entry = await this.prisma.diaryEntry.create({
      data: {
        userId,
        title: payload.title,
        body: payload.body,
        moodScore: payload.moodScore,
        isDraft: payload.isDraft ?? false,
      },
      include: {
        tags: true,
        reflections: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return this.toEntryDto(entry);
  }

  async getEntry(userId: string, entryId: string): Promise<EntryDto> {
    const entry = await this.prisma.diaryEntry.findUnique({
      where: { id: entryId },
      include: {
        tags: true,
        reflections: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!entry) {
      throw new NotFoundException("Entry not found");
    }
    if (entry.userId !== userId) {
      throw new ForbiddenException();
    }

    return this.toEntryDto(entry);
  }

  async updateEntry(
    userId: string,
    entryId: string,
    payload: UpdateEntryDto,
  ): Promise<EntryDto> {
    await this.assertOwnership(userId, entryId);
    const entry = await this.prisma.diaryEntry.update({
      where: { id: entryId },
      data: {
        ...(payload.title !== undefined ? { title: payload.title } : {}),
        ...(payload.body !== undefined ? { body: payload.body } : {}),
        ...(payload.moodScore !== undefined ? { moodScore: payload.moodScore } : {}),
        ...(payload.isDraft !== undefined ? { isDraft: payload.isDraft } : {}),
      },
      include: {
        tags: true,
        reflections: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return this.toEntryDto(entry);
  }

  async deleteEntry(userId: string, entryId: string) {
    await this.assertOwnership(userId, entryId);
    await this.prisma.diaryEntry.delete({
      where: { id: entryId },
    });
    return { success: true };
  }

  async reflectOnEntry(userId: string, entryId: string): Promise<ReflectionPayload> {
    const entry = await this.prisma.diaryEntry.findUnique({
      where: { id: entryId },
      include: { tags: true },
    });

    if (!entry) {
      throw new NotFoundException("Entry not found");
    }
    if (entry.userId !== userId) {
      throw new ForbiddenException();
    }

    const reflectionRecord = await this.prisma.entryReflection.create({
      data: {
        entryId: entry.id,
        status: "pending",
      },
    });

    try {
      const reflection = await this.aiService.reflectOnEntry({
        title: entry.title,
        body: entry.body,
        moodScore: entry.moodScore,
      });

      await this.prisma.$transaction([
        this.prisma.entryReflection.update({
          where: { id: reflectionRecord.id },
          data: {
            status: "completed",
            summary: reflection.summary,
            moodInterpretation: reflection.moodInterpretation,
            themes: reflection.themes,
            prompts: reflection.prompts,
            rawPayload: reflection.rawPayload as Prisma.InputJsonValue,
          },
        }),
        this.prisma.diaryEntry.update({
          where: { id: entry.id },
          data: {
            reflectedAt: new Date(),
            isDraft: false,
            tags: {
              createMany: {
                data: reflection.suggestedTags.map((label) => ({ label })),
                skipDuplicates: true,
              },
            },
          },
        }),
      ]);

      const saved = await this.prisma.entryReflection.findUniqueOrThrow({
        where: { id: reflectionRecord.id },
      });

      return this.toReflectionDto(
        saved,
        entry.tags.map((tag: { label: string }) => tag.label),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Reflection failed";
      const failed = await this.prisma.entryReflection.update({
        where: { id: reflectionRecord.id },
        data: {
          status: "failed",
          errorMessage: message,
        },
      });

      return this.toReflectionDto(failed, []);
    }
  }

  async listReflections(userId: string, entryId: string): Promise<ReflectionPayload[]> {
    await this.assertOwnership(userId, entryId);
    const reflections = await this.prisma.entryReflection.findMany({
      where: { entryId },
      orderBy: { createdAt: "desc" },
    });
    const tags = await this.prisma.entryTag.findMany({
      where: { entryId },
      select: { label: true },
    });

    return reflections.map((reflection) =>
      this.toReflectionDto(
        reflection,
        tags.map((tag) => tag.label),
      ),
    );
  }

  async updateTags(userId: string, entryId: string, tags: string[]): Promise<EntryDto> {
    await this.assertOwnership(userId, entryId);
    const cleaned = Array.from(
      new Set(tags.map((tag) => tag.trim()).filter(Boolean)),
    );
    const entry = await this.prisma.diaryEntry.update({
      where: { id: entryId },
      data: {
        tags: {
          deleteMany: {},
          createMany: {
            data: cleaned.map((label) => ({ label })),
            skipDuplicates: true,
          },
        },
      },
      include: {
        tags: true,
        reflections: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return this.toEntryDto(entry);
  }

  private async assertOwnership(userId: string, entryId: string) {
    const entry = await this.prisma.diaryEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new NotFoundException("Entry not found");
    }
    if (entry.userId !== userId) {
      throw new ForbiddenException();
    }
  }

  private toEntryDto(entry: {
    id: string;
    title: string;
    body: string;
    moodScore: number | null;
    isDraft: boolean;
    createdAt: Date;
    updatedAt: Date;
    reflectedAt: Date | null;
    tags: Array<{ label: string }>;
    reflections: ReflectionRecord[];
  }): EntryDto {
    return {
      id: entry.id,
      title: entry.title,
      body: entry.body,
      moodScore: entry.moodScore,
      isDraft: entry.isDraft,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
      reflectedAt: entry.reflectedAt?.toISOString() ?? null,
      tags: entry.tags.map((tag: { label: string }) => tag.label),
      latestReflection: entry.reflections[0]
        ? this.toReflectionDto(
            entry.reflections[0],
            entry.tags.map((tag: { label: string }) => tag.label),
          )
        : null,
    };
  }

  private toReflectionDto(
    reflection: ReflectionRecord,
    tags: string[],
  ): ReflectionPayload {
    return {
      id: reflection.id,
      status: reflection.status,
      summary: reflection.summary,
      moodInterpretation: reflection.moodInterpretation,
      themes: Array.isArray(reflection.themes) ? reflection.themes : [],
      prompts: Array.isArray(reflection.prompts) ? reflection.prompts : [],
      suggestedTags: tags,
      errorMessage: reflection.errorMessage,
      createdAt: reflection.createdAt.toISOString(),
    };
  }
}
