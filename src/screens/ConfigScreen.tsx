import { useMemo, useState } from "react";
import {
  type NavigatorId,
  navigatorIds,
  navigatorLabels,
  type SavedPlaceKey,
} from "../data/settings";
import { useSettings } from "../context/SettingsContext";

export function ConfigScreen() {
  const { settings, setPreferredNavigator, setSavedPlace, resetSettings } =
    useSettings();

  const [homeDraft, setHomeDraft] = useState(settings.savedPlaces.home);
  const [workDraft, setWorkDraft] = useState(settings.savedPlaces.work);

  const placeFields: { key: SavedPlaceKey; title: string }[] = useMemo(
    () => [
      { key: "home", title: "Home" },
      { key: "work", title: "Work" },
    ],
    [],
  );

  return (
    <section>
      <h2>Configuration</h2>
      <form
        className="config-form"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="form-field">
          <span>Preferred navigator</span>
          <select
            aria-label="Preferred navigator"
            value={settings.preferredNavigator}
            onChange={(event) =>
              setPreferredNavigator(event.target.value as NavigatorId)
            }
          >
            {navigatorIds.map((id) => (
              <option key={id} value={id}>
                {navigatorLabels[id]}
              </option>
            ))}
          </select>
        </label>

        {placeFields.map((place) => (
          <label key={place.key} className="form-field">
            <span>{place.title} label</span>
            <input
              value={place.key === "home" ? homeDraft : workDraft}
              onChange={(event) => {
                const nextValue = event.target.value;
                if (place.key === "home") {
                  setHomeDraft(nextValue);
                  return;
                }
                setWorkDraft(nextValue);
              }}
              onBlur={(event) => {
                setSavedPlace(place.key, event.target.value.trim());
              }}
              placeholder={`Saved ${place.key}`}
            />
          </label>
        ))}

        <div className="form-actions">
          <button
            type="button"
            className="card card--secondary"
            onClick={() => {
              setHomeDraft(settings.savedPlaces.home);
              setWorkDraft(settings.savedPlaces.work);
            }}
          >
            Reset draft
          </button>
          <button
            type="button"
            className="card card--secondary"
            onClick={() => {
              setHomeDraft("");
              setWorkDraft("");
              resetSettings();
            }}
          >
            Clear all local settings
          </button>
        </div>
      </form>

      <p className="form-note">
        Edits are saved automatically in your browser&apos;s local storage.
      </p>
    </section>
  );
}
