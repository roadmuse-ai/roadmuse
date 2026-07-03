import { afterEach, describe, expect, it, vi } from "vitest";
import {
  accentThemeLabels,
  accentThemes,
  getSystemTheme,
  isAccentTheme,
  isThemeMode,
  resolveEffectiveTheme,
  themeModeLabels,
  themeModes,
} from "./theme";

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

describe("theme helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("recognizes valid theme modes only", () => {
    expect(isThemeMode("auto")).toBe(true);
    expect(isThemeMode("light")).toBe(true);
    expect(isThemeMode("dark")).toBe(true);
    expect(isThemeMode("sepia")).toBe(false);
    expect(isThemeMode(1)).toBe(false);
    expect(isThemeMode(undefined)).toBe(false);
  });

  it("keeps labels for every theme mode", () => {
    expect(Object.keys(themeModeLabels)).toEqual([...themeModes]);
  });

  it("recognizes accent themes and keeps their labels aligned", () => {
    expect(isAccentTheme("ground")).toBe(true);
    expect(isAccentTheme("navy")).toBe(true);
    expect(isAccentTheme("rock")).toBe(true);
    expect(isAccentTheme("patriotic")).toBe(true);
    expect(isAccentTheme("forest")).toBe(false);
    expect(Object.keys(accentThemeLabels)).toEqual([...accentThemes]);
  });

  it("reads the system color scheme through matchMedia", () => {
    stubMatchMedia(true);
    expect(getSystemTheme()).toBe("dark");

    stubMatchMedia(false);
    expect(getSystemTheme()).toBe("light");
  });

  it("defaults to light when matchMedia is unavailable or throws", () => {
    expect(getSystemTheme()).toBe("light");

    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation(() => {
        throw new Error("unsupported");
      }),
    );
    expect(getSystemTheme()).toBe("light");
  });

  it("resolves the effective theme from the saved mode", () => {
    expect(resolveEffectiveTheme("light")).toBe("light");
    expect(resolveEffectiveTheme("dark")).toBe("dark");

    stubMatchMedia(true);
    expect(resolveEffectiveTheme("auto")).toBe("dark");

    stubMatchMedia(false);
    expect(resolveEffectiveTheme("auto")).toBe("light");
  });
});
