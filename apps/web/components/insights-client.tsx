"use client";

import { useEffect, useState } from "react";
import type { InsightSummaryDto, SessionUserDto } from "@ai-diary/types";
import { Card } from "@ai-diary/ui";
import { AppShell } from "./app-shell";
import { getInsightsSummary, getMe } from "../lib/api";

export function InsightsClient() {
  const [user, setUser] = useState<SessionUserDto | null>(null);
  const [summary, setSummary] = useState<InsightSummaryDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMe(), getInsightsSummary()])
      .then(([sessionUser, insightSummary]) => {
        setUser(sessionUser);
        setSummary(insightSummary);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load insights");
      });
  }, []);

  return (
    <AppShell userEmail={user?.email}>
      <div className="stack">
        <div>
          <h1 className="section-title" style={{ fontSize: "3.4rem" }}>
            Insight ledger
          </h1>
          <p className="muted">
            Persisted trends from your entries and completed reflections.
          </p>
        </div>
        {error ? (
          <Card className="panel-pad">
            <p className="muted">{error}</p>
          </Card>
        ) : null}
        {summary ? (
          <>
            <div className="insight-stats">
              <Card className="stat ui-card">
                Entries
                <strong>{summary.totalEntries}</strong>
              </Card>
              <Card className="stat ui-card">
                Average mood
                <strong>{summary.averageMood ?? "-"}</strong>
              </Card>
              <Card className="stat ui-card">
                Streak
                <strong>{summary.writingStreakDays} days</strong>
              </Card>
              <Card className="stat ui-card">
                Drafts
                <strong>{summary.draftCount}</strong>
              </Card>
            </div>
            <section className="app-grid">
              <Card className="panel-pad">
                <h2>Top themes</h2>
                <div className="stack">
                  {summary.topThemes.map((theme) => (
                    <div key={theme.label} className="entry-meta">
                      <span>{theme.label}</span>
                      <strong>{theme.count}</strong>
                    </div>
                  ))}
                  {summary.topThemes.length === 0 ? (
                    <p className="muted">Generate reflections to accumulate themes.</p>
                  ) : null}
                </div>
              </Card>
              <Card className="panel-pad">
                <h2>Recent prompts</h2>
                <div className="stack">
                  {summary.recentPrompts.map((prompt) => (
                    <div key={prompt} className="tag">
                      {prompt}
                    </div>
                  ))}
                  {summary.recentPrompts.length === 0 ? (
                    <p className="muted">Prompts will appear here after reflections run.</p>
                  ) : null}
                </div>
              </Card>
            </section>
            <section className="app-grid">
              <Card className="panel-pad">
                <h2>Mood timeline</h2>
                <div className="stack">
                  {summary.moodTimeline.map((point) => (
                    <div key={point.date} className="entry-meta">
                      <span>{new Date(point.date).toLocaleDateString()}</span>
                      <strong>{point.moodScore}/10</strong>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="panel-pad">
                <h2>Weekly summaries</h2>
                <div className="stack">
                  {summary.weeklySummaries.map((item) => (
                    <div key={item.weekStart} className="entry-meta">
                      <span>{new Date(item.weekStart).toLocaleDateString()}</span>
                      <span>{item.entries} entries</span>
                      <strong>{item.averageMood ?? "-"}</strong>
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
