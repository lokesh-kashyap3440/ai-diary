"use client";

import { FormEvent, useEffect, useState } from "react";
import type { ReminderSettingDto, SessionUserDto } from "@ai-diary/types";
import { Button, Card, Field, Input } from "@ai-diary/ui";
import { AppShell } from "./app-shell";
import { getMe, getReminderSetting, updateReminderSetting } from "../lib/api";

export function SettingsClient() {
  const [user, setUser] = useState<SessionUserDto | null>(null);
  const [settings, setSettings] = useState<ReminderSettingDto>({
    enabled: false,
    hour: 20,
    timezone: "UTC",
  });
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMe(), getReminderSetting()]).then(([sessionUser, reminder]) => {
      setUser(sessionUser);
      setSettings(reminder);
    });
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const saved = await updateReminderSetting(settings);
    setSettings(saved);
    setStatus("Reminder settings updated.");
  }

  return (
    <AppShell userEmail={user?.email}>
      <section className="app-grid">
        <Card className="panel-pad">
          <form className="stack" onSubmit={onSubmit}>
            <h2>Reminder settings</h2>
            <Field>
              Enabled
              <select
                className="ui-input"
                value={settings.enabled ? "true" : "false"}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    enabled: event.target.value === "true",
                  }))
                }
              >
                <option value="false">Off</option>
                <option value="true">On</option>
              </select>
            </Field>
            <Field>
              Hour
              <Input
                type="number"
                min={0}
                max={23}
                value={settings.hour}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, hour: Number(event.target.value) }))
                }
              />
            </Field>
            <Field>
              Timezone
              <Input
                value={settings.timezone}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, timezone: event.target.value }))
                }
              />
            </Field>
            <Button>Save settings</Button>
            {status ? <p className="muted">{status}</p> : null}
          </form>
        </Card>
        <Card className="panel-pad">
          <h2>Export</h2>
          <p className="muted">Download your diary data as JSON.</p>
          <a href="/api/export/json">
            <Button variant="secondary">Download export</Button>
          </a>
        </Card>
      </section>
    </AppShell>
  );
}
