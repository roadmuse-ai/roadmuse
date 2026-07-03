export const wazeBaseUrl = "https://waze.com/ul";

export interface WazeCoordinates {
  latitude: number;
  longitude: number;
}

/** Waze `avoid_trails` values; unlike the other avoid flags it is not a boolean. */
export const wazeAvoidTrailsOptions = ["avoid_all", "allow", "avoid_long"] as const;
export type WazeAvoidTrails = (typeof wazeAvoidTrailsOptions)[number];

export const wazeVehicleTypes = ["private", "taxi", "motorcycle"] as const;
export type WazeVehicleType = (typeof wazeVehicleTypes)[number];

export interface WazeLinkRequest {
  /** Free-text search, e.g. an address or place name (`q`). */
  query?: string;
  /** Exact destination, or a location hint when combined with a query (`ll`). */
  coordinates?: WazeCoordinates;
  /** Start turn-by-turn navigation on open. Defaults to true. */
  navigate?: boolean;
  /** Map magnification when not navigating. */
  zoom?: number;
  avoidTolls?: boolean;
  avoidFerries?: boolean;
  avoidFreeways?: boolean;
  avoidDangerousTurns?: boolean;
  avoidTrails?: WazeAvoidTrails;
  vehicleType?: WazeVehicleType;
  /**
   * Waze deep links have no waypoint parameter. Any waypoints provided are
   * dropped from the URL and reported through `warnings`.
   */
  waypoints?: WazeCoordinates[];
}

export interface WazeLinkResult {
  url: string;
  warnings: string[];
}

export const wazeWaypointWarning =
  "Waze cannot receive waypoints through deep links, so intermediate stops were " +
  "dropped and Waze will route directly to the destination. For multi-stop " +
  "handoff use HERE WeGo, Organic Maps, or GPX export.";

const formatCoordinates = ({ latitude, longitude }: WazeCoordinates): string => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Waze link coordinates must be finite numbers.");
  }

  return `${latitude},${longitude}`;
};

/**
 * Builds a https://waze.com/ul deep link per the official parameter set.
 * Avoid flags are only included when explicitly set so Waze's own defaults
 * (e.g. avoid_dangerous_turns=true) keep applying otherwise.
 */
export function buildWazeLink(request: WazeLinkRequest): WazeLinkResult {
  const query = request.query?.trim();
  if (!query && !request.coordinates) {
    throw new Error("A Waze link requires a search query or destination coordinates.");
  }

  const params: Array<[string, string]> = [];

  if (query) {
    params.push(["q", query]);
  }

  if (request.coordinates) {
    params.push(["ll", formatCoordinates(request.coordinates)]);
  }

  if (request.navigate !== false) {
    params.push(["navigate", "yes"]);
  }

  if (request.zoom !== undefined) {
    params.push(["z", String(request.zoom)]);
  }

  const avoidFlags: Array<[string, boolean | undefined]> = [
    ["avoid_tolls", request.avoidTolls],
    ["avoid_ferries", request.avoidFerries],
    ["avoid_freeways", request.avoidFreeways],
    ["avoid_dangerous_turns", request.avoidDangerousTurns],
  ];
  for (const [name, value] of avoidFlags) {
    if (value !== undefined) {
      params.push([name, value ? "true" : "false"]);
    }
  }

  if (request.avoidTrails !== undefined) {
    params.push(["avoid_trails", request.avoidTrails]);
  }

  if (request.vehicleType !== undefined) {
    params.push(["vehicle_type", request.vehicleType]);
  }

  params.push(["utm_source", "roadmuse"]);

  // encodeURIComponent (not URLSearchParams) so spaces become %20 as the
  // Waze docs require, rather than "+".
  const queryString = params
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .join("&");

  const warnings: string[] = [];
  if (request.waypoints && request.waypoints.length > 0) {
    warnings.push(wazeWaypointWarning);
  }

  return {
    url: `${wazeBaseUrl}?${queryString}`,
    warnings,
  };
}
