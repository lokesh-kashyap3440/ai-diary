"use client";

import type { EntryDto, ReflectionPayload } from "@ai-diary/types";
import { Button, Card } from "@ai-diary/ui";
import { listReflections, reflectEntry, updateEntryTags } from "../lib/api";
import { useEffect, useState } from "react";

export function EntryReflectionCard({
  entry,
  onChanged,
}: {
  entry: EntryDto;
  onChanged: (entry: EntryDto) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [history, setHistory] = useState<ReflectionPayload[]>([]);
  const [tagDraft, setTagDraft] = useState(entry.tags.join(", "));

  useEffect(() => {
    setTagDraft(entry.tags.join(", "));
    listReflections(entry.id).then(setHistory).catch(() => setHistory([]));
  }, [entry.id, entry.tags]);

  async function handleReflect() {
    setLoading(true);
    setStatus(null);

    try {
      const reflection = await reflectEntry(entry.id);
      const reflections = await listReflections(entry.id);
      onChanged({
        ...entry,
        reflectedAt: reflection.createdAt,
        tags: reflection.suggestedTags,
        latestReflection: reflection,
      });
      setHistory(reflections);
      setStatus("Reflection updated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to reflect on entry");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="panel-pad">
      <div className="stack">
        <div>
          <div className="entry-meta">
            <span>{new Date(entry.updatedAt).toLocaleString()}</span>
            {entry.moodScore ? <span>Mood {entry.moodScore}/10</span> : null}
          </div>
          <h2 style={{ marginBottom: 8 }}>{entry.title}</h2>
          <p className="muted">{entry.body}</p>
        </div>
        <div className="tag-row">
          {entry.tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
        <div className="stack">
          <input
            className="ui-input"
            value={tagDraft}
            onChange={(event) => setTagDraft(event.target.value)}
            placeholder="tag1, tag2"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              const updated = await updateEntryTags(entry.id, {
                tags: tagDraft.split(","),
              });
              onChanged(updated);
            }}
          >
            Save tags
          </Button>
        </div>
        <Button onClick={handleReflect} disabled={loading}>
          {loading ? "Generating..." : "Generate reflection"}
        </Button>
        {status ? <p className="muted">{status}</p> : null}
        {entry.latestReflection ? (
          <div className="stack">
            <Card className="panel-pad">
              <h3>Summary</h3>
              <p className="muted">{entry.latestReflection.summary}</p>
            </Card>
            <Card className="panel-pad">
              <h3>Mood interpretation</h3>
              <p className="muted">{entry.latestReflection.moodInterpretation}</p>
            </Card>
            <Card className="panel-pad">
              <h3>Reflective prompts</h3>
              <div className="stack">
                {entry.latestReflection.prompts.map((prompt) => (
                  <div key={prompt} className="tag">
                    {prompt}
                  </div>
                ))}
              </div>
            </Card>
            <Card className="panel-pad">
              <h3>Reflection history</h3>
              <div className="stack">
                {history.map((item) => (
                  <div key={item.id}>
                    <strong>{new Date(item.createdAt).toLocaleString()}</strong>
                    <p className="muted">{item.summary}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <p className="muted">No reflection yet.</p>
        )}
      </div>
    </Card>
  );
}
