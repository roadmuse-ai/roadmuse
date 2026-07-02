import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { storageKey } from "./data/settings";
import App from "./App";

function renderApp(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );
}

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("renders saved settings on the main route", () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        preferredNavigator: "apple-maps",
        savedPlaces: [
          { id: "home", label: "Home", address: "123 Main St" },
          { id: "work", label: "Work", address: "456 Center Ave" },
        ],
        preferences: [
          {
            id: "pref-1",
            text: "Avoid tolls",
            enabled: true,
            validationStatus: "supported",
          },
          {
            id: "pref-2",
            text: "Prefer scenic routes",
            enabled: false,
            validationStatus: "supported",
          },
        ],
      }),
    );

    renderApp("/");

    expect(screen.getByRole("heading", { name: "RoadMuse" })).toBeInTheDocument();
    expect(screen.getByText("AI route planning for smarter road trips")).toBeInTheDocument();
    expect(screen.getByText("Apple Maps")).toBeInTheDocument();
    expect(screen.getByText("Home, Work")).toBeInTheDocument();
    expect(screen.getByText("Avoid tolls")).toBeInTheDocument();
    expect(screen.queryByText("Prefer scenic routes")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start planning a route" })).toBeInTheDocument();
  });

  it("navigates from help to the navigator comparison", async () => {
    const user = userEvent.setup();
    renderApp("/help");

    await user.click(screen.getByRole("link", { name: "Navigator Comparison" }));

    expect(
      screen.getByRole("heading", { name: "Navigator Capability Matrix" }),
    ).toBeInTheDocument();
  });

  it("redirects unknown routes to the main route", () => {
    renderApp("/missing");

    expect(screen.getByRole("heading", { name: "Current Settings" })).toBeInTheDocument();
    expect(screen.getByText("Saved Places")).toBeInTheDocument();
    expect(screen.getByText("Active Preferences")).toBeInTheDocument();
    expect(screen.getAllByText("None yet")).toHaveLength(2);
  });

  it("applies the saved theme mode to the document", async () => {
    window.localStorage.setItem(storageKey, JSON.stringify({ themeMode: "dark" }));

    renderApp("/config");

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked();

    const user = userEvent.setup();
    await user.click(screen.getByRole("radio", { name: "Light" }));

    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("defaults to auto theme mode resolved as light without system dark preference", () => {
    renderApp("/config");

    expect(screen.getByRole("radio", { name: "Auto" })).toBeChecked();
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
