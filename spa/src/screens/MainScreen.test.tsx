import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { SettingsProvider } from "../context/SettingsContext";
import { storageKey } from "../data/settings";
import { MainScreen } from "./MainScreen";

const routeCreatedAt = Date.UTC(2026, 6, 4, 13, 0);

function renderMainScreen() {
  return render(
    <MemoryRouter>
      <SettingsProvider>
        <MainScreen />
      </SettingsProvider>
    </MemoryRouter>,
  );
}

describe("MainScreen", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, "open").mockImplementation(() => null);
    vi.spyOn(Date, "now").mockReturnValue(routeCreatedAt);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("opens with the first-trip prompt and primary voice control", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    renderMainScreen();

    expect(screen.getByRole("heading", { name: "Dictate your first trip!" }))
      .toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start Voice Request" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "My Trips" }))
      .not.toBeInTheDocument();
    expect(screen.queryByLabelText("Search Previous Trips")).not.toBeInTheDocument();
    expect(screen.queryByText("Current Settings")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start planning a route" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Drive" })).not.toBeInTheDocument();
  });

  it("rotates the first-trip prompt while no trips are saved", () => {
    let intervalHandler: TimerHandler | undefined;
    vi.spyOn(Math, "random").mockReturnValue(0);
    vi.spyOn(window, "setInterval").mockImplementation((handler) => {
      intervalHandler = handler;
      return 1;
    });
    vi.spyOn(window, "clearInterval").mockImplementation(() => undefined);

    renderMainScreen();

    expect(screen.getByRole("heading", { name: "Dictate your first trip!" }))
      .toBeInTheDocument();
    expect(window.setInterval).toHaveBeenCalledWith(expect.any(Function), 4000);

    act(() => {
      if (typeof intervalHandler === "function") {
        intervalHandler();
      }
    });

    expect(screen.getByRole("heading", { name: "Start with your voice!" }))
      .toBeInTheDocument();
  });

  it("moves from listening to editable review and back to listening", async () => {
    const user = userEvent.setup();
    renderMainScreen();

    await user.click(screen.getByRole("button", { name: "Start Voice Request" }));

    expect(screen.queryByRole("button", { name: "Start Voice Request" }))
      .not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Voice waves animation" }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to Previous Trips" }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rerecord" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Drive" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
    expect(screen.queryByText("Back")).not.toBeInTheDocument();
    expect(screen.queryByText("Rerecord")).not.toBeInTheDocument();
    expect(screen.queryByText("Next")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Stop" }));

    const prompt = screen.getByLabelText("Driving Request");
    expect(prompt).toHaveValue(
      "Find a kid-friendly lunch stop near the National Mall with easy parking, and avoid the Beltway unless it saves more than 15 minutes.",
    );
    expect(screen.queryByRole("img", { name: "Voice waves animation" }))
      .not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Review Your Route Request" }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to Previous Trips" }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rerecord" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Drive" })).toBeInTheDocument();

    await user.clear(prompt);
    await user.type(prompt, "Find a quiet dinner spot near Dupont Circle");
    expect(prompt).toHaveValue("Find a quiet dinner spot near Dupont Circle");

    await user.click(screen.getByRole("button", { name: "Rerecord" }));

    expect(screen.getByRole("img", { name: "Voice waves animation" }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Driving Request")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to Previous Trips" }));

    expect(
      screen.getByRole("button", { name: "Start Voice Request" }),
    ).toBeInTheDocument();
  });

  it("opens the preferred navigator deep link and saves after Next from listening", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ preferredNavigator: "waze" }),
    );
    renderMainScreen();

    await user.click(screen.getByRole("button", { name: "Start Voice Request" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        "https://waze.com/ul?q=National%20Mall%2C%20Washington%2C%20DC&navigate=yes",
        "_blank",
        "noopener,noreferrer",
      );
    });
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Start Voice Request" }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByLabelText("Driving Request")).not.toBeInTheDocument();
    expect(screen.getByText("Rockville, MD")).toBeInTheDocument();
    expect(screen.getByText("National Mall, Washington, DC")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Find a kid-friendly lunch stop near the National Mall with easy parking, and avoid the Beltway unless it saves more than 15 minutes.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("July 4th, 2026, 9:00 AM")).not.toBeInTheDocument();
    expect(screen.getByText("55 min")).toBeInTheDocument();
    expect(screen.getByText("14 mi")).toBeInTheDocument();
    expect(screen.getByText("0 stops")).toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem(storageKey) ?? "{}").previousTrips[0],
    ).toMatchObject({
      prompt:
        "Find a kid-friendly lunch stop near the National Mall with easy parking, and avoid the Beltway unless it saves more than 15 minutes.",
      createdAt: routeCreatedAt,
      startAddress: "Rockville, MD",
      endAddress: "National Mall, Washington, DC",
      durationMinutes: 55,
      distanceMiles: 14,
      stopCount: 0,
    });

    await user.click(screen.getByRole("button", { name: "Start Voice Request" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(
        JSON.parse(window.localStorage.getItem(storageKey) ?? "{}").previousTrips,
      ).toHaveLength(2);
    });
    expect(
      screen.getAllByText(
        "Find a kid-friendly lunch stop near the National Mall with easy parking, and avoid the Beltway unless it saves more than 15 minutes.",
      ),
    ).toHaveLength(2);
  });

  it("groups previous trips by stored creation time", () => {
    vi.mocked(Date.now).mockReturnValue(Date.UTC(2026, 6, 23, 13, 0));
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        previousTrips: [
          {
            id: "today-trip",
            prompt: "Today trip",
            createdAt: Date.UTC(2026, 6, 23, 12, 0),
          },
          {
            id: "yesterday-trip",
            prompt: "Yesterday trip",
            createdAt: Date.UTC(2026, 6, 22, 13, 0),
          },
          {
            id: "week-trip",
            prompt: "This week trip",
            createdAt: Date.UTC(2026, 6, 20, 13, 0),
          },
          {
            id: "month-trip",
            prompt: "This month trip",
            createdAt: Date.UTC(2026, 6, 5, 13, 0),
          },
          {
            id: "earlier-trip",
            prompt: "Earlier trip",
            createdAt: Date.UTC(2026, 5, 15, 13, 0),
          },
        ],
      }),
    );

    renderMainScreen();

    expect(
      screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent),
    ).toEqual(["Today", "Yesterday", "This Week", "This Month", "Earlier"]);
    expect(screen.getByText("Today trip")).toBeInTheDocument();
    expect(screen.getByText("Yesterday trip")).toBeInTheDocument();
    expect(screen.getByText("This week trip")).toBeInTheDocument();
    expect(screen.getByText("This month trip")).toBeInTheDocument();
    expect(screen.getByText("Earlier trip")).toBeInTheDocument();
  });

  it("filters, plays, and removes previous trips", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        previousTrips: [
          {
            id: "trip-1",
            prompt: "Find coffee and a restroom on the way",
            createdAt: routeCreatedAt,
            startAddress: "Rockville, MD",
            endAddress: "Bethesda coffee stop",
            durationMinutes: 55,
            distanceMiles: 14,
            stopCount: 1,
          },
          {
            id: "trip-2",
            prompt: "Take the scenic route to Ocean City",
            createdAt: routeCreatedAt + 1,
          },
        ],
      }),
    );

    renderMainScreen();

    expect(screen.getByRole("heading", { name: "My Trips" })).toBeInTheDocument();
    expect(screen.getByLabelText("Search Previous Trips")).toBeInTheDocument();
    expect(screen.getAllByText("Rockville, MD")).toHaveLength(2);
    expect(screen.getByText("Bethesda coffee stop")).toBeInTheDocument();
    expect(screen.queryByText("July 4th, 2026, 9:00 AM")).not.toBeInTheDocument();
    expect(screen.getAllByText("55 min")).toHaveLength(2);
    expect(screen.getAllByText("14 mi")).toHaveLength(2);
    expect(screen.getByText("1 stop")).toBeInTheDocument();
    expect(screen.getByText("Find coffee and a restroom on the way"))
      .toBeInTheDocument();
    expect(screen.getByText("Take the scenic route to Ocean City"))
      .toBeInTheDocument();

    await user.type(screen.getByLabelText("Search Previous Trips"), "coffee");

    expect(screen.getByText("Bethesda coffee stop")).toBeInTheDocument();
    expect(screen.getByText("Find coffee and a restroom on the way"))
      .toBeInTheDocument();
    expect(screen.queryByText("Take the scenic route to Ocean City"))
      .not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Play Find coffee and a restroom on the way",
      }),
    );

    expect(window.open).toHaveBeenCalledWith(
      "https://www.google.com/maps/dir/?api=1&origin=Rockville%2C%20MD&destination=Bethesda%20coffee%20stop&travelmode=driving",
      "_blank",
      "noopener,noreferrer",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Remove Find coffee and a restroom on the way",
      }),
    );

    expect(screen.getByText("No matching trips")).toBeInTheDocument();
  });
});
