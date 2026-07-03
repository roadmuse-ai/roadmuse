import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { BottomNav } from "./BottomNav";

describe("BottomNav", () => {
  it("shows config, main, then help and selects main by default", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <BottomNav />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("link").map((link) => link.getAttribute("aria-label"))).toEqual([
      "Config",
      "Main",
      "Help",
    ]);
    expect(screen.getByRole("link", { name: "Main" })).toHaveClass("active");
  });

  it("marks the current route active", () => {
    render(
      <MemoryRouter initialEntries={["/config"]}>
        <BottomNav />
      </MemoryRouter>,
    );

    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Config" })).toHaveClass("active");
    expect(screen.getByRole("link", { name: "Main" })).not.toHaveClass("active");
  });
});
