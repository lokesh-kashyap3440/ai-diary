import { Injectable } from "@nestjs/common";
import type { InsightSummaryDto } from "@ai-diary/types";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InsightsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string): Promise<InsightSummaryDto> {
    const entries = await this.prisma.diaryEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        reflections: {
          where: { status: "completed" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const totalEntries = entries.length;
    const draftCount = entries.filter((entry) => entry.isDraft).length;
    const moodEntries = entries.filter(
      (entry: Awaited<typeof entries>[number]) => entry.moodScore != null,
    );
    const averageMood =
      moodEntries.length > 0
        ? Number(
            (
              moodEntries.reduce(
                (sum: number, entry: Awaited<typeof entries>[number]) =>
                  sum + (entry.moodScore ?? 0),
                0,
              ) /
              moodEntries.length
            ).toFixed(1),
          )
        : null;

    const themeCounter = new Map<string, number>();
    const recentPrompts: string[] = [];

    for (const entry of entries) {
      const reflection = entry.reflections[0];
      if (!reflection) {
        continue;
      }

      const themes = Array.isArray(reflection.themes) ? reflection.themes : [];
      const prompts = Array.isArray(reflection.prompts) ? reflection.prompts : [];

      themes.forEach((theme: unknown) => {
        if (typeof theme === "string") {
          themeCounter.set(theme, (themeCounter.get(theme) ?? 0) + 1);
        }
      });

      prompts.forEach((prompt: unknown) => {
        if (typeof prompt === "string" && recentPrompts.length < 4) {
          recentPrompts.push(prompt);
        }
      });
    }

    return {
      totalEntries,
      averageMood,
      draftCount,
      topThemes: Array.from(themeCounter.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, count]) => ({ label, count })),
      writingStreakDays: this.computeStreak(
        entries.map((entry: Awaited<typeof entries>[number]) => entry.createdAt),
      ),
      recentPrompts,
      moodTimeline: moodEntries
        .slice(0, 12)
        .map((entry) => ({
          date: entry.createdAt.toISOString(),
          moodScore: entry.moodScore ?? 0,
        }))
        .reverse(),
      weeklySummaries: this.computeWeeklySummaries(entries),
    };
  }

  private computeStreak(dates: Date[]) {
    if (dates.length === 0) {
      return 0;
    }

    const uniqueDays = Array.from(
      new Set(dates.map((date) => date.toISOString().slice(0, 10))),
    ).sort()
      .reverse();

    let streak = 0;
    let cursor = new Date(uniqueDays[0]);

    for (const day of uniqueDays) {
      const current = new Date(day);
      const diff = Math.round(
        (cursor.getTime() - current.getTime()) / (24 * 60 * 60 * 1000),
      );
      if (streak === 0 || diff === 1) {
        streak += 1;
        cursor = current;
      } else if (diff === 0) {
        continue;
      } else {
        break;
      }
    }

    return streak;
  }

  private computeWeeklySummaries(
    entries: Array<{
      createdAt: Date;
      moodScore: number | null;
    }>,
  ) {
    const buckets = new Map<string, { total: number; count: number; moods: number[] }>();

    for (const entry of entries) {
      const day = new Date(entry.createdAt);
      const start = new Date(day);
      start.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
      start.setUTCHours(0, 0, 0, 0);
      const key = start.toISOString();
      const bucket = buckets.get(key) ?? { total: 0, count: 0, moods: [] };
      bucket.total += 1;
      bucket.count += 1;
      if (entry.moodScore != null) {
        bucket.moods.push(entry.moodScore);
      }
      buckets.set(key, bucket);
    }

    return Array.from(buckets.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 6)
      .map(([weekStart, bucket]) => ({
        weekStart,
        entries: bucket.total,
        averageMood:
          bucket.moods.length > 0
            ? Number(
                (bucket.moods.reduce((sum, mood) => sum + mood, 0) / bucket.moods.length).toFixed(
                  1,
                ),
              )
            : null,
      }));
  }
}
