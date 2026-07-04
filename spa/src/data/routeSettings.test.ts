import { describe, expect, it } from "vitest";
import { defaultSettings } from "./settings";
import {
  compileAutoCostingOptions,
  compileBicycleCostingOptions,
  compilePedestrianCostingOptions,
  compileValhallaRouteRequest,
  defaultRouteSettings,
  normalizeRouteSettings,
  valhallaScales,
} from "./routeSettings";

describe("defaultRouteSettings", () => {
  it("matches the neutral/safe defaults from the story", () => {
    expect(defaultRouteSettings).toEqual({
      travelMode: "auto",
      units: "miles",
      alternates: 0,
      auto: {
        tollPreference: 0.5,
        highwayPreference: 0.5,
        ferryPreference: 0.5,
        excludeUnpaved: false,
        excludeCashOnlyTolls: false,
        includeHov2: false,
        includeHov3: false,
        includeHot: false,
        maneuverPenaltySeconds: 5,
        shortest: false,
      },
      bicycle: {
        bicycleType: "hybrid",
        roadComfort: 0.25,
        hillComfort: 0.25,
        ferryPreference: 0.5,
        avoidBadSurfaces: 0.25,
      },
      pedestrian: {
        walkingSpeedKph: 5.1,
        hillComfort: 0.5,
        litStreetPreference: 0,
        ferryPreference: 0.5,
        stepPenaltySeconds: 0,
      },
    });
  });

  it("is included on defaultSettings", () => {
    expect(defaultSettings.routeSettings).toEqual(defaultRouteSettings);
  });
});

describe("normalizeRouteSettings", () => {
  it("returns defaults when input is missing or not an object", () => {
    expect(normalizeRouteSettings(undefined)).toEqual(defaultRouteSettings);
    expect(normalizeRouteSettings(null)).toEqual(defaultRouteSettings);
    expect(normalizeRouteSettings("bad")).toEqual(defaultRouteSettings);
  });

  it("preserves valid route settings and resets unsupported travel modes", () => {
    const normalized = normalizeRouteSettings({
      travelMode: "bicycle",
      units: "kilometers",
      alternates: 2,
      auto: { tollPreference: 0 },
      bicycle: { hillComfort: 1 },
      pedestrian: { stepPenaltySeconds: 300 },
    });

    expect(normalized.travelMode).toBe("auto");
    expect(normalized.units).toBe("kilometers");
    expect(normalized.alternates).toBe(2);
    expect(normalized.auto.tollPreference).toBe(0);
    expect(normalized.bicycle.hillComfort).toBe(1);
    expect(normalized.pedestrian.stepPenaltySeconds).toBe(300);
    expect(normalized.auto.highwayPreference).toBe(defaultRouteSettings.auto.highwayPreference);
  });

  it("falls back invalid top-level and nested values to defaults", () => {
    const normalized = normalizeRouteSettings({
      travelMode: "truck",
      units: "yards",
      alternates: 5,
      auto: {
        tollPreference: 0.3,
        maneuverPenaltySeconds: 99,
        shortest: "yes",
      },
      bicycle: { bicycleType: "unicycle" },
      pedestrian: {
        walkingSpeedKph: 100,
        stepPenaltySeconds: 10,
      },
    });

    expect(normalized.travelMode).toBe(defaultRouteSettings.travelMode);
    expect(normalized.units).toBe(defaultRouteSettings.units);
    expect(normalized.alternates).toBe(defaultRouteSettings.alternates);
    expect(normalized.auto.tollPreference).toBe(defaultRouteSettings.auto.tollPreference);
    expect(normalized.auto.maneuverPenaltySeconds).toBe(
      defaultRouteSettings.auto.maneuverPenaltySeconds,
    );
    expect(normalized.auto.shortest).toBe(defaultRouteSettings.auto.shortest);
    expect(normalized.bicycle.bicycleType).toBe(defaultRouteSettings.bicycle.bicycleType);
    expect(normalized.pedestrian.walkingSpeedKph).toBe(25);
    expect(normalized.pedestrian.stepPenaltySeconds).toBe(
      defaultRouteSettings.pedestrian.stepPenaltySeconds,
    );
  });

  it("clamps walking speed to the Valhalla-supported range", () => {
    expect(
      normalizeRouteSettings({ pedestrian: { walkingSpeedKph: 0.1 } }).pedestrian
        .walkingSpeedKph,
    ).toBe(0.5);
    expect(
      normalizeRouteSettings({ pedestrian: { walkingSpeedKph: 30 } }).pedestrian
        .walkingSpeedKph,
    ).toBe(25);
  });

  it("accepts every Valhalla scale value", () => {
    for (const scale of valhallaScales) {
      expect(
        normalizeRouteSettings({ auto: { tollPreference: scale } }).auto.tollPreference,
      ).toBe(scale);
    }
  });
});

describe("compileValhallaRouteRequest", () => {
  it("maps route settings to the future Valhalla request shape", () => {
    const routeSettings = normalizeRouteSettings({
      travelMode: "auto",
      units: "kilometers",
      alternates: 1,
      auto: {
        tollPreference: 0,
        highwayPreference: 1,
        ferryPreference: 0.5,
        excludeUnpaved: true,
        maneuverPenaltySeconds: 30,
      },
    });

    const locations = [{ lat: 38.9, lon: -77.0 }];

    expect(compileValhallaRouteRequest(routeSettings, locations)).toEqual({
      locations,
      costing: "auto",
      units: "kilometers",
      alternates: 1,
      costing_options: {
        auto: {
          use_tolls: 0,
          use_highways: 1,
          use_ferry: 0.5,
          exclude_unpaved: true,
          exclude_cash_only_tolls: false,
          include_hov2: false,
          include_hov3: false,
          include_hot: false,
          maneuver_penalty: 30,
          shortest: false,
        },
      },
    });
  });

  it("maps bicycle and pedestrian mode options", () => {
    const bicycle = normalizeRouteSettings({ travelMode: "bicycle" });
    expect(compileBicycleCostingOptions(bicycle.bicycle)).toMatchObject({
      bicycle_type: "hybrid",
      use_roads: 0.25,
      use_hills: 0.25,
    });

    const pedestrian = normalizeRouteSettings({
      travelMode: "pedestrian",
      pedestrian: { walkingSpeedKph: 4.5, stepPenaltySeconds: 60 },
    });
    expect(compilePedestrianCostingOptions(pedestrian.pedestrian)).toEqual({
      walking_speed: 4.5,
      use_hills: 0.5,
      use_lit: 0,
      use_ferry: 0.5,
      step_penalty: 60,
    });
    expect(compileAutoCostingOptions(defaultRouteSettings.auto).use_tolls).toBe(0.5);
  });
});
