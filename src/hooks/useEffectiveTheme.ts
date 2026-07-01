import { useEffect, useState } from "react";
import {
  type EffectiveTheme,
  type ThemeMode,
  resolveEffectiveTheme,
} from "../data/theme";

export function useEffectiveTheme(mode: ThemeMode): EffectiveTheme {
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() =>
    resolveEffectiveTheme(mode),
  );

  useEffect(() => {
    setEffectiveTheme(resolveEffectiveTheme(mode));

    if (mode !== "auto" || typeof window.matchMedia !== "function") {
      return;
    }

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setEffectiveTheme(event.matches ? "dark" : "light");
    };

    query.addEventListener("change", handleChange);
    return () => {
      query.removeEventListener("change", handleChange);
    };
  }, [mode]);

  return effectiveTheme;
}
