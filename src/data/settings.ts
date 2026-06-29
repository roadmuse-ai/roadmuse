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
}

export const defaultSettings: RoadMuseSettings = {
  preferredNavigator: "google-maps",
  savedPlaces: [],
};

export interface SavedPlace {
  id: string;
  label: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

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

  if (candidate.latitude !== undefined && typeof candidate.latitude !== "number") {
    return false;
  }

  if (candidate.longitude !== undefined && typeof candidate.longitude !== "number") {
    return false;
  }

  return candidate.label.trim().length > 0 && candidate.address.trim().length > 0;
};

const normalizeSavedPlace = (raw: SavedPlace): SavedPlace => ({
  id: raw.id,
  label: raw.label.trim(),
  address: raw.address.trim(),
  latitude: Number.isFinite(raw.latitude) ? raw.latitude : undefined,
  longitude: Number.isFinite(raw.longitude) ? raw.longitude : undefined,
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
    };

    const preferredNavigator = isNavigatorId(parsed.preferredNavigator)
      ? parsed.preferredNavigator
      : defaultSettings.preferredNavigator;

    const savedPlaces = Array.isArray(parsed.savedPlaces)
      ? parsed.savedPlaces.filter(isSavedPlace).map(normalizeSavedPlace)
      : defaultSettings.savedPlaces;

    return {
      preferredNavigator,
      savedPlaces,
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
