import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { SettingsProvider } from "../context/SettingsContext";
import { storageKey } from "../data/settings";
import { MainScreen } from "./MainScreen";

const routeCreatedAt = Date.UTC(2026, 6, 4, 13, 0);
const routePrompt =
  "Route Rockville to National Mall via Bethesda Row and Georgetown Waterfront Park. Find kid-friendly lunch with easy parking; avoid the Beltway unless it saves 15+ min.";

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

  it("opens with the first-trip prompt and primary voice control", async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, "random").mockReturnValue(0);

    renderMainScreen();

    expect(screen.getByRole("heading", { name: "Dictate your first trip!" }))
      .toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start Voice Request" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enter Route" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "My Trips" }))
      .not.toBeInTheDocument();
    expect(screen.queryByLabelText("Search Previous Trips")).not.toBeInTheDocument();
    expect(screen.queryByText("Current Settings")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start planning a route" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Drive" })).not.toBeInTheDocument();

    await user.tab();
    expect(screen.getByRole("button", { name: "Start Voice Request" }))
      .toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "Enter Route" })).toHaveFocus();
  });

  it("opens manual route entry from the pencil control", async () => {
    const user = userEvent.setup();
    renderMainScreen();

    await user.click(screen.getByRole("button", { name: "Enter Route" }));

    expect(screen.getByLabelText("Voice route request")).toHaveClass(
      "voice-home--prompt-entry",
    );
    expect(screen.getByRole("heading", { name: "Enter Your Route" }))
      .toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Review Your Route" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Voice waves animation" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start Voice Request" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enter Route" }))
      .not.toBeInTheDocument();
    expect(screen.getByLabelText("Driving Request")).toHaveValue("");
    expect(screen.getByLabelText("Driving Request")).toHaveFocus();
    expect(screen.getByRole("button", { name: "Back to Previous Trips" }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rerecord" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Drive" })).toBeInTheDocument();
  });

  it("rotates the first-trip prompt while no trips are saved", () => {
    let intervalHandler: TimerHandler | undefined;
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.34);
    vi.spyOn(window, "setInterval").mockImplementation((handler) => {
      intervalHandler = handler;
      return 1;
    });
    vi.spyOn(window, "clearInterval").mockImplementation(() => undefined);

    renderMainScreen();

    expect(screen.getByRole("heading", { name: "Dictate your first trip!" }))
      .toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dictate your first trip!" }))
      .toHaveClass("previous-trips__starter-title");
    expect(window.setInterval).toHaveBeenCalledWith(expect.any(Function), 4000);

    act(() => {
      if (typeof intervalHandler === "function") {
        intervalHandler();
      }
    });

    expect(screen.getByRole("heading", { name: "Speak your journey!" }))
      .toBeInTheDocument();
  });

  it("moves from listening to editable review and back to listening", async () => {
    const user = userEvent.setup();
    renderMainScreen();

    await user.click(screen.getByRole("button", { name: "Start Voice Request" }));

    expect(screen.getByLabelText("Voice route request")).toHaveClass(
      "voice-home--prompt-entry",
    );
    expect(screen.queryByRole("button", { name: "Start Voice Request" }))
      .not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Voice waves animation" }))
      .toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Enter Your Route" }))
      .toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Review Your Route" }))
      .not.toBeInTheDocument();
    expect(screen.getByLabelText("Driving Request")).toHaveValue("");
    expect(screen.getByLabelText("Driving Request")).toBeDisabled();
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
    expect(prompt).toHaveValue(routePrompt);
    expect(screen.queryByRole("img", { name: "Voice waves animation" }))
      .not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Review Your Route" }))
      .toBeInTheDocument();
    expect(prompt).not.toBeDisabled();
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
    expect(screen.getByRole("heading", { name: "Enter Your Route" }))
      .toBeInTheDocument();
    expect(screen.getByLabelText("Driving Request")).toHaveValue("");
    expect(screen.getByLabelText("Driving Request")).toBeDisabled();

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
    expect(screen.queryByText("Bethesda Row, Bethesda, MD"))
      .not.toBeInTheDocument();
    expect(screen.queryByText("Georgetown Waterfront Park, Washington, DC"))
      .not.toBeInTheDocument();
    expect(screen.getByText("National Mall, Washington, DC")).toBeInTheDocument();
    expect(screen.getByText(routePrompt)).toBeInTheDocument();
    expect(screen.queryByText("July 4th, 2026, 9:00 AM")).not.toBeInTheDocument();
    expect(screen.getByText("55 min")).toBeInTheDocument();
    expect(screen.getByText("14 mi")).toBeInTheDocument();
    expect(screen.getByText("2 stops")).toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem(storageKey) ?? "{}").previousTrips[0],
    ).toMatchObject({
      prompt: routePrompt,
      createdAt: routeCreatedAt,
      route: [
        {
          address: "Rockville, MD",
          latitude: 39.084,
          longitude: -77.1528,
        },
        {
          address: "Bethesda Row, Bethesda, MD",
          latitude: 38.9818,
          longitude: -77.0969,
        },
        {
          address: "Georgetown Waterfront Park, Washington, DC",
          latitude: 38.9029,
          longitude: -77.0625,
        },
        {
          address: "National Mall, Washington, DC",
          latitude: 38.8895,
          longitude: -77.0353,
        },
      ],
      startAddress: "Rockville, MD",
      endAddress: "National Mall, Washington, DC",
      durationMinutes: 55,
      distanceMiles: 14,
      stopCount: 2,
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
      screen.getAllByText(routePrompt),
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

  it("formats previous trip distances with the saved distance unit", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        routeSettings: { units: "kilometers" },
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
        ],
      }),
    );

    renderMainScreen();

    expect(screen.getByText("22.5 km")).toBeInTheDocument();
    expect(screen.queryByText("14 mi")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Search Previous Trips"), "22.5 km");
    expect(screen.getByText("Find coffee and a restroom on the way"))
      .toBeInTheDocument();

    await user.clear(screen.getByLabelText("Search Previous Trips"));
    await user.type(screen.getByLabelText("Search Previous Trips"), "14 mi");
    expect(screen.getByText("No matching trips")).toBeInTheDocument();
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
            route: [
              {
                address: "Rockville, MD",
                latitude: 39.084,
                longitude: -77.1528,
              },
              {
                address: "NIH Clinical Center, Bethesda, MD",
                latitude: 39.0006,
                longitude: -77.1014,
              },
              {
                address: "Bethesda coffee stop",
                latitude: 38.9847,
                longitude: -77.0947,
              },
            ],
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
    expect(screen.queryByText("NIH Clinical Center, Bethesda, MD"))
      .not.toBeInTheDocument();
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

    expect(
      screen.getByRole("button", { name: "Clear Previous Trips Search" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Bethesda coffee stop")).toBeInTheDocument();
    expect(screen.getByText("Find coffee and a restroom on the way"))
      .toBeInTheDocument();
    expect(screen.queryByText("Take the scenic route to Ocean City"))
      .not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Clear Previous Trips Search" }),
    );

    expect(screen.getByLabelText("Search Previous Trips")).toHaveValue("");
    expect(screen.getByText("Take the scenic route to Ocean City"))
      .toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear Previous Trips Search" }))
      .not.toBeInTheDocument();

    await user.type(
      screen.getByLabelText("Search Previous Trips"),
      "NIH Clinical Center",
    );

    expect(screen.getByText("Find coffee and a restroom on the way"))
      .toBeInTheDocument();
    expect(screen.queryByText("NIH Clinical Center, Bethesda, MD"))
      .not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Play Find coffee and a restroom on the way",
      }),
    );

    expect(window.open).toHaveBeenCalledWith(
      "https://www.google.com/maps/dir/?api=1&origin=Rockville%2C%20MD&destination=Bethesda%20coffee%20stop&waypoints=NIH%20Clinical%20Center%2C%20Bethesda%2C%20MD&travelmode=driving",
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
