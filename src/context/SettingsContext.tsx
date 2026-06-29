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

interface SettingsContextValue {
  settings: RoadMuseSettings;
  setPreferredNavigator: (navigatorId: NavigatorId) => void;
  addSavedPlace: (place: Omit<SavedPlace, "id">) => void;
  updateSavedPlace: (id: string, updates: Partial<SavedPlace>) => void;
  removeSavedPlace: (id: string) => void;
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

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const value = useMemo(
    () => ({
      settings,
      setPreferredNavigator,
      addSavedPlace,
      updateSavedPlace,
      removeSavedPlace,
      resetSettings,
    }),
    [
      settings,
      setPreferredNavigator,
      addSavedPlace,
      updateSavedPlace,
      removeSavedPlace,
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
