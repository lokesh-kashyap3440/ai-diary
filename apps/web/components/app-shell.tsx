"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@ai-diary/ui";
import { logout } from "../lib/api";

export function AppShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/auth");
  }

  return (
    <main className="page-shell">
      <div className="topbar">
        <div>
          <div className="brand">AI Diary</div>
          <div className="muted">{userEmail ?? "Signed in"}</div>
        </div>
        <div className="nav-links">
          <Link href="/app">
            <Button variant={pathname === "/app" ? "primary" : "secondary"}>
              Dashboard
            </Button>
          </Link>
          <Link href="/app/insights">
            <Button
              variant={pathname?.startsWith("/app/insights") ? "primary" : "secondary"}
            >
              Insights
            </Button>
          </Link>
          <Link href="/app/chat">
            <Button variant={pathname?.startsWith("/app/chat") ? "primary" : "secondary"}>
              Chat
            </Button>
          </Link>
          <Link href="/app/settings">
            <Button
              variant={pathname?.startsWith("/app/settings") ? "primary" : "secondary"}
            >
              Settings
            </Button>
          </Link>
          <Button variant="ghost" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
      {children}
    </main>
  );
}
