import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { SettingsProvider } from "../context/SettingsContext";
import { storageKey } from "../data/settings";
import { MainScreen } from "./MainScreen";

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
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("opens with only the primary voice control in the home content", () => {
    renderMainScreen();

    expect(
      screen.getByRole("button", { name: "Start Voice Request" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Current Settings")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start planning a route" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Drive" })).not.toBeInTheDocument();
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
        "https://waze.com/ul?q=Find%20a%20kid-friendly%20lunch%20stop%20near%20the%20National%20Mall%20with%20easy%20parking%2C%20and%20avoid%20the%20Beltway%20unless%20it%20saves%20more%20than%2015%20minutes.&navigate=yes",
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
    expect(
      screen.getByText(
        "Rockville, MD to Find a kid-friendly lunch stop near the National Mall with easy parking, and avoid the Beltway unless it saves more than 15 minutes. (0 stops in between)",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Find a kid-friendly lunch stop near the National Mall with easy parking, and avoid the Beltway unless it saves more than 15 minutes.",
      ),
    ).toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem(storageKey) ?? "{}").previousTrips[0],
    ).toMatchObject({
      prompt:
        "Find a kid-friendly lunch stop near the National Mall with easy parking, and avoid the Beltway unless it saves more than 15 minutes.",
      startAddress: "Rockville, MD",
      endAddress:
        "Find a kid-friendly lunch stop near the National Mall with easy parking, and avoid the Beltway unless it saves more than 15 minutes.",
      stopCount: 0,
    });
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
            createdAt: 1710000000000,
            startAddress: "Rockville, MD",
            endAddress: "Bethesda coffee stop",
            stopCount: 1,
          },
          {
            id: "trip-2",
            prompt: "Take the scenic route to Ocean City",
            createdAt: 1710000000001,
          },
        ],
      }),
    );

    renderMainScreen();

    expect(screen.getByLabelText("Search Previous Trips")).toBeInTheDocument();
    expect(
      screen.getByText("Rockville, MD to Bethesda coffee stop (1 stop in between)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Find coffee and a restroom on the way"))
      .toBeInTheDocument();
    expect(screen.getByText("Take the scenic route to Ocean City"))
      .toBeInTheDocument();

    await user.type(screen.getByLabelText("Search Previous Trips"), "coffee");

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
      "https://www.google.com/maps/dir/?api=1&origin=39.084%2C-77.1528&destination=Bethesda%20coffee%20stop&travelmode=driving",
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
