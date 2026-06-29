import { useState } from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import {
  type NavigatorId,
  navigatorIds,
  navigatorLabels,
  type SavedPlace,
} from "../data/settings";

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

export function ConfigScreen() {
  const {
    settings,
    setPreferredNavigator,
    addSavedPlace,
    updateSavedPlace,
    removeSavedPlace,
  } = useSettings();

  const emptyDraft: SavedPlaceDraft = {
    label: "",
    address: "",
    latitude: "",
    longitude: "",
  };

  const [newPlace, setNewPlace] = useState<SavedPlaceDraft>(emptyDraft);
  const [saveError, setSaveError] = useState("");
  const [placeErrors, setPlaceErrors] = useState<Record<string, string>>({});

  const addPlace = () => {
    if (!isNonEmpty(newPlace.label) || !isNonEmpty(newPlace.address)) {
      setSaveError("Label and address are required.");
      return;
    }

    if (!isNumericOrEmpty(newPlace.latitude) || !isNumericOrEmpty(newPlace.longitude)) {
      setSaveError("Latitude and longitude must be numeric when provided.");
      return;
    }

    const trimmedLabel = trimmed(newPlace.label);
    const trimmedAddress = trimmed(newPlace.address);
    addSavedPlace({
      label: trimmedLabel,
      address: trimmedAddress,
      latitude: normalizeCoordinate(newPlace.latitude),
      longitude: normalizeCoordinate(newPlace.longitude),
    });
    setNewPlace(emptyDraft);
    setSaveError("");
  };

  const removePlace = (id: string) => {
    removeSavedPlace(id);
  };

  const updateExistingPlace = (id: string, next: SavedPlace) => {
    if (!isNonEmpty(next.label) || !isNonEmpty(next.address)) {
      setPlaceErrors((current) => ({
        ...current,
        [id]: "Label and address are required.",
      }));
      return;
    }

    updateSavedPlace(id, next);
    setPlaceErrors((current) => {
      const copy = { ...current };
      delete copy[id];
      return copy;
    });
  };

  return (
    <section>
      <form className="config-form" onSubmit={(event) => event.preventDefault()}>
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
      </form>

      <section className="saved-places">
        <h3 className="settings-title">Saved places</h3>
        <p className="form-note">
          Save frequently used destinations such as home, work, or custom labels.
        </p>

        <ul className="saved-places__list">
          {settings.savedPlaces.map((place) => (
            <SavedPlaceRow
              key={place.id}
              place={place}
              error={placeErrors[place.id]}
              onSave={(next) => updateExistingPlace(place.id, next)}
              onDelete={() => removePlace(place.id)}
            />
          ))}
        </ul>

        <div className="saved-places__form">
          <h4 className="saved-places__subheading">Add place</h4>
          <label className="form-field">
            <span>Label</span>
            <input
              aria-label="Place label"
              value={newPlace.label}
              onChange={(event) =>
                setNewPlace((current) => ({ ...current, label: event.target.value }))
              }
              placeholder="e.g., home"
            />
          </label>
          <label className="form-field">
            <span>Address</span>
            <input
              aria-label="Place address"
              value={newPlace.address}
              onChange={(event) =>
                setNewPlace((current) => ({ ...current, address: event.target.value }))
              }
              placeholder="e.g., 1600 Pennsylvania Ave, Washington, DC"
            />
          </label>
          <div className="saved-places__coords">
            <label className="form-field">
              <span>Latitude (optional)</span>
              <input
                aria-label="Latitude"
                value={newPlace.latitude}
                onChange={(event) =>
                  setNewPlace((current) => ({ ...current, latitude: event.target.value }))
                }
              />
            </label>
            <label className="form-field">
              <span>Longitude (optional)</span>
              <input
                aria-label="Longitude"
                value={newPlace.longitude}
                onChange={(event) =>
                  setNewPlace((current) => ({ ...current, longitude: event.target.value }))
                }
              />
            </label>
          </div>
          {saveError ? <p className="form-note form-note--error">{saveError}</p> : null}
          <button className="card card--secondary" type="button" onClick={addPlace}>
            Add place
          </button>
        </div>
      </section>

      <p className="form-note">
        Not sure which navigator to use? Review the <Link to="/help/navigator-comparison">Navigator Comparison</Link>.
      </p>
    </section>
  );
}

function SavedPlaceRow({
  place,
  error,
  onSave,
  onDelete,
}: {
  place: SavedPlace;
  error?: string;
  onSave: (next: SavedPlace) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState<SavedPlaceDraft>({
    label: place.label,
    address: place.address,
    latitude: String(place.latitude ?? ""),
    longitude: String(place.longitude ?? ""),
  });
  const [rowError, setRowError] = useState("");

  const save = () => {
    if (!isNumericOrEmpty(draft.latitude) || !isNumericOrEmpty(draft.longitude)) {
      setRowError("Latitude and longitude must be numeric when provided.");
      return;
    }

    const next: SavedPlace = {
      ...place,
      label: trimmed(draft.label),
      address: trimmed(draft.address),
      latitude: normalizeCoordinate(draft.latitude),
      longitude: normalizeCoordinate(draft.longitude),
    };

    setRowError("");

    onSave(next);
  };

  return (
    <li className="saved-place">
      <div className="saved-place__fields">
        <label className="form-field">
          <span>Label</span>
          <input
            aria-label={`Saved place label for ${place.label}`}
            value={draft.label}
            onChange={(event) =>
              setDraft((current) => ({ ...current, label: event.target.value }))
            }
          />
        </label>
        <label className="form-field">
          <span>Address</span>
          <input
            aria-label={`Saved place address for ${place.label}`}
            value={draft.address}
            onChange={(event) =>
              setDraft((current) => ({ ...current, address: event.target.value }))
            }
          />
        </label>
        <div className="saved-places__coords">
          <label className="form-field">
            <span>Latitude</span>
            <input
              aria-label={`Saved place latitude for ${place.label}`}
              value={draft.latitude}
              onChange={(event) =>
                setDraft((current) => ({ ...current, latitude: event.target.value }))
              }
            />
          </label>
          <label className="form-field">
            <span>Longitude</span>
            <input
              aria-label={`Saved place longitude for ${place.label}`}
              value={draft.longitude}
              onChange={(event) =>
                setDraft((current) => ({ ...current, longitude: event.target.value }))
              }
            />
          </label>
        </div>
      </div>

      {rowError || error ? (
        <p className="form-note form-note--error">{rowError || error}</p>
      ) : null}

      <div className="saved-place__actions">
        <button
          className="card card--secondary"
          type="button"
          onClick={save}
          disabled={
            !isNonEmpty(draft.label) ||
            !isNonEmpty(draft.address) ||
            !isNumericOrEmpty(draft.latitude) ||
            !isNumericOrEmpty(draft.longitude)
          }
        >
          Save
        </button>
        <button
          className="card card--secondary"
          type="button"
          onClick={onDelete}
        >
          Remove
        </button>
      </div>
    </li>
  );
}
