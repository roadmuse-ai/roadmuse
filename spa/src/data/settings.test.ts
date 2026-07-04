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
import { defaultRouteSettings } from "./routeSettings";

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
        accentTheme: "navy",
        previousTrips: [
          {
            id: "trip-1",
            prompt: "  Find coffee on the way  ",
            createdAt: 1710000000000,
            startAddress: "  Rockville, MD  ",
            endAddress: "  Bethesda coffee stop  ",
            durationMinutes: 55,
            distanceMiles: 14,
            stopCount: 1,
          },
          {
            id: "legacy-trip",
            prompt: "Legacy saved trip",
            createdAt: 1710000000001,
          },
          null,
          {
            id: "bad-prompt",
            prompt: "",
            createdAt: 1710000000002,
          },
          {
            id: 123,
            prompt: "Bad id",
            createdAt: 1710000000003,
          },
          {
            id: "bad-created-at",
            prompt: "Bad created at",
            createdAt: "now",
          },
          {
            id: "bad-stop-count",
            prompt: "Bad stop count",
            createdAt: 1710000000004,
            stopCount: "two",
          },
          {
            id: "bad-duration",
            prompt: "Bad duration",
            createdAt: 1710000000005,
            durationMinutes: 55.5,
          },
          {
            id: "bad-distance",
            prompt: "Bad distance",
            createdAt: 1710000000006,
            distanceMiles: -14,
          },
        ],
        savedPlaces: [
          {
            id: "home",
            label: "  Home  ",
            entryMode: "address",
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
            entryMode: "address",
            address: "Somewhere",
            city: 123,
          },
          {
            id: "bad-mode",
            label: "Bad mode",
            entryMode: "postal",
            address: "Somewhere",
          },
          {
            id: "bad-coordinates",
            label: "Bad Coordinates",
            entryMode: "coordinates",
            address: "",
            latitude: 38.9,
          },
          {
            id: "trailhead",
            label: "Trailhead",
            entryMode: "coordinates",
            address: "",
            latitude: 38.9,
            longitude: -77.01,
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
          entryMode: "address",
          address: "123 Main St",
          city: "Washington",
          state: "DC",
          country: "United States",
          zipCode: "20500",
          latitude: 38.9,
          longitude: undefined,
        },
        {
          id: "trailhead",
          label: "Trailhead",
          entryMode: "coordinates",
          address: "",
          latitude: 38.9,
          longitude: -77.01,
        },
        {
          id: "office",
          label: "Office",
          entryMode: "address",
          address: "456 Center Ave",
          latitude: undefined,
          longitude: -77.01,
        },
      ],
      previousTrips: [
        {
          id: "trip-1",
          prompt: "Find coffee on the way",
          createdAt: 1710000000000,
          route: [
            {
              address: "Rockville, MD",
            },
            {
              address: "Bethesda coffee stop",
            },
          ],
          startAddress: "Rockville, MD",
          endAddress: "Bethesda coffee stop",
          durationMinutes: 55,
          distanceMiles: 14,
          stopCount: 1,
        },
        {
          id: "legacy-trip",
          prompt: "Legacy saved trip",
          createdAt: 1710000000001,
        },
      ],
      preferences: [],
      themeMode: "auto",
      accentTheme: "navy",
      routeSettings: defaultRouteSettings,
    });
  });

  it("loads default route settings when older storage has no routeSettings", () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        preferredNavigator: "google-maps",
        savedPlaces: [],
        preferences: [],
        themeMode: "auto",
        accentTheme: "ground",
      }),
    );

    expect(loadSettings().routeSettings).toEqual(defaultRouteSettings);
  });

  it("normalizes partial and invalid route settings", () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        routeSettings: {
          travelMode: "pedestrian",
          auto: { tollPreference: 99 },
          pedestrian: { walkingSpeedKph: 40, stepPenaltySeconds: 60 },
        },
      }),
    );

    const loaded = loadSettings();

    expect(loaded.routeSettings.travelMode).toBe("pedestrian");
    expect(loaded.routeSettings.auto.tollPreference).toBe(
      defaultRouteSettings.auto.tollPreference,
    );
    expect(loaded.routeSettings.pedestrian.walkingSpeedKph).toBe(25);
    expect(loaded.routeSettings.pedestrian.stepPenaltySeconds).toBe(60);
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

  it("persists valid theme modes and accent themes with defaults for invalid values", () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ themeMode: "dark", accentTheme: "rock" }),
    );
    expect(loadSettings().themeMode).toBe("dark");
    expect(loadSettings().accentTheme).toBe("rock");

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ themeMode: "sepia", accentTheme: "forest" }),
    );
    expect(loadSettings().themeMode).toBe("auto");
    expect(loadSettings().accentTheme).toBe("ground");

    window.localStorage.setItem(storageKey, JSON.stringify({}));
    expect(loadSettings().themeMode).toBe("auto");
    expect(loadSettings().accentTheme).toBe("ground");
  });

  it("saves settings to local storage", () => {
    const settings: RoadMuseSettings = {
      preferredNavigator: "here-wego",
      savedPlaces: [
        {
          id: "office",
          label: "Office",
          entryMode: "address",
          address: "456 Center Ave",
          city: "Washington",
          state: "DC",
          country: "United States",
          zipCode: "20001",
          latitude: 38.8977,
          longitude: -77.0365,
        },
      ],
      previousTrips: [
        {
          id: "trip-1",
          prompt: "Find a quiet lunch stop",
          createdAt: 1710000000000,
          route: [
            {
              address: "Rockville, MD",
              latitude: 39.084,
              longitude: -77.1528,
            },
            {
              address: "National Mall",
              latitude: 38.8895,
              longitude: -77.0353,
            },
          ],
          startAddress: "Rockville, MD",
          endAddress: "National Mall",
          durationMinutes: 55,
          distanceMiles: 14,
          stopCount: 0,
        },
      ],
      preferences: [],
      themeMode: "dark",
      accentTheme: "rock",
      routeSettings: {
        ...defaultRouteSettings,
        travelMode: "pedestrian",
        alternates: 2,
      },
    };

    saveSettings(settings);

    expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")).toEqual(settings);
    expect(loadSettings().routeSettings.travelMode).toBe("pedestrian");
    expect(loadSettings().routeSettings.alternates).toBe(2);
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
