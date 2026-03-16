"use client";

import { useState } from "react";
import type { EntryFiltersDto } from "@ai-diary/types";
import { Button, Card, Field, Input } from "@ai-diary/ui";

export function EntryFilters({
  onApply,
}: {
  onApply: (filters: EntryFiltersDto) => void;
}) {
  const [filters, setFilters] = useState<EntryFiltersDto>({ includeDrafts: true });

  return (
    <Card className="panel-pad">
      <div className="stack">
        <h2 style={{ margin: 0 }}>Filters</h2>
        <Field>
          Search
          <Input
            value={filters.q ?? ""}
            onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
          />
        </Field>
        <div className="two-up">
          <Field>
            Tag
            <Input
              value={filters.tag ?? ""}
              onChange={(event) =>
                setFilters((current) => ({ ...current, tag: event.target.value }))
              }
            />
          </Field>
          <Field>
            Include drafts
            <select
              className="ui-input"
              value={filters.includeDrafts ? "true" : "false"}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  includeDrafts: event.target.value === "true",
                }))
              }
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </Field>
        </div>
        <Button type="button" onClick={() => onApply(filters)}>
          Apply filters
        </Button>
      </div>
    </Card>
  );
}
