"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input } from "@ai-diary/ui";
import { loginWithPassword, registerWithPassword, requestMagicLink } from "../lib/api";

export function AuthForm({ mode = "signin" }: { mode?: "signin" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await requestMagicLink({
        email,
        ...(mode === "register" ? { displayName, isRegistration: true } : {}),
      });
      setMessage(response.message);
      if (response.previewUrl) {
        const parsed = new URL(response.previewUrl);
        setPreviewUrl(`${parsed.pathname}${parsed.search}`);
      } else {
        setPreviewUrl(null);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send magic link");
    } finally {
      setLoading(false);
    }
  }

  async function onPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === "register") {
        await registerWithPassword({
          email,
          displayName,
          password,
        });
      } else {
        await loginWithPassword({
          email,
          password,
        });
      }
      router.push("/app");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to continue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="panel-pad" style={{ maxWidth: 620 }}>
      <div className="stack">
        <div>
          <h1 className="section-title" style={{ fontSize: "3.2rem" }}>
            {mode === "register" ? "Start your diary." : "Come back to yourself."}
          </h1>
          <p className="muted">
            {mode === "register"
              ? "Create your account with a magic link, then start journaling and generating reflections."
              : "Request a magic link to sign in and continue journaling."}
          </p>
        </div>
        <form className="stack" onSubmit={onPasswordSubmit}>
          <strong>{mode === "register" ? "Create with password" : "Sign in with password"}</strong>
          {mode === "register" ? (
            <Field>
              Display name
              <Input
                placeholder="What should we call you?"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
              />
            </Field>
          ) : null}
          <Field>
            Email
            <Input
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>
          <Field>
            Password
            <Input
              placeholder="At least 8 characters"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>
          <Button disabled={loading}>
            {loading ? "Working..." : mode === "register" ? "Create account" : "Sign in"}
          </Button>
        </form>
        <Card className="panel-pad">
          <form className="stack" onSubmit={onSubmit}>
            <strong>{mode === "register" ? "Or use a magic link" : "Prefer a magic link?"}</strong>
            {mode === "register" ? (
              <Field>
                Display name
                <Input
                  placeholder="What should we call you?"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                />
              </Field>
            ) : null}
            <Field>
              Email
              <Input
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </Field>
            {mode === "register" ? (
              <p className="muted">
                Private journal entries, AI reflections, coach chat, trends, drafts, and exportable history.
              </p>
            ) : null}
            <Button disabled={loading} variant="secondary">
              {loading ? "Sending..." : "Send magic link"}
            </Button>
          </form>
        </Card>
        {message ? <p className="muted">{message}</p> : null}
        {previewUrl ? (
          <a className="muted" href={previewUrl}>
            Open magic link
          </a>
        ) : null}
        <p className="muted">
          {mode === "register" ? (
            <>
              Already have an account? <a href="/auth">Sign in</a>
            </>
          ) : (
            <>
              New here? <a href="/register">Create an account</a>
            </>
          )}
        </p>
      </div>
    </Card>
  );
}
