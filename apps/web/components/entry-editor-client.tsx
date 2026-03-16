"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { EntryDto, SessionUserDto } from "@ai-diary/types";
import { Button, Card, Field, Input, Textarea } from "@ai-diary/ui";
import { AppShell } from "./app-shell";
import { EntryReflectionCard } from "./entry-reflection-card";
import { deleteEntry, getEntry, getMe, updateEntry } from "../lib/api";

export function EntryEditorClient({ entryId }: { entryId: string }) {
  const [user, setUser] = useState<SessionUserDto | null>(null);
  const [entry, setEntry] = useState<EntryDto | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [moodScore, setMoodScore] = useState("5");
  const [status, setStatus] = useState<string | null>(null);

  async function load() {
    const [sessionUser, currentEntry] = await Promise.all([getMe(), getEntry(entryId)]);
    setUser(sessionUser);
    setEntry(currentEntry);
    setTitle(currentEntry.title);
    setBody(currentEntry.body);
    setMoodScore(currentEntry.moodScore?.toString() ?? "5");
  }

  useEffect(() => {
    void load().catch((error) => {
      setStatus(error instanceof Error ? error.message : "Unable to load entry");
    });
  }, [entryId]);

  useEffect(() => {
    if (!entry) return;
    const handle = setTimeout(() => {
      void updateEntry(entryId, {
        title,
        body,
        moodScore: Number(moodScore),
        isDraft: true,
      })
        .then((updated) => {
          setEntry(updated);
          setStatus("Autosaved draft.");
        })
        .catch(() => {});
    }, 1200);

    return () => clearTimeout(handle);
  }, [title, body, moodScore, entryId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const updated = await updateEntry(entryId, {
        title,
        body,
        moodScore: Number(moodScore),
        isDraft: false,
      });
      setEntry(updated);
      setStatus("Entry updated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to update entry");
    }
  }

  async function onDelete() {
    await deleteEntry(entryId);
    window.location.href = "/app";
  }

  return (
    <AppShell userEmail={user?.email}>
      <section className="app-grid">
        <Card className="panel-pad">
          <form className="stack" onSubmit={onSubmit}>
            <div className="topbar" style={{ marginBottom: 0 }}>
              <div>
                <h2 style={{ margin: 0 }}>Entry editor</h2>
                <p className="muted">Refine the draft before generating a fresh reflection.</p>
              </div>
              <Link href="/app">
                <Button variant="secondary">Back</Button>
              </Link>
            </div>
            <Field>
              Title
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </Field>
            <Field>
              Body
              <Textarea value={body} onChange={(event) => setBody(event.target.value)} />
            </Field>
            <Field>
              Mood score
              <Input
                type="number"
                min={1}
                max={10}
                value={moodScore}
                onChange={(event) => setMoodScore(event.target.value)}
              />
            </Field>
            <div className="nav-links">
              <Button>Save changes</Button>
              <Button type="button" variant="ghost" onClick={onDelete}>
                Delete entry
              </Button>
            </div>
            {status ? <p className="muted">{status}</p> : null}
          </form>
        </Card>
        {entry ? (
          <EntryReflectionCard entry={entry} onChanged={setEntry} />
        ) : (
          <Card className="panel-pad">
            <p className="muted">Loading entry...</p>
          </Card>
        )}
      </section>
    </AppShell>
  );
}
