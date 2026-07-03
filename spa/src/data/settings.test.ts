import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type RoadMuseSettings,
  defaultSettings,
  loadSettings,
  navigatorIds,
  navigatorLabels,
  saveSettings,
  storageKey,
} from "./settings";

describe("settings persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("returns defaults when storage is empty or malformed", () => {
    expect(loadSettings()).toEqual(defaultSettings);

    window.localStorage.setItem(storageKey, "{not-json");

    expect(loadSettings()).toEqual(defaultSettings);
  });

  it("normalizes saved settings and filters invalid saved places", () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        preferredNavigator: "waze",
        savedPlaces: [
          {
            id: "home",
            label: "  Home  ",
            address: "  123 Main St  ",
            city: "  Washington  ",
            state: "  DC  ",
            country: "  United States  ",
            zipCode: "  20500  ",
            latitude: 38.9,
          },
          null,
          {
            id: 123,
            label: "Bad id",
            address: "Somewhere",
          },
          {
            id: "bad-label",
            label: 123,
            address: "Somewhere",
          },
          {
            id: "bad-address",
            label: "Bad address",
            address: 123,
          },
          {
            id: "bad-city",
            label: "Bad city",
            address: "Somewhere",
            city: 123,
          },
          {
            id: "missing-label",
            label: "",
            address: "Somewhere",
          },
          {
            id: "bad-latitude",
            label: "Invalid Coordinate",
            address: "Somewhere",
            latitude: "38.9",
          },
          {
            id: "bad-longitude",
            label: "Invalid Coordinate",
            address: "Somewhere",
            longitude: "-77.01",
          },
          {
            id: "office",
            label: "Office",
            address: "456 Center Ave",
            longitude: -77.01,
          },
        ],
      }),
    );

    expect(loadSettings()).toEqual({
      preferredNavigator: "waze",
      savedPlaces: [
        {
          id: "home",
          label: "Home",
          address: "123 Main St",
          city: "Washington",
          state: "DC",
          country: "United States",
          zipCode: "20500",
          latitude: 38.9,
          longitude: undefined,
        },
        {
          id: "office",
          label: "Office",
          address: "456 Center Ave",
          latitude: undefined,
          longitude: -77.01,
        },
      ],
      preferences: [],
      themeMode: "auto",
    });
  });

  it("normalizes saved preferences and filters invalid entries", () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        preferredNavigator: "google-maps",
        savedPlaces: [],
        preferences: [
          {
            id: "valid",
            text: "Avoid tolls",
            enabled: true,
            validationStatus: "supported",
          },
          null,
          {
            id: 1,
            text: "Bad id",
            enabled: true,
            validationStatus: "supported",
          },
          {
            id: "bad-explanation",
            text: "Prefer scenic routes",
            enabled: true,
            validationStatus: "supported",
            validationExplanation: 123,
          },
        ],
      }),
    );

    expect(loadSettings().preferences).toEqual([
      {
        id: "valid",
        text: "Avoid tolls",
        enabled: true,
        validationStatus: "supported",
        validationExplanation: undefined,
      },
    ]);
  });

  it("falls back when navigator or saved places data is invalid", () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        preferredNavigator: "tomtom",
        savedPlaces: "not-an-array",
      }),
    );

    expect(loadSettings()).toEqual(defaultSettings);
  });

  it("persists valid theme modes and falls back to auto on invalid values", () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ themeMode: "dark" }),
    );
    expect(loadSettings().themeMode).toBe("dark");

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ themeMode: "sepia" }),
    );
    expect(loadSettings().themeMode).toBe("auto");

    window.localStorage.setItem(storageKey, JSON.stringify({}));
    expect(loadSettings().themeMode).toBe("auto");
  });

  it("saves settings to local storage", () => {
    const settings: RoadMuseSettings = {
      preferredNavigator: "here-wego",
      savedPlaces: [
        {
          id: "office",
          label: "Office",
          address: "456 Center Ave",
          city: "Washington",
          state: "DC",
          country: "United States",
          zipCode: "20001",
          latitude: 38.8977,
          longitude: -77.0365,
        },
      ],
      preferences: [],
      themeMode: "dark",
    };

    saveSettings(settings);

    expect(window.localStorage.getItem(storageKey)).toEqual(JSON.stringify(settings));
  });

  it("ignores local storage read and write failures", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementationOnce(() => {
      throw new Error("blocked");
    });

    expect(loadSettings()).toEqual(defaultSettings);

    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("quota exceeded");
    });

    expect(() => saveSettings(defaultSettings)).not.toThrow();
  });

  it("returns safely outside browser environments", () => {
    vi.stubGlobal("window", undefined);

    expect(loadSettings()).toEqual(defaultSettings);
    expect(() => saveSettings(defaultSettings)).not.toThrow();
  });

  it("keeps labels available for every supported navigator id", () => {
    expect(Object.keys(navigatorLabels)).toEqual([...navigatorIds]);
    expect(navigatorIds.map((id) => navigatorLabels[id])).toEqual([
      "Google Maps",
      "Waze",
      "Apple Maps",
      "HERE WeGo",
      "Organic Maps",
      "GPX Export",
    ]);
  });
});
