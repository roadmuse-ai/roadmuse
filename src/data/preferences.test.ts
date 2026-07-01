import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createEmptyPreference,
  getEnabledPreferences,
  isTextPreference,
  normalizeTextPreference,
  validatePreferenceLocally,
} from "./preferences";

describe("preferences helpers", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(1710000000000);
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates an empty enabled preference with unknown validation status", () => {
    expect(createEmptyPreference()).toEqual({
      id: "1710000000000-i",
      text: "",
      enabled: true,
      validationStatus: "unknown",
    });
  });

  it("returns only enabled preferences with non-empty text", () => {
    const preferences = [
      {
        id: "1",
        text: "Avoid tolls",
        enabled: true,
        validationStatus: "supported" as const,
      },
      {
        id: "2",
        text: "   ",
        enabled: true,
        validationStatus: "unknown" as const,
      },
      {
        id: "3",
        text: "Prefer scenic routes",
        enabled: false,
        validationStatus: "supported" as const,
      },
    ];

    expect(getEnabledPreferences(preferences)).toEqual([preferences[0]]);
  });

  it("validates preference shape and normalizes stored values", () => {
    expect(isTextPreference(null)).toBe(false);
    expect(isTextPreference({ id: 1, text: "x", enabled: true, validationStatus: "supported" })).toBe(
      false,
    );
    expect(
      isTextPreference({
        id: "pref-1",
        text: "Avoid tolls",
        enabled: true,
        validationStatus: "supported",
        validationExplanation: "  Saved  ",
      }),
    ).toBe(true);

    expect(
      normalizeTextPreference({
        id: "pref-1",
        text: "Avoid tolls",
        enabled: true,
        validationStatus: "not-real",
        validationExplanation: "  Saved  ",
      }),
    ).toEqual({
      id: "pref-1",
      text: "Avoid tolls",
      enabled: true,
      validationStatus: "unknown",
      validationExplanation: "Saved",
    });
  });

  it("returns supported for local validation placeholder", () => {
    expect(validatePreferenceLocally("Avoid tolls")).toEqual({
      status: "supported",
      explanation: "Preference saved. Full validation will run once the backend is connected.",
    });
  });
});
