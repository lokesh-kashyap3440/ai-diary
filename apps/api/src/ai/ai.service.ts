import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Groq from "groq-sdk";

export type ReflectionResult = {
  summary: string;
  moodInterpretation: string;
  themes: string[];
  prompts: string[];
  suggestedTags: string[];
  rawPayload: Record<string, unknown>;
};

type ChatInput = {
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  relatedEntry: {
    title: string;
    body: string;
    moodScore?: number | null;
  } | null;
};

@Injectable()
export class AiService {
  private readonly groqClient: Groq | null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("GROQ_API_KEY");
    this.groqClient = apiKey ? new Groq({ apiKey }) : null;
  }

  async reflectOnEntry(input: {
    title: string;
    body: string;
    moodScore?: number | null;
  }): Promise<ReflectionResult> {
    if (!this.groqClient) {
      return this.buildLocalFallback(input);
    }

    const prompt = [
      "You are a reflective journaling coach.",
      "Return valid JSON only with keys: summary, moodInterpretation, themes, prompts, suggestedTags.",
      "Themes, prompts, and suggestedTags must be arrays of short strings.",
      `Title: ${input.title}`,
      `Mood score: ${input.moodScore ?? "unknown"}`,
      `Body: ${input.body}`,
    ].join("\n");

    const completion = await this.groqClient.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    const parsed = JSON.parse(content ?? "{}") as Partial<ReflectionResult>;

    return {
      summary: parsed.summary ?? "Reflection generated.",
      moodInterpretation:
        parsed.moodInterpretation ?? "Your entry carries a thoughtful tone.",
      themes: Array.isArray(parsed.themes) ? parsed.themes.slice(0, 5) : [],
      prompts: Array.isArray(parsed.prompts) ? parsed.prompts.slice(0, 3) : [],
      suggestedTags: Array.isArray(parsed.suggestedTags)
        ? parsed.suggestedTags.slice(0, 5)
        : [],
      rawPayload: parsed as Record<string, unknown>,
    };
  }

  async chat(input: ChatInput): Promise<string> {
    if (!this.groqClient) {
      return this.buildLocalChatFallback(input);
    }

    const entryContext = input.relatedEntry
      ? `Related diary entry title: ${input.relatedEntry.title}\nMood score: ${
          input.relatedEntry.moodScore ?? "unknown"
        }\nEntry body: ${input.relatedEntry.body}`
      : "No specific diary entry attached.";

    const messages = [
      {
        role: "system" as const,
        content:
          "You are a warm but concise journaling coach. Help the user reflect, not just chat aimlessly. Ask good follow-up questions when useful.",
      },
      {
        role: "system" as const,
        content: entryContext,
      },
      ...input.history.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      {
        role: "user" as const,
        content: input.message,
      },
    ];

    const completion = await this.groqClient.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.6,
      messages,
    });

    return (
      completion.choices[0]?.message?.content ??
      "I’m here with you. Tell me what feels most important in this moment."
    );
  }

  private buildLocalFallback(input: {
    title: string;
    body: string;
    moodScore?: number | null;
  }): ReflectionResult {
    const body = input.body.trim();
    const sentences = body.split(/[.!?]\s+/).filter(Boolean);
    const summary =
      sentences[0] ??
      `You wrote about ${input.title.toLowerCase() || "your day"} with a reflective tone.`;
    const moodInterpretation =
      input.moodScore == null
        ? "You did not score the mood, but the entry reads introspective."
        : input.moodScore >= 7
          ? "Your entry points to a mostly positive emotional state."
          : input.moodScore >= 4
            ? "Your entry suggests a mixed emotional state with room for reflection."
            : "Your entry carries strain or heaviness that deserves care.";

    const suggestedTags = Array.from(
      new Set(
        `${input.title} ${input.body}`
          .toLowerCase()
          .match(/\b[a-z]{5,}\b/g)
          ?.slice(0, 4) ?? ["reflection"],
      ),
    );

    return {
      summary,
      moodInterpretation,
      themes: suggestedTags.slice(0, 3),
      prompts: [
        "What part of this moment feels most important to remember?",
        "What would make tomorrow feel 10% better?",
        "What emotion in this entry needs more attention?",
      ],
      suggestedTags,
      rawPayload: {
        provider: "local-fallback",
      },
    };
  }

  private buildLocalChatFallback(input: ChatInput): string {
    const related = input.relatedEntry
      ? `About your entry "${input.relatedEntry.title}", `
      : "";

    return `${related}it sounds like there is more underneath what you wrote. What part of this feels unresolved, and what would you want to understand better about it?`;
  }
}
