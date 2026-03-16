import type {
  AuthRequestDto,
  AuthResponseDto,
  ChatThreadDto,
  CreateEntryDto,
  EntryDto,
  EntryFiltersDto,
  InsightSummaryDto,
  PasswordLoginDto,
  PasswordRegisterDto,
  ReflectionPayload,
  ReminderSettingDto,
  SendChatMessageDto,
  SessionUserDto,
  UpdateEntryDto,
  UpdateEntryTagsDto,
} from "@ai-diary/types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function requestMagicLink(payload: AuthRequestDto) {
  return request<AuthResponseDto>("/auth/request-link", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerWithPassword(payload: PasswordRegisterDto) {
  return request<{ success: boolean }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginWithPassword(payload: PasswordLoginDto) {
  return request<{ success: boolean }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMe() {
  return request<SessionUserDto>("/me");
}

export function listEntries(filters?: EntryFiltersDto) {
  const params = new URLSearchParams();
  if (filters?.q) params.set("q", filters.q);
  if (filters?.tag) params.set("tag", filters.tag);
  if (filters?.moodMin != null) params.set("moodMin", String(filters.moodMin));
  if (filters?.moodMax != null) params.set("moodMax", String(filters.moodMax));
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);
  if (filters?.includeDrafts) params.set("includeDrafts", "true");
  const qs = params.toString();
  return request<EntryDto[]>(`/entries${qs ? `?${qs}` : ""}`);
}

export function getEntry(id: string) {
  return request<EntryDto>(`/entries/${id}`);
}

export function createEntry(payload: CreateEntryDto) {
  return request<EntryDto>("/entries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateEntry(id: string, payload: UpdateEntryDto) {
  return request<EntryDto>(`/entries/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteEntry(id: string) {
  return request<{ success: boolean }>(`/entries/${id}`, {
    method: "DELETE",
  });
}

export function reflectEntry(id: string) {
  return request<ReflectionPayload>(`/entries/${id}/reflect`, {
    method: "POST",
  });
}

export function listReflections(id: string) {
  return request<ReflectionPayload[]>(`/entries/${id}/reflections`);
}

export function updateEntryTags(id: string, payload: UpdateEntryTagsDto) {
  return request<EntryDto>(`/entries/${id}/tags`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getInsightsSummary() {
  return request<InsightSummaryDto>("/insights/summary");
}

export function logout() {
  return request<{ success: boolean }>("/auth/logout", { method: "POST" });
}

export function listChatThreads() {
  return request<ChatThreadDto[]>("/chat/threads");
}

export function sendChatMessage(payload: SendChatMessageDto) {
  return request<ChatThreadDto>("/chat/messages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getReminderSetting() {
  return request<ReminderSettingDto>("/settings/reminders");
}

export function updateReminderSetting(payload: ReminderSettingDto) {
  return request<ReminderSettingDto>("/settings/reminders", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
