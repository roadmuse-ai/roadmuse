export const themeModes = ["light", "auto", "dark"] as const;
export const accentThemes = ["ground", "navy", "rock", "patriotic"] as const;

export type ThemeMode = (typeof themeModes)[number];
export type AccentTheme = (typeof accentThemes)[number];

export type EffectiveTheme = "light" | "dark";

export const themeModeLabels: Record<ThemeMode, string> = {
  light: "Light",
  auto: "Auto",
  dark: "Dark",
};

export const accentThemeLabels: Record<AccentTheme, string> = {
  ground: "Ground",
  navy: "Navy",
  rock: "Rock",
  patriotic: "July 4th",
};

export const isThemeMode = (value: unknown): value is ThemeMode => {
  return typeof value === "string" && (themeModes as readonly string[]).includes(value);
};

export const isAccentTheme = (value: unknown): value is AccentTheme => {
  return typeof value === "string" && (accentThemes as readonly string[]).includes(value);
};

export function getSystemTheme(): EffectiveTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }

  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function resolveEffectiveTheme(mode: ThemeMode): EffectiveTheme {
  return mode === "auto" ? getSystemTheme() : mode;
}
