"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { EntryDto, EntryFiltersDto, SessionUserDto } from "@ai-diary/types";
import { Button, Card } from "@ai-diary/ui";
import { AppShell } from "./app-shell";
import { EntryComposer } from "./entry-composer";
import { EntryFilters } from "./entry-filters";
import { EntryReflectionCard } from "./entry-reflection-card";
import { getMe, listEntries } from "../lib/api";

export function DashboardClient() {
  const [user, setUser] = useState<SessionUserDto | null>(null);
  const [entries, setEntries] = useState<EntryDto[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<EntryDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EntryFiltersDto>({ includeDrafts: true });

  async function load(nextFilters: EntryFiltersDto = filters) {
    try {
      const [sessionUser, userEntries] = await Promise.all([
        getMe(),
        listEntries(nextFilters),
      ]);
      setUser(sessionUser);
      setEntries(userEntries);
      setSelectedEntry((current) => current ?? userEntries[0] ?? null);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load app");
    }
  }

  useEffect(() => {
    void load(filters);
  }, [filters]);

  if (error) {
    return (
      <main className="page-shell">
        <Card className="panel-pad">
          <h2>Session required</h2>
          <p className="muted">{error}</p>
          <Link href="/auth">
            <Button>Go to sign in</Button>
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <AppShell userEmail={user?.email}>
      <section className="app-grid">
        <div className="stack">
          <EntryFilters onApply={setFilters} />
          <EntryComposer
            onSaved={(entry) => {
              setEntries((current) => [entry, ...current.filter((item) => item.id !== entry.id)]);
              setSelectedEntry(entry);
            }}
          />
          <Card className="panel-pad">
            <div className="topbar" style={{ marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0 }}>Recent entries</h2>
                <p className="muted">Your journal history stays attached to your account.</p>
              </div>
            </div>
            <div className="entry-list">
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  className={`ui-card entry-item ${selectedEntry?.id === entry.id ? "active" : ""}`}
                  onClick={() => setSelectedEntry(entry)}
                  style={{ textAlign: "left" }}
                >
                  <div className="entry-meta">
                    <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                    {entry.moodScore ? <span>Mood {entry.moodScore}/10</span> : null}
                    {entry.isDraft ? <span>Draft</span> : null}
                  </div>
                  <h3>{entry.title}</h3>
                  <p className="muted">{entry.body.slice(0, 160)}</p>
                </button>
              ))}
              {entries.length === 0 ? (
                <p className="muted">No entries yet. Start with a quick reflection above.</p>
              ) : null}
            </div>
          </Card>
        </div>
        <div className="stack">
          {selectedEntry ? (
            <>
              <EntryReflectionCard
                entry={selectedEntry}
                onChanged={(entry) => {
                  setSelectedEntry(entry);
                  setEntries((current) =>
                    current.map((item) => (item.id === entry.id ? entry : item)),
                  );
                }}
              />
              <Link href={`/app/entries/${selectedEntry.id}`}>
                <Button variant="secondary">Open full editor</Button>
              </Link>
              <Link href="/app/chat">
                <Button variant="secondary">Talk to coach</Button>
              </Link>
            </>
          ) : (
            <Card className="panel-pad">
              <h2>No entry selected</h2>
              <p className="muted">Create your first entry to unlock reflections.</p>
            </Card>
          )}
        </div>
      </section>
    </AppShell>
  );
}
