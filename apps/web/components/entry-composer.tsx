"use client";

import { FormEvent, useState } from "react";
import type { EntryDto } from "@ai-diary/types";
import { Button, Card, Field, Input, Textarea } from "@ai-diary/ui";
import { createEntry } from "../lib/api";

export function EntryComposer({ onSaved }: { onSaved: (entry: EntryDto) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [moodScore, setMoodScore] = useState("5");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const entry = await createEntry({
        title,
        body,
        moodScore: Number(moodScore),
        isDraft: true,
      });
      onSaved(entry);
      setTitle("");
      setBody("");
      setMoodScore("5");
      setStatus("Saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save entry");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="panel-pad">
      <form className="stack" onSubmit={onSubmit}>
        <div>
          <h2 style={{ margin: 0 }}>Quick capture</h2>
          <p className="muted">
            Save first. Reflection can happen separately when the entry is ready.
          </p>
        </div>
        <Field>
          Title
          <Input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </Field>
        <Field>
          Body
          <Textarea value={body} onChange={(event) => setBody(event.target.value)} required />
        </Field>
        <div className="two-up">
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
          <div style={{ alignSelf: "end" }}>
            <Button disabled={saving}>{saving ? "Saving..." : "Save entry"}</Button>
          </div>
        </div>
        {status ? <p className="muted">{status}</p> : null}
      </form>
    </Card>
  );
}
