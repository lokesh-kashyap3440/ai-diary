export type AuthRequestDto = {
  email: string;
  displayName?: string;
  isRegistration?: boolean;
};

export type PasswordRegisterDto = {
  email: string;
  displayName: string;
  password: string;
};

export type PasswordLoginDto = {
  email: string;
  password: string;
};

export type AuthResponseDto = {
  success: boolean;
  message: string;
  previewUrl?: string;
};

export type SessionUserDto = {
  id: string;
  email: string;
  displayName?: string | null;
};

export type ReflectionPayload = {
  id: string;
  status: "pending" | "completed" | "failed";
  summary?: string | null;
  moodInterpretation?: string | null;
  themes: string[];
  prompts: string[];
  suggestedTags: string[];
  errorMessage?: string | null;
  createdAt: string;
};

export type EntryDto = {
  id: string;
  title: string;
  body: string;
  moodScore?: number | null;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  reflectedAt?: string | null;
  tags: string[];
  latestReflection?: ReflectionPayload | null;
};

export type CreateEntryDto = {
  title: string;
  body: string;
  moodScore?: number | null;
  isDraft?: boolean;
};

export type UpdateEntryDto = Partial<CreateEntryDto>;

export type EntryFiltersDto = {
  q?: string;
  tag?: string;
  moodMin?: number;
  moodMax?: number;
  from?: string;
  to?: string;
  includeDrafts?: boolean;
};

export type UpdateEntryTagsDto = {
  tags: string[];
};

export type MoodPointDto = {
  date: string;
  moodScore: number;
};

export type WeeklySummaryDto = {
  weekStart: string;
  entries: number;
  averageMood: number | null;
};

export type InsightSummaryDto = {
  totalEntries: number;
  averageMood: number | null;
  topThemes: Array<{ label: string; count: number }>;
  writingStreakDays: number;
  recentPrompts: string[];
  moodTimeline: MoodPointDto[];
  weeklySummaries: WeeklySummaryDto[];
  draftCount: number;
};

export type ChatMessageDto = {
  id: string;
  role: "user" | "assistant";
  content: string;
  relatedEntryId?: string | null;
  createdAt: string;
};

export type ChatThreadDto = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessageDto[];
};

export type SendChatMessageDto = {
  threadId?: string;
  message: string;
  relatedEntryId?: string;
};

export type ReminderSettingDto = {
  enabled: boolean;
  hour: number;
  timezone: string;
};
