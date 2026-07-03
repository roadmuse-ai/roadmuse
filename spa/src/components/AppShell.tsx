import { ReactNode, useEffect } from "react";
import { useSettings } from "../context/SettingsContext";
import { useEffectiveTheme } from "../hooks/useEffectiveTheme";
import { BottomNav } from "./BottomNav";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { settings } = useSettings();
  const effectiveTheme = useEffectiveTheme(settings.themeMode);

  useEffect(() => {
    // Set on <html> so fixed overlays and native controls follow the theme too.
    document.documentElement.dataset.theme = effectiveTheme;
    document.documentElement.dataset.accentTheme = settings.accentTheme;
    document.documentElement.style.colorScheme = effectiveTheme;
  }, [effectiveTheme, settings.accentTheme]);

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__brand">
          <div className="app-shell__brand-text">
            <h1>
              Road<span className="app-shell__brand-accent">Muse</span>
            </h1>
            <p>AI route planning for smarter road trips</p>
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
