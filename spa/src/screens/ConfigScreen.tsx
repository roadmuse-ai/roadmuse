import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { PreferenceCard } from "../components/PreferenceCard";
import { useSettings } from "../context/SettingsContext";
import { countryOptions, getStateOptions } from "../data/locationOptions";
import { type TextPreference } from "../data/preferences";
import {
  type NavigatorId,
  navigatorIds,
  navigatorLabels,
  type SavedPlace,
  type SavedPlaceEntryMode,
} from "../data/settings";
import { type ThemeMode, themeModeLabels, themeModes } from "../data/theme";

type SavedPlaceDraft = {
  entryMode: SavedPlaceEntryMode;
  label: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
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

function formatAddressDetails(place: SavedPlace): string | null {
  const cityState = [place.city, place.state].filter(Boolean).join(", ");
  const locality = [cityState, place.zipCode].filter(Boolean).join(" ");
  const details = [locality, place.country].filter(Boolean).join(", ");

  return details || null;
}

const locationEntryModeLabels: Record<SavedPlaceEntryMode, string> = {
  address: "Address",
  coordinates: "Coordinates",
};

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
    entryMode: "address",
    label: "",
    address: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    latitude: "",
    longitude: "",
  };

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SavedPlaceDraft>(emptyDraft);
  const [editorError, setEditorError] = useState("");
  const [isPreferenceEditorOpen, setIsPreferenceEditorOpen] = useState(false);
  const [editingPreferenceId, setEditingPreferenceId] = useState<string | null>(null);
  const [preferenceDraft, setPreferenceDraft] = useState("");
  const [preferenceEditorError, setPreferenceEditorError] = useState("");
  const isAddressMode = draft.entryMode === "address";
  const stateOptions = getStateOptions(draft.country);
  const statePlaceholder = draft.country ? "Not required" : "Select country first";

  const openAddPlace = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setEditorError("");
    setIsEditorOpen(true);
  };

  const openEditPlace = (place: SavedPlace) => {
    setEditingId(place.id);
    setDraft({
      entryMode: place.entryMode ?? "address",
      label: place.label,
      address: place.address,
      city: place.city ?? "",
      state: place.state ?? "",
      country: place.country ?? "",
      zipCode: place.zipCode ?? "",
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

  const updateEntryMode = (entryMode: SavedPlaceEntryMode) => {
    setDraft((current) => ({ ...current, entryMode }));
    setEditorError("");
  };

  const updateCountry = (country: string) => {
    setDraft((current) => {
      const nextStateOptions = getStateOptions(country);

      return {
        ...current,
        country,
        state: nextStateOptions.includes(current.state) ? current.state : "",
      };
    });
  };

  const savePlace = () => {
    if (!isNonEmpty(draft.label)) {
      setEditorError("Label is required.");
      return;
    }

    if (draft.entryMode === "address") {
      const requiresState = stateOptions.length > 0;

      if (
        !isNonEmpty(draft.address) ||
        !isNonEmpty(draft.city) ||
        !isNonEmpty(draft.country) ||
        !isNonEmpty(draft.zipCode) ||
        (requiresState && !isNonEmpty(draft.state))
      ) {
        setEditorError(
          "Address, city, country, ZIP code, and state when applicable are required.",
        );
        return;
      }
    } else if (
      !isNonEmpty(draft.latitude) ||
      !isNonEmpty(draft.longitude) ||
      !isNumericOrEmpty(draft.latitude) ||
      !isNumericOrEmpty(draft.longitude)
    ) {
      setEditorError("Latitude and longitude are required and must be numeric.");
      return;
    }

    const nextState =
      isAddressMode && stateOptions.length > 0
        ? trimmed(draft.state) || undefined
        : undefined;
    const next: Omit<SavedPlace, "id"> = {
      entryMode: draft.entryMode,
      label: trimmed(draft.label),
      address: isAddressMode ? trimmed(draft.address) : "",
      city: isAddressMode ? trimmed(draft.city) || undefined : undefined,
      state: nextState,
      country: isAddressMode ? trimmed(draft.country) || undefined : undefined,
      zipCode: isAddressMode ? trimmed(draft.zipCode) || undefined : undefined,
      latitude: isAddressMode ? undefined : normalizeCoordinate(draft.latitude),
      longitude: isAddressMode ? undefined : normalizeCoordinate(draft.longitude),
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

  const openAddPreference = () => {
    setEditingPreferenceId(null);
    setPreferenceDraft("");
    setPreferenceEditorError("");
    setIsPreferenceEditorOpen(true);
  };

  const openEditPreference = (preference: TextPreference) => {
    setEditingPreferenceId(preference.id);
    setPreferenceDraft(preference.text);
    setPreferenceEditorError("");
    setIsPreferenceEditorOpen(true);
  };

  const closePreferenceEditor = () => {
    setIsPreferenceEditorOpen(false);
    setEditingPreferenceId(null);
    setPreferenceDraft("");
    setPreferenceEditorError("");
  };

  const savePreference = () => {
    if (!isNonEmpty(preferenceDraft)) {
      setPreferenceEditorError("Preference text is required.");
      return;
    }

    const updates: Partial<TextPreference> = {
      text: trimmed(preferenceDraft),
      validationStatus: "unknown",
      validationExplanation: undefined,
    };

    if (editingPreferenceId) {
      updatePreference(editingPreferenceId, updates);
    } else {
      const preferenceId = addPreference();
      updatePreference(preferenceId, updates);
    }

    closePreferenceEditor();
  };

  return (
    <section className="config-screen">
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
            const addressDetails = formatAddressDetails(place);
            const coordinates = formatCoordinates(place.latitude, place.longitude);

            return (
              <li className="saved-place" key={place.id}>
                <div className="saved-place__content">
                  <p className="saved-place__name">{place.label}</p>
                  {place.address ? (
                    <p className="saved-place__address">{place.address}</p>
                  ) : null}
                  {addressDetails ? (
                    <p className="saved-place__address">{addressDetails}</p>
                  ) : null}
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
              onEdit={openEditPreference}
              onRemove={removePreference}
            />
          ))}
        </ul>

        <button className="card card--secondary" type="button" onClick={openAddPreference}>
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
            <div className="form-field">
              <span>Type</span>
              <div
                className="location-mode-toggle"
                role="radiogroup"
                aria-label="Location entry mode"
              >
                {(["address", "coordinates"] as const).map((entryMode) => (
                  <label
                    key={entryMode}
                    className={`location-mode-toggle__option${
                      draft.entryMode === entryMode
                        ? " location-mode-toggle__option--active"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="saved-place-entry-mode"
                      value={entryMode}
                      checked={draft.entryMode === entryMode}
                      onChange={() => updateEntryMode(entryMode)}
                    />
                    <span>{locationEntryModeLabels[entryMode]}</span>
                  </label>
                ))}
              </div>
            </div>
            {isAddressMode ? (
              <>
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
                    placeholder="e.g., 1600 Pennsylvania Ave"
                  />
                </label>
                <div className="saved-places__field-grid">
                  <label className="form-field">
                    <span>
                      City <span className="required-marker">*</span>
                    </span>
                    <input
                      aria-label="City"
                      value={draft.city}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, city: event.target.value }))
                      }
                      placeholder="e.g., Washington"
                    />
                  </label>
                  <label className="form-field">
                    <span>
                      Country <span className="required-marker">*</span>
                    </span>
                    <select
                      aria-label="Country"
                      value={draft.country}
                      onChange={(event) => updateCountry(event.target.value)}
                    >
                      <option value="">Select country</option>
                      {countryOptions.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="saved-places__field-grid">
                  <label className="form-field">
                    <span>
                      State{" "}
                      {stateOptions.length > 0 ? (
                        <span className="required-marker">*</span>
                      ) : null}
                    </span>
                    <select
                      aria-label="State"
                      value={draft.state}
                      disabled={stateOptions.length === 0}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, state: event.target.value }))
                      }
                    >
                      <option value="">
                        {stateOptions.length > 0 ? "Select state" : statePlaceholder}
                      </option>
                      {stateOptions.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="form-field">
                    <span>
                      ZIP Code <span className="required-marker">*</span>
                    </span>
                    <input
                      aria-label="ZIP code"
                      value={draft.zipCode}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, zipCode: event.target.value }))
                      }
                      placeholder="e.g., 20500"
                    />
                  </label>
                </div>
              </>
            ) : (
              <div className="saved-places__coords">
                <label className="form-field">
                  <span>
                    Latitude <span className="required-marker">*</span>
                  </span>
                  <input
                    aria-label="Latitude"
                    value={draft.latitude}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, latitude: event.target.value }))
                    }
                  />
                </label>
                <label className="form-field">
                  <span>
                    Longitude <span className="required-marker">*</span>
                  </span>
                  <input
                    aria-label="Longitude"
                    value={draft.longitude}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, longitude: event.target.value }))
                    }
                  />
                </label>
              </div>
            )}

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

      {isPreferenceEditorOpen ? (
        <div className="saved-place__editor-overlay" onClick={closePreferenceEditor}>
          <div
            className="card saved-place__editor preference-editor"
            role="dialog"
            aria-modal="true"
            aria-label={
              editingPreferenceId ? "Edit route preference" : "Add route preference"
            }
            onClick={(event) => event.stopPropagation()}
          >
            <h4 className="saved-places__subheading">
              {editingPreferenceId ? "Edit Preference" : "Add Preference"}
            </h4>
            <label className="form-field">
              <span>
                Preference Text <span className="required-marker">*</span>
              </span>
              <textarea
                aria-label="Preference text"
                className="preference-editor__textarea"
                value={preferenceDraft}
                onChange={(event) => setPreferenceDraft(event.target.value)}
                placeholder='e.g., "Avoid tolls unless they save 20 minutes"'
                rows={4}
              />
            </label>

            {preferenceEditorError ? (
              <p className="form-note form-note--error">{preferenceEditorError}</p>
            ) : null}

            <div className="saved-place__actions saved-place__editor-actions">
              <button
                className="card card--secondary"
                type="button"
                onClick={savePreference}
              >
                Save
              </button>
              <button
                className="card card--secondary"
                type="button"
                onClick={closePreferenceEditor}
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
