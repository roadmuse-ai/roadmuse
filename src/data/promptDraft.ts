export const promptDraftStorageKey = "roadmuse-prompt-draft-v1";

/**
 * Temporary holding slot for a help example the user wants in the main
 * prompt. The main route-planning input (a later story) will read and
 * consume this draft; until then MainScreen displays it as a draft card.
 */
export function loadPromptDraft(): string {
  if (typeof window === "undefined" || !("localStorage" in window)) {
    return "";
  }

  try {
    return window.localStorage.getItem(promptDraftStorageKey) ?? "";
  } catch {
    return "";
  }
}

export function savePromptDraft(text: string): void {
  if (typeof window === "undefined" || !("localStorage" in window)) {
    return;
  }

  try {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      window.localStorage.removeItem(promptDraftStorageKey);
    } else {
      window.localStorage.setItem(promptDraftStorageKey, trimmed);
    }
  } catch {
    // Ignore write failures in restricted or private environments.
  }
}

export function clearPromptDraft(): void {
  savePromptDraft("");
}
