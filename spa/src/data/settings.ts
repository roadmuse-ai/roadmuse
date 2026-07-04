import {
  type TextPreference,
  isTextPreference,
  normalizeTextPreference,
} from "./preferences";
import { type AccentTheme, type ThemeMode, isAccentTheme, isThemeMode } from "./theme";

export const storageKey = "roadmuse-settings-v1";

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
}

export const defaultSettings: RoadMuseSettings = {
  preferredNavigator: "google-maps",
  savedPlaces: [],
  previousTrips: [],
  preferences: [],
  themeMode: "auto",
  accentTheme: "ground",
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

export interface PreviousTrip {
  id: string;
  prompt: string;
  createdAt: number;
}

const isOptionalString = (value: unknown): value is string | undefined => {
  return value === undefined || typeof value === "string";
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
    Number.isFinite(candidate.createdAt)
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

const normalizePreviousTrip = (raw: PreviousTrip): PreviousTrip => ({
  id: raw.id,
  prompt: raw.prompt.trim(),
  createdAt: raw.createdAt,
});

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

    return {
      preferredNavigator,
      savedPlaces,
      previousTrips,
      preferences,
      themeMode,
      accentTheme,
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
