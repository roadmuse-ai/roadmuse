import { render, screen, within } from "@testing-library/react";
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

  it("renders the voice-first main route without settings summary content", () => {
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
    expect(
      screen.getByRole("button", { name: "Start Voice Request" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Apple Maps")).not.toBeInTheDocument();
    expect(screen.queryByText("Home, Work")).not.toBeInTheDocument();
    expect(screen.queryByText("Avoid tolls")).not.toBeInTheDocument();
    expect(screen.queryByText("Prefer scenic routes")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start planning a route" }))
      .not.toBeInTheDocument();
  });

  it("navigates from help to the navigator comparison", async () => {
    const user = userEvent.setup();
    renderApp("/help");

    const helpBreadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(helpBreadcrumb).getByText("Help")).toBeInTheDocument();
    expect(within(helpBreadcrumb).queryByRole("link", { name: "Help" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Navigator Comparison" }));

    const comparisonBreadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(comparisonBreadcrumb).getByRole("link", { name: "Help" })).toBeInTheDocument();
    expect(within(comparisonBreadcrumb).getByText("Navigator Comparison")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Navigator Capability Matrix" }),
    ).toBeInTheDocument();
  });

  it("redirects unknown routes to the main route", () => {
    renderApp("/missing");

    expect(
      screen.getByRole("button", { name: "Start Voice Request" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Current Settings")).not.toBeInTheDocument();
  });

  it("applies the saved theme mode and accent theme to the document", async () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ themeMode: "dark", accentTheme: "navy" }),
    );

    renderApp("/config");

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.dataset.accentTheme).toBe("navy");
    expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Air" })).toBeChecked();

    const user = userEvent.setup();
    await user.click(screen.getByRole("radio", { name: "Light" }));

    expect(document.documentElement.dataset.theme).toBe("light");

    await user.click(screen.getByRole("radio", { name: "7/4" }));

    expect(document.documentElement.dataset.accentTheme).toBe("patriotic");
  });

  it("defaults to system theme mode resolved as light without system dark preference", () => {
    renderApp("/config");

    expect(screen.getByRole("radio", { name: "System" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "7/4" })).toBeChecked();
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.dataset.accentTheme).toBe("patriotic");
  });
});
