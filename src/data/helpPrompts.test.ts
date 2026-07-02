import { describe, expect, it } from "vitest";
import {
  getTotalPromptCount,
  helpPromptCategories,
  requiredCategoryIds,
} from "./helpPrompts";

describe("helpPromptCategories", () => {
  it("includes at least 80 prompts in total", () => {
    expect(getTotalPromptCount()).toBeGreaterThanOrEqual(80);
  });

  it("counts every prompt across categories", () => {
    const manualTotal = helpPromptCategories
      .map((category) => category.prompts.length)
      .reduce((sum, count) => sum + count, 0);

    expect(getTotalPromptCount()).toBe(manualTotal);
  });

  it.each(requiredCategoryIds)("includes required category %s with 5+ examples", (id) => {
    const category = helpPromptCategories.find((entry) => entry.id === id);

    expect(category).toBeDefined();
    expect(category!.prompts.length).toBeGreaterThanOrEqual(5);
  });

  it("has unique category ids", () => {
    const ids = helpPromptCategories.map((category) => category.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has no duplicate prompts within a category", () => {
    for (const category of helpPromptCategories) {
      expect(new Set(category.prompts).size).toBe(category.prompts.length);
    }
  });

  it("links every category to a provider limitation note", () => {
    for (const category of helpPromptCategories) {
      expect(category.limitationNote.trim().length).toBeGreaterThan(0);
    }
  });
});
