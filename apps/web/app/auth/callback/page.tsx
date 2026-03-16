"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card } from "@ai-diary/ui";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Verifying magic link...");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("Missing token.");
      return;
    }

    const redirectTo = `${window.location.origin}/app`;
    const target = `/api/auth/verify?token=${encodeURIComponent(token)}&redirectTo=${encodeURIComponent(
      redirectTo,
    )}`;
    window.location.replace(target);
  }, [searchParams]);

  return (
    <main className="page-shell">
      <Card className="panel-pad">
        <h1>Magic link</h1>
        <p className="muted">{status}</p>
        <Link href="/auth">
          <Button variant="secondary">Back to sign in</Button>
        </Link>
      </Card>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<main className="page-shell"><Card className="panel-pad"><p className="muted">Loading callback...</p></Card></main>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
