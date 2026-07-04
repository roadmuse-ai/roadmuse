import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSettings, storageKey } from "../data/settings";
import { SettingsProvider, useSettings } from "./SettingsContext";

function SettingsHarness() {
  const {
    settings,
    setPreferredNavigator,
    setAccentTheme,
    addSavedPlace,
    updateSavedPlace,
    removeSavedPlace,
    addPreviousTrip,
    removePreviousTrip,
    addPreference,
    updatePreference,
    removePreference,
    resetSettings,
  } = useSettings();

  const firstPlaceId = settings.savedPlaces[0]?.id ?? "";
  const firstTripId = settings.previousTrips[0]?.id ?? "";
  const firstPreferenceId = settings.preferences[0]?.id ?? "";

  return (
    <div>
      <p data-testid="navigator">{settings.preferredNavigator}</p>
      <p data-testid="accent-theme">{settings.accentTheme}</p>
      <p data-testid="saved-places">
        {settings.savedPlaces.map((place) => `${place.label}:${place.address}`).join("|")}
      </p>
      <p data-testid="preferences">
        {settings.preferences
          .map((preference) => `${preference.text}:${preference.enabled ? "on" : "off"}`)
          .join("|")}
      </p>
      <p data-testid="previous-trips">
        {settings.previousTrips.map((trip) => trip.prompt).join("|")}
      </p>
      <button type="button" onClick={() => setPreferredNavigator("apple-maps")}>
        Set Apple
      </button>
      <button type="button" onClick={() => setAccentTheme("patriotic")}>
        Set Patriotic
      </button>
      <button
        type="button"
        onClick={() =>
          addSavedPlace({
            label: "Work",
            address: "456 Center Ave",
            latitude: 38.9,
            longitude: -77.04,
          })
        }
      >
        Add Work
      </button>
      <button
        type="button"
        onClick={() =>
          addSavedPlace({
            label: "Gym",
            address: "100 Fitness Way",
          })
        }
      >
        Add Gym
      </button>
      <button
        type="button"
        onClick={() =>
          updateSavedPlace(firstPlaceId, {
            id: "ignored",
            label: "Office",
            address: "789 Center Ave",
          })
        }
      >
        Update First
      </button>
      <button type="button" onClick={() => removeSavedPlace(firstPlaceId)}>
        Remove First
      </button>
      <button type="button" onClick={() => addPreviousTrip("Find lunch")}>
        Add Trip
      </button>
      <button type="button" onClick={() => removePreviousTrip(firstTripId)}>
        Remove Trip
      </button>
      <button type="button" onClick={addPreference}>
        Add Preference
      </button>
      <button
        type="button"
        onClick={() =>
          updatePreference(firstPreferenceId, {
            text: "Avoid tolls",
            validationStatus: "supported",
          })
        }
      >
        Update Preference
      </button>
      <button
        type="button"
        onClick={() => updatePreference(firstPreferenceId, { enabled: false })}
      >
        Disable Preference
      </button>
      <button type="button" onClick={() => removePreference(firstPreferenceId)}>
        Remove Preference
      </button>
      <button type="button" onClick={resetSettings}>
        Reset
      </button>
    </div>
  );
}

describe("SettingsProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    let now = 1710000000000;
    let random = 0.5;
    vi.spyOn(Date, "now").mockImplementation(() => now++);
    vi.spyOn(Math, "random").mockImplementation(() => {
      random += 0.01;
      return random;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("manages navigator and saved place settings", async () => {
    const user = userEvent.setup();

    render(
      <SettingsProvider>
        <SettingsHarness />
      </SettingsProvider>,
    );

    expect(screen.getByTestId("navigator")).toHaveTextContent("google-maps");

    await user.click(screen.getByRole("button", { name: "Set Apple" }));
    expect(screen.getByTestId("navigator")).toHaveTextContent("apple-maps");

    await user.click(screen.getByRole("button", { name: "Set Patriotic" }));
    expect(screen.getByTestId("accent-theme")).toHaveTextContent("patriotic");

    await user.click(screen.getByRole("button", { name: "Add Work" }));
    await user.click(screen.getByRole("button", { name: "Add Gym" }));
    expect(screen.getByTestId("saved-places")).toHaveTextContent(
      "Work:456 Center Ave",
    );
    expect(screen.getByTestId("saved-places")).toHaveTextContent(
      "Gym:100 Fitness Way",
    );

    await user.click(screen.getByRole("button", { name: "Update First" }));
    expect(screen.getByTestId("saved-places")).toHaveTextContent(
      "Office:789 Center Ave",
    );
    expect(screen.getByTestId("saved-places")).toHaveTextContent(
      "Gym:100 Fitness Way",
    );

    await user.click(screen.getByRole("button", { name: "Remove First" }));
    expect(screen.getByTestId("saved-places")).not.toHaveTextContent(
      "Office:789 Center Ave",
    );
    expect(screen.getByTestId("saved-places")).toHaveTextContent(
      "Gym:100 Fitness Way",
    );

    await user.click(screen.getByRole("button", { name: "Remove First" }));
    expect(screen.getByTestId("saved-places")).toBeEmptyDOMElement();

    await user.click(screen.getByRole("button", { name: "Add Trip" }));
    expect(screen.getByTestId("previous-trips")).toHaveTextContent("Find lunch");

    await user.click(screen.getByRole("button", { name: "Remove Trip" }));
    expect(screen.getByTestId("previous-trips")).toBeEmptyDOMElement();

    await user.click(screen.getByRole("button", { name: "Add Preference" }));
    expect(screen.getByTestId("preferences")).toHaveTextContent(":on");

    await user.click(screen.getByRole("button", { name: "Update Preference" }));
    expect(screen.getByTestId("preferences")).toHaveTextContent("Avoid tolls:on");

    await user.click(screen.getByRole("button", { name: "Disable Preference" }));
    expect(screen.getByTestId("preferences")).toHaveTextContent("Avoid tolls:off");

    await user.click(screen.getByRole("button", { name: "Remove Preference" }));
    expect(screen.getByTestId("preferences")).toBeEmptyDOMElement();

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByTestId("navigator")).toHaveTextContent(
      defaultSettings.preferredNavigator,
    );
    expect(screen.getByTestId("accent-theme")).toHaveTextContent(
      defaultSettings.accentTheme,
    );

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")).toEqual(
        defaultSettings,
      );
    });
  });

});
