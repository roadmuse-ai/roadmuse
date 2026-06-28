import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <h1>RoadMuse</h1>
        <p>AI-assisted route planning for modern road trips</p>
      </header>

      <main className="app-shell__content">{children}</main>

      <BottomNav />
    </div>
  );
}
