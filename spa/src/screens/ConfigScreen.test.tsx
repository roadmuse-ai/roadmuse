import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { SettingsProvider } from "../context/SettingsContext";
import { storageKey } from "../data/settings";
import { ConfigScreen } from "./ConfigScreen";

function renderConfigScreen() {
  return render(
    <MemoryRouter>
      <SettingsProvider>
        <ConfigScreen />
      </SettingsProvider>
    </MemoryRouter>,
  );
}

describe("ConfigScreen", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(Date, "now").mockReturnValue(1710000000000);
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("updates and persists the preferred navigator", async () => {
    const user = userEvent.setup();
    renderConfigScreen();

    const select = screen.getByLabelText("Preferred Navigator");

    await user.selectOptions(select, "waze");

    expect(select).toHaveValue("waze");
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")).toMatchObject({
        preferredNavigator: "waze",
      });
    });
  });

  it("adds, edits, and removes saved places", async () => {
    const user = userEvent.setup();
    renderConfigScreen();

    await user.click(screen.getByRole("button", { name: "Add Place" }));

    const saveButton = screen.getByRole("button", { name: "Save" });
    expect(saveButton).toBeEnabled();
    expect(screen.getByRole("radio", { name: "Address" })).toBeChecked();

    await user.type(screen.getByLabelText("Place label"), " Home ");
    await user.type(screen.getByLabelText("Place address"), " 123 Main St ");
    await user.type(screen.getByLabelText("City"), " Washington ");
    await user.selectOptions(screen.getByLabelText("Country"), "United States");
    await user.selectOptions(screen.getByLabelText("State"), "DC");
    await user.type(screen.getByLabelText("ZIP code"), " 20500 ");

    expect(saveButton).not.toBeDisabled();
    await user.click(saveButton);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
    expect(screen.getByText("Washington, DC 20500, United States")).toBeInTheDocument();
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")).toMatchObject({
        savedPlaces: [
          {
            entryMode: "address",
            label: "Home",
            address: "123 Main St",
            city: "Washington",
            state: "DC",
            country: "United States",
            zipCode: "20500",
          },
        ],
      });
    });

    await user.click(screen.getByRole("button", { name: "Edit Home" }));
    expect(screen.getByRole("dialog", { name: "Edit saved place" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Address" })).toBeChecked();
    expect(screen.getByLabelText("City")).toHaveValue("Washington");
    expect(screen.getByLabelText("State")).toHaveValue("DC");
    expect(screen.getByLabelText("Country")).toHaveValue("United States");
    expect(screen.getByLabelText("ZIP code")).toHaveValue("20500");

    await user.clear(screen.getByLabelText("Place address"));
    await user.type(screen.getByLabelText("Place address"), "456 Center Ave");
    await user.clear(screen.getByLabelText("City"));
    await user.type(screen.getByLabelText("City"), "Arlington");
    await user.clear(screen.getByLabelText("ZIP code"));
    await user.type(screen.getByLabelText("ZIP code"), "22201");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("456 Center Ave")).toBeInTheDocument();
    expect(screen.getByText("Arlington, DC 22201, United States")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove Home" }));

    expect(screen.queryByText("Home")).not.toBeInTheDocument();
    expect(screen.queryByText("456 Center Ave")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Arlington, DC 22201, United States"),
    ).not.toBeInTheDocument();
  });

  it("adds coordinate saved places and validates coordinate fields", async () => {
    const user = userEvent.setup();
    renderConfigScreen();

    await user.click(screen.getByRole("button", { name: "Add Place" }));
    await user.click(screen.getByRole("radio", { name: "Coordinates" }));

    expect(screen.queryByLabelText("Place address")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Country")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Place label"), "Trailhead");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      screen.getByText("Latitude and longitude are required and must be numeric."),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Latitude"), "north");
    await user.type(screen.getByLabelText("Longitude"), "-77.01");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      screen.getByText("Latitude and longitude are required and must be numeric."),
    ).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Latitude"));
    await user.type(screen.getByLabelText("Latitude"), "38.9");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Trailhead")).toBeInTheDocument();
    expect(screen.getByText("38.9, -77.01")).toBeInTheDocument();
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")).toMatchObject({
        savedPlaces: [
          {
            entryMode: "coordinates",
            label: "Trailhead",
            address: "",
            latitude: 38.9,
            longitude: -77.01,
          },
        ],
      });
    });
  });

  it("selects and persists the theme mode", async () => {
    const user = userEvent.setup();
    renderConfigScreen();

    const autoOption = screen.getByRole("radio", { name: "Auto" });
    expect(autoOption).toBeChecked();

    await user.click(screen.getByRole("radio", { name: "Dark" }));

    expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked();
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")).toMatchObject({
        themeMode: "dark",
      });
    });

    await user.click(screen.getByRole("radio", { name: "Light" }));

    expect(screen.getByRole("radio", { name: "Light" })).toBeChecked();
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")).toMatchObject({
        themeMode: "light",
      });
    });
  });

  it("shows required-field validation errors", async () => {
    const user = userEvent.setup();
    renderConfigScreen();

    await user.click(screen.getByRole("button", { name: "Add Place" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Label is required.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Place label"), "Home");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      screen.getByText(
        "Address, city, country, ZIP code, and state when applicable are required.",
      ),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Place address"), "123 Main St");
    await user.type(screen.getByLabelText("City"), "Washington");
    await user.selectOptions(screen.getByLabelText("Country"), "United States");
    await user.type(screen.getByLabelText("ZIP code"), "20500");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      screen.getByText(
        "Address, city, country, ZIP code, and state when applicable are required.",
      ),
    ).toBeInTheDocument();
  });

  it("adds, validates, disables, and removes route preferences", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup();
    renderConfigScreen();

    await user.click(screen.getByRole("button", { name: "Add Preference" }));

    await user.type(screen.getByLabelText("Preference text"), "Avoid tolls");
    await vi.advanceTimersByTimeAsync(450);

    await waitFor(() => {
      expect(screen.getByText("Supported")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("checkbox", { name: "Enable preference: Avoid tolls" }),
    );
    expect(screen.getByText("Disabled")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Remove preference: Avoid tolls" }),
    );

    await waitFor(() => {
      expect(screen.queryByLabelText("Preference text")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")).toMatchObject({
        preferences: [],
      });
    });

    vi.useRealTimers();
  });
});
