import Link from "next/link";
import { Button, Card } from "@ai-diary/ui";

export default function HomePage() {
  return (
    <main className="page-shell">
      <div className="topbar">
        <div className="brand">AI Diary</div>
        <div className="nav-links">
          <Link href="/auth">
            <Button variant="secondary">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button variant="secondary">Register</Button>
          </Link>
          <Link href="/app">
            <Button>Open app</Button>
          </Link>
        </div>
      </div>

      <section className="hero">
        <span className="muted">Private reflection coach</span>
        <h1>Turn raw journal entries into usable insight.</h1>
        <p>
          Write freely, score your mood, then generate a reflection that pulls out
          themes, prompts, and patterns worth noticing over time.
        </p>
      </section>

      <section className="marketing-grid">
        <Card className="panel-pad">
          <h3>Write first</h3>
          <p className="muted">
            Entry creation is fast and never blocked on AI latency.
          </p>
        </Card>
        <Card className="panel-pad">
          <h3>Reflect on demand</h3>
          <p className="muted">
            Generate a concise summary, mood read, and follow-up prompts only when you
            want them.
          </p>
        </Card>
        <Card className="panel-pad">
          <h3>See patterns</h3>
          <p className="muted">
            Insights come from persisted reflections and diary history, not fragile
            one-off prompts.
          </p>
        </Card>
      </section>
    </main>
  );
}
