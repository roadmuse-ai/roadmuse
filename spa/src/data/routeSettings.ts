export type RouteTravelMode = "auto" | "bicycle" | "pedestrian";
export type DistanceUnits = "miles" | "kilometers";
export type ValhallaScale = 0 | 0.25 | 0.5 | 0.75 | 1;

export interface RouteSettings {
  travelMode: RouteTravelMode;
  units: DistanceUnits;
  alternates: 0 | 1 | 2;
  auto: AutoRouteSettings;
  bicycle: BicycleRouteSettings;
  pedestrian: PedestrianRouteSettings;
}

export interface AutoRouteSettings {
  tollPreference: ValhallaScale; // maps to costing_options.auto.use_tolls
  highwayPreference: ValhallaScale; // maps to costing_options.auto.use_highways
  ferryPreference: ValhallaScale; // maps to costing_options.auto.use_ferry
  excludeUnpaved: boolean; // maps to costing_options.auto.exclude_unpaved
  excludeCashOnlyTolls: boolean; // maps to costing_options.auto.exclude_cash_only_tolls
  includeHov2: boolean; // maps to costing_options.auto.include_hov2
  includeHov3: boolean; // maps to costing_options.auto.include_hov3
  includeHot: boolean; // maps to costing_options.auto.include_hot
  maneuverPenaltySeconds: 5 | 30 | 60; // maps to costing_options.auto.maneuver_penalty
  shortest: boolean; // maps to costing_options.auto.shortest
}

export interface BicycleRouteSettings {
  bicycleType: "road" | "hybrid" | "city" | "cross" | "mountain";
  roadComfort: ValhallaScale; // maps to costing_options.bicycle.use_roads
  hillComfort: ValhallaScale; // maps to costing_options.bicycle.use_hills
  ferryPreference: ValhallaScale; // maps to costing_options.bicycle.use_ferry
  avoidBadSurfaces: ValhallaScale; // maps to costing_options.bicycle.avoid_bad_surfaces
}

export interface PedestrianRouteSettings {
  walkingSpeedKph: number; // maps to costing_options.pedestrian.walking_speed
  hillComfort: ValhallaScale; // maps to costing_options.pedestrian.use_hills
  litStreetPreference: ValhallaScale; // maps to costing_options.pedestrian.use_lit
  ferryPreference: ValhallaScale; // maps to costing_options.pedestrian.use_ferry
  stepPenaltySeconds: 0 | 60 | 300; // maps to costing_options.pedestrian.step_penalty
}

export const routeTravelModes: RouteTravelMode[] = ["auto"];

export const routeTravelModeLabels: Record<RouteTravelMode, string> = {
  auto: "Driving",
  bicycle: "Bicycle",
  pedestrian: "Walking",
};

export const distanceUnits: DistanceUnits[] = ["miles", "kilometers"];

export const distanceUnitLabels: Record<DistanceUnits, string> = {
  miles: "Miles",
  kilometers: "Kilometers",
};

export const valhallaScales: ValhallaScale[] = [0, 0.25, 0.5, 0.75, 1];

/** Driving / ferry scales in the Config UI: Avoid / Neutral / Prefer. */
export const avoidNeutralPreferScales = [0, 0.5, 1] as const satisfies readonly ValhallaScale[];

export const avoidNeutralPreferLabels: Record<
  (typeof avoidNeutralPreferScales)[number],
  string
> = {
  0: "Avoid",
  0.5: "Neutral",
  1: "Prefer",
};

/** Comfort scales for bicycle roads/hills and pedestrian hills. */
export const comfortScaleLabels: Record<ValhallaScale, string> = {
  0: "Very low",
  0.25: "Low",
  0.5: "Neutral",
  0.75: "High",
  1: "Very high",
};

/** Strength scales for lit streets and bad-surface avoidance. */
export const strengthScaleLabels: Record<ValhallaScale, string> = {
  0: "Off",
  0.25: "Low",
  0.5: "Medium",
  0.75: "High",
  1: "Strict",
};

export const alternateCounts = [0, 1, 2] as const;

export const alternateCountLabels: Record<0 | 1 | 2, string> = {
  0: "None",
  1: "1 alternate",
  2: "2 alternates",
};

export const maneuverPenaltyLabels: Record<AutoRouteSettings["maneuverPenaltySeconds"], string> =
  {
    5: "Standard",
    30: "Simpler",
    60: "Fewest turns",
  };

export const stepPenaltyLabels: Record<PedestrianRouteSettings["stepPenaltySeconds"], string> =
  {
    0: "No preference",
    60: "Avoid",
    300: "Strongly avoid",
  };

export const bicycleTypeLabels: Record<BicycleRouteSettings["bicycleType"], string> = {
  road: "Road",
  hybrid: "Hybrid",
  city: "City",
  cross: "Cyclocross",
  mountain: "Mountain",
};

export const bicycleTypes = Object.keys(bicycleTypeLabels) as BicycleRouteSettings["bicycleType"][];

/** Valhalla-supported pedestrian walking_speed range in kph. */
export const walkingSpeedRangeKph = { min: 0.5, max: 25 } as const;

export const defaultRouteSettings: RouteSettings = {
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
};

const isOneOf = <T>(values: readonly T[], value: unknown): value is T =>
  values.includes(value as T);

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

export const isValhallaScale = (value: unknown): value is ValhallaScale =>
  isOneOf(valhallaScales, value);

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const pickScale = (value: unknown, fallback: ValhallaScale): ValhallaScale =>
  isValhallaScale(value) ? value : fallback;

const pickBoolean = (value: unknown, fallback: boolean): boolean =>
  isBoolean(value) ? value : fallback;

const clampWalkingSpeed = (value: unknown, fallback: number): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(value, walkingSpeedRangeKph.min), walkingSpeedRangeKph.max);
};

/**
 * Field-by-field validation against defaults: any missing or invalid value
 * (including everything when the input is not an object) falls back to the
 * default, so corrupt or pre-routeSettings localStorage data always loads.
 */
export function normalizeRouteSettings(value: unknown): RouteSettings {
  const raw = asRecord(value);
  const rawAuto = asRecord(raw.auto);
  const rawBicycle = asRecord(raw.bicycle);
  const rawPedestrian = asRecord(raw.pedestrian);
  const defaults = defaultRouteSettings;

  return {
    travelMode: isOneOf(routeTravelModes, raw.travelMode)
      ? raw.travelMode
      : defaults.travelMode,
    units: isOneOf(distanceUnits, raw.units) ? raw.units : defaults.units,
    alternates: isOneOf(alternateCounts, raw.alternates)
      ? raw.alternates
      : defaults.alternates,
    auto: {
      tollPreference: pickScale(rawAuto.tollPreference, defaults.auto.tollPreference),
      highwayPreference: pickScale(
        rawAuto.highwayPreference,
        defaults.auto.highwayPreference,
      ),
      ferryPreference: pickScale(rawAuto.ferryPreference, defaults.auto.ferryPreference),
      excludeUnpaved: pickBoolean(rawAuto.excludeUnpaved, defaults.auto.excludeUnpaved),
      excludeCashOnlyTolls: pickBoolean(
        rawAuto.excludeCashOnlyTolls,
        defaults.auto.excludeCashOnlyTolls,
      ),
      includeHov2: pickBoolean(rawAuto.includeHov2, defaults.auto.includeHov2),
      includeHov3: pickBoolean(rawAuto.includeHov3, defaults.auto.includeHov3),
      includeHot: pickBoolean(rawAuto.includeHot, defaults.auto.includeHot),
      maneuverPenaltySeconds: isOneOf([5, 30, 60], rawAuto.maneuverPenaltySeconds)
        ? rawAuto.maneuverPenaltySeconds
        : defaults.auto.maneuverPenaltySeconds,
      shortest: pickBoolean(rawAuto.shortest, defaults.auto.shortest),
    },
    bicycle: {
      bicycleType: isOneOf(bicycleTypes, rawBicycle.bicycleType)
        ? rawBicycle.bicycleType
        : defaults.bicycle.bicycleType,
      roadComfort: pickScale(rawBicycle.roadComfort, defaults.bicycle.roadComfort),
      hillComfort: pickScale(rawBicycle.hillComfort, defaults.bicycle.hillComfort),
      ferryPreference: pickScale(
        rawBicycle.ferryPreference,
        defaults.bicycle.ferryPreference,
      ),
      avoidBadSurfaces: pickScale(
        rawBicycle.avoidBadSurfaces,
        defaults.bicycle.avoidBadSurfaces,
      ),
    },
    pedestrian: {
      walkingSpeedKph: clampWalkingSpeed(
        rawPedestrian.walkingSpeedKph,
        defaults.pedestrian.walkingSpeedKph,
      ),
      hillComfort: pickScale(
        rawPedestrian.hillComfort,
        defaults.pedestrian.hillComfort,
      ),
      litStreetPreference: pickScale(
        rawPedestrian.litStreetPreference,
        defaults.pedestrian.litStreetPreference,
      ),
      ferryPreference: pickScale(
        rawPedestrian.ferryPreference,
        defaults.pedestrian.ferryPreference,
      ),
      stepPenaltySeconds: isOneOf([0, 60, 300], rawPedestrian.stepPenaltySeconds)
        ? rawPedestrian.stepPenaltySeconds
        : defaults.pedestrian.stepPenaltySeconds,
    },
  };
}

/** Maps stored auto settings to Valhalla costing_options.auto keys. */
export function compileAutoCostingOptions(
  auto: AutoRouteSettings,
): Record<string, boolean | number> {
  return {
    use_tolls: auto.tollPreference,
    use_highways: auto.highwayPreference,
    use_ferry: auto.ferryPreference,
    exclude_unpaved: auto.excludeUnpaved,
    exclude_cash_only_tolls: auto.excludeCashOnlyTolls,
    include_hov2: auto.includeHov2,
    include_hov3: auto.includeHov3,
    include_hot: auto.includeHot,
    maneuver_penalty: auto.maneuverPenaltySeconds,
    shortest: auto.shortest,
  };
}

/** Maps stored bicycle settings to Valhalla costing_options.bicycle keys. */
export function compileBicycleCostingOptions(
  bicycle: BicycleRouteSettings,
): Record<string, boolean | number | string> {
  return {
    bicycle_type: bicycle.bicycleType,
    use_roads: bicycle.roadComfort,
    use_hills: bicycle.hillComfort,
    use_ferry: bicycle.ferryPreference,
    avoid_bad_surfaces: bicycle.avoidBadSurfaces,
  };
}

/** Maps stored pedestrian settings to Valhalla costing_options.pedestrian keys. */
export function compilePedestrianCostingOptions(
  pedestrian: PedestrianRouteSettings,
): Record<string, boolean | number> {
  return {
    walking_speed: pedestrian.walkingSpeedKph,
    use_hills: pedestrian.hillComfort,
    use_lit: pedestrian.litStreetPreference,
    use_ferry: pedestrian.ferryPreference,
    step_penalty: pedestrian.stepPenaltySeconds,
  };
}

export function compileModeCostingOptions(
  routeSettings: RouteSettings,
): Record<string, boolean | number | string> {
  switch (routeSettings.travelMode) {
    case "auto":
      return compileAutoCostingOptions(routeSettings.auto);
    case "bicycle":
      return compileBicycleCostingOptions(routeSettings.bicycle);
    case "pedestrian":
      return compilePedestrianCostingOptions(routeSettings.pedestrian);
  }
}

/** Ready for the future ValhallaCompiler (story section 6). */
export function compileValhallaRouteRequest(
  routeSettings: RouteSettings,
  locations: unknown[],
) {
  return {
    locations,
    costing: routeSettings.travelMode,
    units: routeSettings.units,
    alternates: routeSettings.alternates,
    costing_options: {
      [routeSettings.travelMode]: compileModeCostingOptions(routeSettings),
    },
  };
}
