"use client";

import { FormEvent, useEffect, useState } from "react";
import type { ChatThreadDto, EntryDto, SessionUserDto } from "@ai-diary/types";
import { Button, Card, Field, Input } from "@ai-diary/ui";
import { AppShell } from "./app-shell";
import { listChatThreads, listEntries, sendChatMessage, getMe } from "../lib/api";

export function ChatClient() {
  const [user, setUser] = useState<SessionUserDto | null>(null);
  const [threads, setThreads] = useState<ChatThreadDto[]>([]);
  const [entries, setEntries] = useState<EntryDto[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThreadDto | null>(null);
  const [message, setMessage] = useState("");
  const [relatedEntryId, setRelatedEntryId] = useState("");

  useEffect(() => {
    Promise.all([getMe(), listChatThreads(), listEntries({ includeDrafts: true })]).then(
      ([sessionUser, chatThreads, userEntries]) => {
        setUser(sessionUser);
        setThreads(chatThreads);
        setEntries(userEntries);
        setSelectedThread(chatThreads[0] ?? null);
      },
    );
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!message.trim()) return;
    const thread = await sendChatMessage({
      threadId: selectedThread?.id,
      message,
      relatedEntryId: relatedEntryId || undefined,
    });
    setThreads((current) => [thread, ...current.filter((item) => item.id !== thread.id)]);
    setSelectedThread(thread);
    setMessage("");
  }

  return (
    <AppShell userEmail={user?.email}>
      <section className="app-grid">
        <Card className="panel-pad">
          <h2>Coach threads</h2>
          <div className="entry-list">
            {threads.map((thread) => (
              <button
                key={thread.id}
                className={`ui-card entry-item ${selectedThread?.id === thread.id ? "active" : ""}`}
                onClick={() => setSelectedThread(thread)}
              >
                <h3>{thread.title}</h3>
                <p className="muted">
                  {thread.messages[thread.messages.length - 1]?.content.slice(0, 120) ?? "Empty thread"}
                </p>
              </button>
            ))}
          </div>
        </Card>
        <Card className="panel-pad">
          <div className="stack">
            <div>
              <h2>Reflection chat</h2>
              <p className="muted">Talk through an entry or a pattern you are noticing.</p>
            </div>
            <div className="stack">
              {selectedThread?.messages.map((messageItem) => (
                <Card className="panel-pad" key={messageItem.id}>
                  <strong>{messageItem.role === "assistant" ? "Coach" : "You"}</strong>
                  <p className="muted">{messageItem.content}</p>
                </Card>
              )) ?? <p className="muted">Start a thread below.</p>}
            </div>
            <form className="stack" onSubmit={onSubmit}>
              <Field>
                Related entry
                <select
                  className="ui-input"
                  value={relatedEntryId}
                  onChange={(event) => setRelatedEntryId(event.target.value)}
                >
                  <option value="">None</option>
                  {entries.map((entry) => (
                    <option value={entry.id} key={entry.id}>
                      {entry.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                Message
                <Input value={message} onChange={(event) => setMessage(event.target.value)} />
              </Field>
              <Button>Send</Button>
            </form>
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
