import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__brand">
          <div className="app-shell__brand-text">
            <h1>RoadMuse</h1>
            <p>AI-assisted route planning for modern road trips</p>
          </div>
          <img
            className="app-shell__logo"
            src={`${import.meta.env.BASE_URL}roadmuse-logo.png`}
            alt="RoadMuse logo"
          />
        </div>
      </header>

      <main className="app-shell__content">{children}</main>

      <BottomNav />
    </div>
  );
}
