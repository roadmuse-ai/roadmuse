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
  type SavedPlace,
  type RoadMuseSettings,
  defaultSettings,
  loadSettings,
  saveSettings,
} from "../data/settings";
import { type TextPreference, createEmptyPreference } from "../data/preferences";
import { type ThemeMode } from "../data/theme";

interface SettingsContextValue {
  settings: RoadMuseSettings;
  setPreferredNavigator: (navigatorId: NavigatorId) => void;
  setThemeMode: (mode: ThemeMode) => void;
  addSavedPlace: (place: Omit<SavedPlace, "id">) => void;
  updateSavedPlace: (id: string, updates: Partial<SavedPlace>) => void;
  removeSavedPlace: (id: string) => void;
  addPreference: () => string;
  updatePreference: (id: string, updates: Partial<TextPreference>) => void;
  removePreference: (id: string) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

interface SettingsProviderProps {
  children: ReactNode;
}

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
      addSavedPlace,
      updateSavedPlace,
      removeSavedPlace,
      addPreference,
      updatePreference,
      removePreference,
      resetSettings,
    }),
    [
      settings,
      setPreferredNavigator,
      setThemeMode,
      addSavedPlace,
      updateSavedPlace,
      removeSavedPlace,
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
