import { render, screen, waitFor, within } from "@testing-library/react";
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

async function chooseLookupOption(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  query: string,
  option = query,
) {
  const input = screen.getByLabelText(label);

  await user.clear(input);
  await user.type(input, query);
  await user.click(screen.getByRole("option", { name: option }));
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
    const countryInput = screen.getByLabelText("Country");
    await user.type(countryInput, "Afgh");
    expect(screen.getByRole("option", { name: "Afghanistan" })).toBeInTheDocument();
    await user.keyboard("{ArrowDown}{ArrowUp}{Enter}");
    expect(countryInput).toHaveValue("Afghanistan");
    await chooseLookupOption(user, "Country", "United", "United States");
    await chooseLookupOption(user, "State", "D", "DC");
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

  it("allows saved place addresses for countries without states", async () => {
    const user = userEvent.setup();
    renderConfigScreen();

    await user.click(screen.getByRole("button", { name: "Add Place" }));

    expect(screen.getByLabelText("State")).toBeDisabled();

    await user.type(screen.getByLabelText("Place label"), "Hotel");
    await user.type(screen.getByLabelText("Place address"), "1 Rue de Rivoli");
    await user.type(screen.getByLabelText("City"), "Paris");
    await chooseLookupOption(user, "Country", "Fra", "France");
    await user.type(screen.getByLabelText("ZIP code"), "75001");

    expect(screen.getByLabelText("State")).toBeDisabled();
    expect(screen.getByLabelText("State")).toHaveAttribute("placeholder", "Not required");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Hotel")).toBeInTheDocument();
    expect(screen.getByText("1 Rue de Rivoli")).toBeInTheDocument();
    expect(screen.getByText("Paris 75001, France")).toBeInTheDocument();
    await waitFor(() => {
      const savedPlace = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")
        .savedPlaces[0];

      expect(savedPlace).toMatchObject({
        entryMode: "address",
        label: "Hotel",
        address: "1 Rue de Rivoli",
        city: "Paris",
        country: "France",
        zipCode: "75001",
      });
      expect(savedPlace).not.toHaveProperty("state");
    });
  });

  it("adds coordinate saved places and validates coordinate fields", async () => {
    const user = userEvent.setup();
    renderConfigScreen();

    await user.click(screen.getByRole("button", { name: "Add Place" }));
    await user.click(screen.getByRole("radio", { name: "Coordinates" }));

    expect(screen.queryByLabelText("Place address")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Country")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Latitude")).toHaveAttribute(
      "placeholder",
      "e.g., 38.8977",
    );
    expect(screen.getByLabelText("Longitude")).toHaveAttribute(
      "placeholder",
      "e.g., -77.0365",
    );

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

  it("lists theme mode options in System, Light, Dark order", () => {
    renderConfigScreen();

    const options = within(screen.getByRole("radiogroup", { name: "Theme mode" })).getAllByRole(
      "radio",
    );

    expect(options.map((option) => option.getAttribute("value"))).toEqual([
      "auto",
      "light",
      "dark",
    ]);
    expect(options.map((option) => option.closest("label")?.textContent?.trim())).toEqual([
      "System",
      "Light",
      "Dark",
    ]);
  });

  it("selects and persists the theme mode", async () => {
    const user = userEvent.setup();
    renderConfigScreen();

    const systemOption = screen.getByRole("radio", { name: "System" });
    expect(systemOption).toBeChecked();
    expect(screen.getByRole("radio", { name: "Ground" })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: "Dark" }));

    expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked();
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")).toMatchObject({
        themeMode: "dark",
      });
    });

    await user.click(screen.getByRole("radio", { name: "7/4" }));

    expect(screen.getByRole("radio", { name: "7/4" })).toBeChecked();
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")).toMatchObject({
        accentTheme: "patriotic",
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
        "Address, city, country from the list, ZIP code, and state when applicable are required.",
      ),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Place address"), "123 Main St");
    await user.type(screen.getByLabelText("City"), "Washington");
    await user.type(screen.getByLabelText("Country"), "United States");
    await user.type(screen.getByLabelText("ZIP code"), "20500");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      screen.getByText(
        "Address, city, country from the list, ZIP code, and state when applicable are required.",
      ),
    ).toBeInTheDocument();
  });

  it("adds, validates, disables, and removes route preferences", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup();
    renderConfigScreen();

    await user.click(screen.getByRole("button", { name: "Add Preference" }));

    expect(
      screen.getByRole("dialog", { name: "Add route preference" }),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText("Preference text"), "Avoid tolls");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Avoid tolls")).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(450);

    await waitFor(() => {
      expect(screen.getByText("Supported")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", {
        name: "Supported validation details for Avoid tolls",
      }),
    ).toHaveAttribute("aria-describedby");
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Preference saved. Full validation will run once the backend is connected.",
    );

    await user.click(
      screen.getByRole("checkbox", { name: "Enable preference: Avoid tolls" }),
    );
    expect(screen.getByText("Disabled")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit preference: Avoid tolls" }));

    expect(
      screen.getByRole("dialog", { name: "Edit route preference" }),
    ).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Preference text"));
    await user.type(screen.getByLabelText("Preference text"), "Avoid ferries");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Avoid tolls")).not.toBeInTheDocument();
    expect(screen.getByText("Avoid ferries")).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(450);

    await waitFor(() => {
      expect(screen.getByText("Supported")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: "Remove preference: Avoid ferries" }),
    );

    await waitFor(() => {
      expect(screen.queryByText("Avoid ferries")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")).toMatchObject({
        preferences: [],
      });
    });

    vi.useRealTimers();
  });

  it("rejects blank and whitespace-only preference values", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup();
    renderConfigScreen();

    await user.click(screen.getByRole("button", { name: "Add Preference" }));

    const preferenceField = screen.getByLabelText("Preference text");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Preference text is required.");
    expect(preferenceField).toHaveAttribute("aria-invalid", "true");

    await user.type(preferenceField, "   ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Preference text is required.");
    expect(screen.getByRole("dialog", { name: "Add route preference" })).toBeInTheDocument();

    await user.clear(preferenceField);
    await user.type(preferenceField, "Avoid tolls");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Avoid tolls")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit preference: Avoid tolls" }));
    const editPreferenceField = screen.getByLabelText("Preference text");
    await user.clear(editPreferenceField);
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Preference text is required.");
    expect(screen.getByRole("dialog", { name: "Edit route preference" })).toBeInTheDocument();

    await user.type(editPreferenceField, "\t  \n");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Preference text is required.");

    vi.useRealTimers();
  });

  it("locks background scroll while an editor overlay is open", async () => {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 180,
    });
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);

    const user = userEvent.setup();
    renderConfigScreen();

    await user.click(screen.getByRole("button", { name: "Add Preference" }));

    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.top).toBe("-180px");

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(document.body.style.overflow).toBe("");
    expect(document.body.style.position).toBe("");
    expect(scrollTo).toHaveBeenCalledWith(0, 180);

    vi.unstubAllGlobals();
  });

  it("persists distance units after preferred navigator", async () => {
    const user = userEvent.setup();
    renderConfigScreen();

    expect(screen.getByRole("radiogroup", { name: "Distance units" })).toHaveClass(
      "theme-toggle--two",
    );
    await user.click(screen.getByRole("radio", { name: "Kilometers" }));

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")).toMatchObject({
        routeSettings: { units: "kilometers" },
      });
    });
  });

  it("renders route settings after route preferences", () => {
    renderConfigScreen();

    const headings = screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    const preferencesIndex = headings.indexOf("Route Preferences");
    const settingsIndex = headings.indexOf("Route Settings");

    expect(preferencesIndex).toBeGreaterThanOrEqual(0);
    expect(settingsIndex).toBeGreaterThan(preferencesIndex);
  });

  it("renders auto route settings only and persists driving changes", async () => {
    const user = userEvent.setup();
    renderConfigScreen();

    expect(screen.getByRole("heading", { name: "Route Settings" })).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup", { name: "Travel mode" })).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Bicycle" })).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Walking" })).not.toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Toll roads" })).toBeInTheDocument();
    expect(
      screen.queryByText(/Route Settings are direct Valhalla routing controls/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Alternate routes")).not.toBeInTheDocument();
    expect(screen.queryByText("Bicycle settings")).not.toBeInTheDocument();
    expect(screen.queryByText("Walking settings")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Walking speed")).not.toBeInTheDocument();

    const tollRoads = screen.getByRole("radiogroup", { name: "Toll roads" });
    await user.click(within(tollRoads).getByRole("radio", { name: "Avoid" }));

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")).toMatchObject({
        routeSettings: {
          travelMode: "auto",
          auto: { tollPreference: 0 },
        },
      });
    });
  });

  it("normalizes old non-auto route modes to auto settings", async () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        routeSettings: {
          travelMode: "pedestrian",
          pedestrian: { walkingSpeedKph: 4.5, stepPenaltySeconds: 60 },
        },
      }),
    );

    renderConfigScreen();

    expect(screen.queryByRole("radiogroup", { name: "Travel mode" })).not.toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Toll roads" })).toBeInTheDocument();

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")).toMatchObject({
        routeSettings: { travelMode: "auto" },
      });
    });
  });
});
