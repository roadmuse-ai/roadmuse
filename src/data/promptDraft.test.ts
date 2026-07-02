import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPromptDraft,
  loadPromptDraft,
  promptDraftStorageKey,
  savePromptDraft,
} from "./promptDraft";

describe("promptDraft", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("returns an empty string when no draft is stored", () => {
    expect(loadPromptDraft()).toBe("");
  });

  it("saves and loads a trimmed draft", () => {
    savePromptDraft("  Take me home.  ");

    expect(loadPromptDraft()).toBe("Take me home.");
    expect(window.localStorage.getItem(promptDraftStorageKey)).toBe("Take me home.");
  });

  it("removes the stored draft when saving empty text", () => {
    savePromptDraft("Take me home.");
    savePromptDraft("   ");

    expect(window.localStorage.getItem(promptDraftStorageKey)).toBeNull();
    expect(loadPromptDraft()).toBe("");
  });

  it("clears the draft", () => {
    savePromptDraft("Take me home.");
    clearPromptDraft();

    expect(loadPromptDraft()).toBe("");
  });

  it("falls back to empty string when storage reads fail", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(loadPromptDraft()).toBe("");
  });

  it("ignores storage write failures", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => savePromptDraft("Take me home.")).not.toThrow();
  });
});
