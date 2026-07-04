import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type NavigatorId,
  type PreviousTrip,
  type RouteWaypoint,
  type SavedPlace,
  type RoadMuseSettings,
  defaultSettings,
  loadSettings,
  saveSettings,
} from "../data/settings";
import { type TextPreference, createEmptyPreference } from "../data/preferences";
import { type AccentTheme, type ThemeMode } from "../data/theme";

interface SettingsContextValue {
  settings: RoadMuseSettings;
  setPreferredNavigator: (navigatorId: NavigatorId) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentTheme: (accentTheme: AccentTheme) => void;
  addSavedPlace: (place: Omit<SavedPlace, "id">) => void;
  updateSavedPlace: (id: string, updates: Partial<SavedPlace>) => void;
  removeSavedPlace: (id: string) => void;
  addPreviousTrip: (
    prompt: string,
    details?: Omit<PreviousTrip, "id" | "prompt" | "createdAt">,
  ) => string | null;
  removePreviousTrip: (id: string) => void;
  addPreference: () => string;
  updatePreference: (id: string, updates: Partial<TextPreference>) => void;
  removePreference: (id: string) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

interface SettingsProviderProps {
  children: ReactNode;
}

const normalizeRouteWaypoint = (waypoint: RouteWaypoint): RouteWaypoint | null => {
  const address = waypoint.address?.trim();
  const hasCoordinates =
    Number.isFinite(waypoint.latitude) && Number.isFinite(waypoint.longitude);

  if (!address && !hasCoordinates) {
    return null;
  }

  return {
    address: address || undefined,
    latitude: hasCoordinates ? waypoint.latitude : undefined,
    longitude: hasCoordinates ? waypoint.longitude : undefined,
  };
};

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<RoadMuseSettings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const setPreferredNavigator = useCallback((navigatorId: NavigatorId) => {
    setSettings((current) => ({ ...current, preferredNavigator: navigatorId }));
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setSettings((current) => ({ ...current, themeMode: mode }));
  }, []);

  const setAccentTheme = useCallback((accentTheme: AccentTheme) => {
    setSettings((current) => ({ ...current, accentTheme }));
  }, []);

  const addSavedPlace = useCallback((place: Omit<SavedPlace, "id">) => {
    setSettings((current) => ({
      ...current,
      savedPlaces: [
        ...current.savedPlaces,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          ...place,
        },
      ],
    }));
  }, []);

  const updateSavedPlace = useCallback((id: string, updates: Partial<SavedPlace>) => {
    setSettings((current) => ({
      ...current,
      savedPlaces: current.savedPlaces.map((entry) =>
        entry.id === id ? { ...entry, ...updates, id: entry.id } : entry,
      ),
    }));
  }, []);

  const removeSavedPlace = useCallback((id: string) => {
    setSettings((current) => ({
      ...current,
      savedPlaces: current.savedPlaces.filter((entry) => entry.id !== id),
    }));
  }, []);

  const addPreviousTrip = useCallback(
    (
      prompt: string,
      details?: Omit<PreviousTrip, "id" | "prompt" | "createdAt">,
    ) => {
      const normalizedPrompt = prompt.trim();

      if (!normalizedPrompt) {
        return null;
      }

      const route =
        details?.route
          ?.map(normalizeRouteWaypoint)
          .filter((waypoint): waypoint is RouteWaypoint => waypoint !== null) ?? [];
      const startAddress = details?.startAddress?.trim() || route[0]?.address;
      const endAddress =
        details?.endAddress?.trim() || route[route.length - 1]?.address;
      const createdAt = Date.now();
      const trip: PreviousTrip = {
        id: `${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
        prompt: normalizedPrompt,
        createdAt,
      };

      if (route.length > 0) {
        trip.route = route;
      }

      if (startAddress) {
        trip.startAddress = startAddress;
      }

      if (endAddress) {
        trip.endAddress = endAddress;
      }

      if (
        details?.durationMinutes !== undefined &&
        Number.isInteger(details.durationMinutes) &&
        details.durationMinutes >= 0
      ) {
        trip.durationMinutes = details.durationMinutes;
      }

      if (
        details?.distanceMiles !== undefined &&
        Number.isFinite(details.distanceMiles) &&
        details.distanceMiles >= 0
      ) {
        trip.distanceMiles = details.distanceMiles;
      }

      if (
        details?.stopCount !== undefined &&
        Number.isInteger(details.stopCount) &&
        details.stopCount >= 0
      ) {
        trip.stopCount = details.stopCount;
      } else if (route.length >= 2) {
        trip.stopCount = Math.max(0, route.length - 2);
      }

      setSettings((current) => ({
        ...current,
        previousTrips: [trip, ...current.previousTrips],
      }));

      return trip.id;
    },
    [],
  );

  const removePreviousTrip = useCallback((id: string) => {
    setSettings((current) => ({
      ...current,
      previousTrips: current.previousTrips.filter((entry) => entry.id !== id),
    }));
  }, []);

  const addPreference = useCallback(() => {
    const preference = createEmptyPreference();

    setSettings((current) => ({
      ...current,
      preferences: [...current.preferences, preference],
    }));

    return preference.id;
  }, []);

  const updatePreference = useCallback((id: string, updates: Partial<TextPreference>) => {
    setSettings((current) => ({
      ...current,
      preferences: current.preferences.map((entry) =>
        entry.id === id ? { ...entry, ...updates, id: entry.id } : entry,
      ),
    }));
  }, []);

  const removePreference = useCallback((id: string) => {
    setSettings((current) => ({
      ...current,
      preferences: current.preferences.filter((entry) => entry.id !== id),
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const value = useMemo(
    () => ({
      settings,
      setPreferredNavigator,
      setThemeMode,
      setAccentTheme,
      addSavedPlace,
      updateSavedPlace,
      removeSavedPlace,
      addPreviousTrip,
      removePreviousTrip,
      addPreference,
      updatePreference,
      removePreference,
      resetSettings,
    }),
    [
      settings,
      setPreferredNavigator,
      setThemeMode,
      setAccentTheme,
      addSavedPlace,
      updateSavedPlace,
      removeSavedPlace,
      addPreviousTrip,
      removePreviousTrip,
      addPreference,
      updatePreference,
      removePreference,
      resetSettings,
    ],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
