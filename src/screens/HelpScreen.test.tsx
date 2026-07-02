import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { getTotalPromptCount, helpPromptCategories } from "../data/helpPrompts";
import { loadPromptDraft } from "../data/promptDraft";
import { HelpScreen } from "./HelpScreen";

function renderHelpScreen() {
  return render(
    <MemoryRouter initialEntries={["/help"]}>
      <Routes>
        <Route path="/help" element={<HelpScreen />} />
        <Route path="/" element={<div>Main route placeholder</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function openCategory(user: ReturnType<typeof userEvent.setup>, title: string) {
  await user.click(screen.getByText(title));
  return screen.getByText(title).closest("details")!;
}

describe("HelpScreen", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("renders every category with its prompt count and the total", () => {
    renderHelpScreen();

    expect(
      screen.getByText(new RegExp(`${getTotalPromptCount()} example prompts`)),
    ).toBeInTheDocument();

    for (const category of helpPromptCategories) {
      expect(screen.getByText(category.title)).toBeInTheDocument();
    }
  });

  it("links categories to the navigator comparison page", () => {
    renderHelpScreen();

    const providerLinks = screen.getAllByRole("link", { name: "Provider details" });
    expect(providerLinks).toHaveLength(helpPromptCategories.length);
    for (const link of providerLinks) {
      expect(link).toHaveAttribute("href", "/help/navigator-comparison");
    }
  });

  it("copies a prompt to the clipboard and shows feedback", async () => {
    const user = userEvent.setup();
    renderHelpScreen();

    const category = await openCategory(user, "Waze Search");
    const copyButton = within(category).getAllByRole("button", { name: "Copy" })[0];

    await user.click(copyButton);

    expect(copyButton).toHaveTextContent("Copied");
    await expect(navigator.clipboard.readText()).resolves.toBe(
      "Open Waze and search for Chabad Frederick.",
    );
  });

  it("keeps the Copy label when the clipboard is unavailable", async () => {
    const user = userEvent.setup();
    renderHelpScreen();

    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));

    const category = await openCategory(user, "Waze Search");
    const copyButton = within(category).getAllByRole("button", { name: "Copy" })[0];

    await user.click(copyButton);

    expect(copyButton).toHaveTextContent("Copy");
  });

  it("saves a draft and navigates to the main route on Use", async () => {
    const user = userEvent.setup();
    renderHelpScreen();

    const category = await openCategory(user, "Exact Route (GPX)");
    const useButton = within(category).getAllByRole("button", { name: "Use" })[0];

    await user.click(useButton);

    expect(screen.getByText("Main route placeholder")).toBeInTheDocument();
    expect(loadPromptDraft()).toBe("Export the exact route.");
  });
});
