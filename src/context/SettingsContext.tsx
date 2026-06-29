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
  type RoadMuseSettings,
  type SavedPlaceKey,
  defaultSettings,
  loadSettings,
  saveSettings,
} from "../data/settings";

interface SettingsContextValue {
  settings: RoadMuseSettings;
  setPreferredNavigator: (navigatorId: NavigatorId) => void;
  setSavedPlace: (key: SavedPlaceKey, value: string) => void;
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

  const setSavedPlace = useCallback((key: SavedPlaceKey, value: string) => {
    setSettings((current) => ({
      ...current,
      savedPlaces: {
        ...current.savedPlaces,
        [key]: value,
      },
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const value = useMemo(
    () => ({
      settings,
      setPreferredNavigator,
      setSavedPlace,
      resetSettings,
    }),
    [settings, setPreferredNavigator, setSavedPlace, resetSettings],
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
