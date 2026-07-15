import {
  type TextPreference,
  isTextPreference,
  normalizeTextPreference,
} from "./preferences";
import {
  type RouteSettings,
  defaultRouteSettings,
  normalizeRouteSettings,
} from "./routeSettings";
import { type AccentTheme, type ThemeMode, isAccentTheme, isThemeMode } from "./theme";

export const storageKey = "roadmuse-settings-v1";

export type {
  AutoRouteSettings,
  BicycleRouteSettings,
  DistanceUnits,
  PedestrianRouteSettings,
  RouteSettings,
  RouteTravelMode,
  ValhallaScale,
} from "./routeSettings";
export {
  compileValhallaRouteRequest,
  defaultRouteSettings,
  normalizeRouteSettings,
} from "./routeSettings";

export const navigatorIds = [
  "google-maps",
  "waze",
  "apple-maps",
  "here-wego",
  "organic-maps",
  "gpx-export",
] as const;

export type NavigatorId = (typeof navigatorIds)[number];

export const navigatorLabels: Record<NavigatorId, string> = {
  "google-maps": "Google Maps",
  waze: "Waze",
  "apple-maps": "Apple Maps",
  "here-wego": "HERE WeGo",
  "organic-maps": "Organic Maps",
  "gpx-export": "GPX Export",
};

export interface RoadMuseSettings {
  preferredNavigator: NavigatorId;
  savedPlaces: SavedPlace[];
  previousTrips: PreviousTrip[];
  preferences: TextPreference[];
  themeMode: ThemeMode;
  accentTheme: AccentTheme;
  routeSettings: RouteSettings;
}

export const defaultSettings: RoadMuseSettings = {
  preferredNavigator: "google-maps",
  savedPlaces: [],
  previousTrips: [],
  preferences: [],
  themeMode: "auto",
  accentTheme: "patriotic",
  routeSettings: defaultRouteSettings,
};

export type SavedPlaceEntryMode = "address" | "coordinates";

export interface SavedPlace {
  id: string;
  label: string;
  entryMode?: SavedPlaceEntryMode;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface RouteWaypoint {
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface PreviousTrip {
  id: string;
  prompt: string;
  createdAt: number;
  route?: RouteWaypoint[];
  startAddress?: string;
  endAddress?: string;
  durationMinutes?: number;
  distanceMiles?: number;
  stopCount?: number;
}

const isOptionalString = (value: unknown): value is string | undefined => {
  return value === undefined || typeof value === "string";
};

const isOptionalNonNegativeInteger = (
  value: unknown,
): value is number | undefined => {
  return (
    value === undefined ||
    (typeof value === "number" && Number.isInteger(value) && value >= 0)
  );
};

const isOptionalNonNegativeNumber = (
  value: unknown,
): value is number | undefined => {
  return (
    value === undefined ||
    (typeof value === "number" && Number.isFinite(value) && value >= 0)
  );
};

const isSavedPlaceEntryMode = (value: unknown): value is SavedPlaceEntryMode => {
  return value === undefined || value === "address" || value === "coordinates";
};

const isSavedPlace = (value: unknown): value is SavedPlace => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== "string" || typeof candidate.label !== "string") {
    return false;
  }

  if (typeof candidate.address !== "string") {
    return false;
  }

  if (!isSavedPlaceEntryMode(candidate.entryMode)) {
    return false;
  }

  if (
    !isOptionalString(candidate.city) ||
    !isOptionalString(candidate.state) ||
    !isOptionalString(candidate.country) ||
    !isOptionalString(candidate.zipCode)
  ) {
    return false;
  }

  if (candidate.latitude !== undefined && typeof candidate.latitude !== "number") {
    return false;
  }

  if (candidate.longitude !== undefined && typeof candidate.longitude !== "number") {
    return false;
  }

  const entryMode = candidate.entryMode ?? "address";
  const hasAddress = candidate.address.trim().length > 0;
  const hasCoordinates =
    Number.isFinite(candidate.latitude) && Number.isFinite(candidate.longitude);

  return (
    candidate.label.trim().length > 0 &&
    (entryMode === "coordinates" ? hasCoordinates : hasAddress)
  );
};

const isRouteWaypoint = (value: unknown): value is RouteWaypoint => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (!isOptionalString(candidate.address)) {
    return false;
  }

  if (candidate.latitude !== undefined && typeof candidate.latitude !== "number") {
    return false;
  }

  if (candidate.longitude !== undefined && typeof candidate.longitude !== "number") {
    return false;
  }

  const hasAddress =
    typeof candidate.address === "string" && candidate.address.trim().length > 0;
  const hasCoordinates =
    Number.isFinite(candidate.latitude) && Number.isFinite(candidate.longitude);

  return hasAddress || hasCoordinates;
};

const isPreviousTrip = (value: unknown): value is PreviousTrip => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.prompt === "string" &&
    candidate.prompt.trim().length > 0 &&
    typeof candidate.createdAt === "number" &&
    Number.isFinite(candidate.createdAt) &&
    (candidate.route === undefined ||
      (Array.isArray(candidate.route) && candidate.route.every(isRouteWaypoint))) &&
    isOptionalString(candidate.startAddress) &&
    isOptionalString(candidate.endAddress) &&
    isOptionalNonNegativeInteger(candidate.durationMinutes) &&
    isOptionalNonNegativeNumber(candidate.distanceMiles) &&
    isOptionalNonNegativeInteger(candidate.stopCount)
  );
};

const normalizeOptionalText = (value?: string): string | undefined => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

const normalizeSavedPlace = (raw: SavedPlace): SavedPlace => {
  const entryMode = raw.entryMode ?? "address";
  const normalized: SavedPlace = {
    id: raw.id,
    label: raw.label.trim(),
    entryMode,
    address: raw.address.trim(),
    latitude: Number.isFinite(raw.latitude) ? raw.latitude : undefined,
    longitude: Number.isFinite(raw.longitude) ? raw.longitude : undefined,
  };

  if (entryMode === "coordinates") {
    return normalized;
  }

  const city = normalizeOptionalText(raw.city);
  const state = normalizeOptionalText(raw.state);
  const country = normalizeOptionalText(raw.country);
  const zipCode = normalizeOptionalText(raw.zipCode);

  if (city) {
    normalized.city = city;
  }

  if (state) {
    normalized.state = state;
  }

  if (country) {
    normalized.country = country;
  }

  if (zipCode) {
    normalized.zipCode = zipCode;
  }

  return normalized;
};

const normalizeRouteWaypoint = (raw: RouteWaypoint): RouteWaypoint => {
  const normalized: RouteWaypoint = {};
  const address = normalizeOptionalText(raw.address);

  if (address) {
    normalized.address = address;
  }

  if (Number.isFinite(raw.latitude) && Number.isFinite(raw.longitude)) {
    normalized.latitude = raw.latitude;
    normalized.longitude = raw.longitude;
  }

  return normalized;
};

const normalizePreviousTrip = (raw: PreviousTrip): PreviousTrip => {
  const normalized: PreviousTrip = {
    id: raw.id,
    prompt: raw.prompt.trim(),
    createdAt: raw.createdAt,
  };

  const startAddress = normalizeOptionalText(raw.startAddress);
  const endAddress = normalizeOptionalText(raw.endAddress);
  const route = Array.isArray(raw.route)
    ? raw.route.map(normalizeRouteWaypoint).filter(isRouteWaypoint)
    : [];

  if (route.length > 0) {
    normalized.route = route;
  }

  const normalizedStartAddress = route[0]?.address ?? startAddress;
  const normalizedEndAddress = route[route.length - 1]?.address ?? endAddress;

  if (normalizedStartAddress) {
    normalized.startAddress = normalizedStartAddress;
  }

  if (normalizedEndAddress) {
    normalized.endAddress = normalizedEndAddress;
  }

  if (!normalized.route && normalizedStartAddress && normalizedEndAddress) {
    normalized.route = [
      { address: normalizedStartAddress },
      { address: normalizedEndAddress },
    ];
  }

  if (raw.durationMinutes !== undefined) {
    normalized.durationMinutes = raw.durationMinutes;
  }

  if (raw.distanceMiles !== undefined) {
    normalized.distanceMiles = raw.distanceMiles;
  }

  if (raw.stopCount !== undefined) {
    normalized.stopCount = raw.stopCount;
  }

  return normalized;
};

const isNavigatorId = (value: unknown): value is NavigatorId => {
  return typeof value === "string" && (navigatorIds as readonly string[]).includes(value);
};

export function loadSettings(): RoadMuseSettings {
  if (typeof window === "undefined" || !("localStorage" in window)) {
    return defaultSettings;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return defaultSettings;
    }

    const parsed = JSON.parse(raw) as Partial<RoadMuseSettings> & {
      savedPlaces?: unknown;
      previousTrips?: unknown;
      preferences?: unknown;
    };

    const preferredNavigator = isNavigatorId(parsed.preferredNavigator)
      ? parsed.preferredNavigator
      : defaultSettings.preferredNavigator;

    const savedPlaces = Array.isArray(parsed.savedPlaces)
      ? parsed.savedPlaces.filter(isSavedPlace).map(normalizeSavedPlace)
      : defaultSettings.savedPlaces;

    const preferences = Array.isArray(parsed.preferences)
      ? parsed.preferences.filter(isTextPreference).map(normalizeTextPreference)
      : defaultSettings.preferences;

    const previousTrips = Array.isArray(parsed.previousTrips)
      ? parsed.previousTrips.filter(isPreviousTrip).map(normalizePreviousTrip)
      : defaultSettings.previousTrips;

    const themeMode = isThemeMode(parsed.themeMode)
      ? parsed.themeMode
      : defaultSettings.themeMode;

    const accentTheme = isAccentTheme(parsed.accentTheme)
      ? parsed.accentTheme
      : defaultSettings.accentTheme;

    const routeSettings = normalizeRouteSettings(parsed.routeSettings);

    return {
      preferredNavigator,
      savedPlaces,
      previousTrips,
      preferences,
      themeMode,
      accentTheme,
      routeSettings,
    };
  } catch {
    // Swallow malformed data and fall back to defaults.
  }

  return defaultSettings;
}

export function saveSettings(settings: RoadMuseSettings): void {
  if (typeof window === "undefined" || !("localStorage" in window)) {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
  } catch {
    // Ignore write failures in restricted or private environments.
  }
}
