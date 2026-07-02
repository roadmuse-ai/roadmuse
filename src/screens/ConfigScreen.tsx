import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { PreferenceCard } from "../components/PreferenceCard";
import { useSettings } from "../context/SettingsContext";
import {
  type NavigatorId,
  navigatorIds,
  navigatorLabels,
  type SavedPlace,
} from "../data/settings";
import { type ThemeMode, themeModeLabels, themeModes } from "../data/theme";

type SavedPlaceDraft = {
  label: string;
  address: string;
  latitude: string;
  longitude: string;
};

function normalizeCoordinate(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function trimmed(value: string): string {
  return value.trim();
}

function isNonEmpty(value: string): boolean {
  return trimmed(value).length > 0;
}

function isNumericOrEmpty(value: string): boolean {
  const normalized = trimmed(value);
  return normalized.length === 0 || Number.isFinite(Number(normalized));
}

function formatCoordinates(latitude?: number, longitude?: number): string | null {
  return latitude === undefined && longitude === undefined
    ? null
    : `${latitude ?? "N/A"}, ${longitude ?? "N/A"}`;
}

export function ConfigScreen() {
  const {
    settings,
    setPreferredNavigator,
    setThemeMode,
    addSavedPlace,
    updateSavedPlace,
    removeSavedPlace,
    addPreference,
    updatePreference,
    removePreference,
  } = useSettings();

  const emptyDraft: SavedPlaceDraft = {
    label: "",
    address: "",
    latitude: "",
    longitude: "",
  };

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SavedPlaceDraft>(emptyDraft);
  const [editorError, setEditorError] = useState("");

  const openAddPlace = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setEditorError("");
    setIsEditorOpen(true);
  };

  const openEditPlace = (place: SavedPlace) => {
    setEditingId(place.id);
    setDraft({
      label: place.label,
      address: place.address,
      latitude: String(place.latitude ?? ""),
      longitude: String(place.longitude ?? ""),
    });
    setEditorError("");
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setDraft(emptyDraft);
    setEditingId(null);
    setEditorError("");
  };

  const savePlace = () => {
    if (!isNonEmpty(draft.label) || !isNonEmpty(draft.address)) {
      setEditorError("Label and address are required.");
      return;
    }

    if (!isNumericOrEmpty(draft.latitude) || !isNumericOrEmpty(draft.longitude)) {
      setEditorError("Latitude and longitude must be numeric when provided.");
      return;
    }

    const next: Omit<SavedPlace, "id"> = {
      label: trimmed(draft.label),
      address: trimmed(draft.address),
      latitude: normalizeCoordinate(draft.latitude),
      longitude: normalizeCoordinate(draft.longitude),
    };

    if (editingId) {
      updateSavedPlace(editingId, next);
    } else {
      addSavedPlace(next);
    }

    closeEditor();
  };

  const removePlace = (id: string) => {
    removeSavedPlace(id);
  };

  return (
    <section>
      <section className="config-section">
        <h3 className="settings-title">Theme</h3>
        <p className="form-note">
          Auto follows your device's light or dark appearance.
        </p>
        <div
          className="theme-toggle"
          role="radiogroup"
          aria-label="Theme mode"
        >
          {themeModes.map((mode) => (
            <label
              key={mode}
              className={`theme-toggle__option${
                settings.themeMode === mode ? " theme-toggle__option--active" : ""
              }`}
            >
              <input
                type="radio"
                name="theme-mode"
                value={mode}
                checked={settings.themeMode === mode}
                onChange={() => setThemeMode(mode as ThemeMode)}
              />
              <span>{themeModeLabels[mode]}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="config-section">
        <h3 className="settings-title">Preferred Navigator</h3>
        <p className="form-note">
          Not sure which navigator to use? Review the <Link to="/help/navigator-comparison">Navigator Comparison</Link>.
        </p>
        <form className="config-form" onSubmit={(event) => event.preventDefault()}>
          <label className="form-field">
            <span className="sr-only">Preferred Navigator</span>
          <select
            aria-label="Preferred Navigator"
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
        </form>
      </section>

      <section className="saved-places">
        <h3 className="settings-title">Saved Places</h3>
        <p className="form-note">
          Save frequently used destinations such as home, work, or custom labels.
        </p>

        <ul className="saved-places__list" aria-label="Saved Places list">
          {settings.savedPlaces.map((place) => {
            const coordinates = formatCoordinates(place.latitude, place.longitude);

            return (
              <li className="saved-place" key={place.id}>
                <div className="saved-place__content">
                  <p className="saved-place__name">{place.label}</p>
                  <p className="saved-place__address">{place.address}</p>
                  {coordinates ? (
                    <p className="saved-place__coordinates">{coordinates}</p>
                  ) : null}
                </div>
                <div
                  className="saved-place__actions saved-place__actions--row"
                  role="group"
                  aria-label={`Actions for ${place.label}`}
                >
                  <button
                    type="button"
                    className="saved-place__icon-btn"
                    onClick={() => openEditPlace(place)}
                    aria-label={`Edit ${place.label}`}
                    title="Edit"
                  >
                    <Pencil aria-hidden="true" size={17} strokeWidth={2.2} />
                  </button>
                  <button
                    type="button"
                    className="saved-place__icon-btn"
                    onClick={() => removePlace(place.id)}
                    aria-label={`Remove ${place.label}`}
                    title="Remove"
                  >
                    <Trash2 aria-hidden="true" size={17} strokeWidth={2.2} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <button
          className="card card--secondary"
          type="button"
          onClick={openAddPlace}
        >
          Add Place
        </button>
      </section>

      <section className="preferences">
        <h3 className="settings-title">Route Preferences</h3>
        <p className="form-note">
          Describe how you like to drive in plain English. Disabled preferences are
          excluded from route planning.
        </p>

        <ul className="preferences__list" aria-label="Route preferences list">
          {settings.preferences.map((preference) => (
            <PreferenceCard
              key={preference.id}
              preference={preference}
              onUpdate={updatePreference}
              onRemove={removePreference}
            />
          ))}
        </ul>

        <button className="card card--secondary" type="button" onClick={addPreference}>
          Add Preference
        </button>
      </section>

      {isEditorOpen ? (
        <div className="saved-place__editor-overlay" onClick={closeEditor}>
          <div
            className="card saved-place__editor"
            role="dialog"
            aria-modal="true"
            aria-label={editingId ? "Edit saved place" : "Add saved place"}
            onClick={(event) => event.stopPropagation()}
          >
            <h4 className="saved-places__subheading">
              {editingId ? "Edit Place" : "Add Place"}
            </h4>
            <label className="form-field">
              <span>
                Label <span className="required-marker">*</span>
              </span>
              <input
                aria-label="Place label"
                value={draft.label}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, label: event.target.value }))
                }
                placeholder="e.g., home"
              />
            </label>
            <label className="form-field">
              <span>
                Address <span className="required-marker">*</span>
              </span>
              <input
                aria-label="Place address"
                value={draft.address}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, address: event.target.value }))
                }
                placeholder="e.g., 1600 Pennsylvania Ave, Washington, DC"
              />
            </label>
            <div className="saved-places__coords">
              <label className="form-field">
                <span>Latitude</span>
                <input
                  aria-label="Latitude"
                  value={draft.latitude}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, latitude: event.target.value }))
                  }
                />
              </label>
              <label className="form-field">
                <span>Longitude</span>
                <input
                  aria-label="Longitude"
                  value={draft.longitude}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, longitude: event.target.value }))
                  }
                />
              </label>
            </div>

            {editorError ? (
              <p className="form-note form-note--error">{editorError}</p>
            ) : null}

            <div className="saved-place__actions saved-place__editor-actions">
              <button
                className="card card--secondary"
                type="button"
                onClick={savePlace}
              >
                Save
              </button>
              <button
                className="card card--secondary"
                type="button"
                onClick={closeEditor}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </section>
  );
}
