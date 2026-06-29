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
}

export const defaultSettings: RoadMuseSettings = {
  preferredNavigator: "google-maps",
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

    const parsed = JSON.parse(raw) as Partial<RoadMuseSettings>;
    if (isNavigatorId(parsed.preferredNavigator)) {
      return parsed as RoadMuseSettings;
    }
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
