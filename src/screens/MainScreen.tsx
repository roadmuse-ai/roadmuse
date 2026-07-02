import { useState } from "react";
import { getEnabledPreferences } from "../data/preferences";
import { clearPromptDraft, loadPromptDraft } from "../data/promptDraft";
import { navigatorLabels } from "../data/settings";
import { useSettings } from "../context/SettingsContext";

export function MainScreen() {
  const { settings } = useSettings();
  const activePreferences = getEnabledPreferences(settings.preferences);
  const [promptDraft, setPromptDraft] = useState(loadPromptDraft);

  const handleClearDraft = () => {
    clearPromptDraft();
    setPromptDraft("");
  };

  return (
    <section>
      {promptDraft.length > 0 && (
        <div className="card prompt-draft">
          <h3 className="settings-title">Draft Prompt</h3>
          <p className="prompt-draft__text">“{promptDraft}”</p>
          <p className="prompt-draft__hint">
            Loaded from Help. It will prefill the route prompt once route planning input
            lands.
          </p>
          <button className="prompt-draft__clear" type="button" onClick={handleClearDraft}>
            Clear draft
          </button>
        </div>
      )}
      <div className="card">
        <h3 className="settings-title">Current Settings</h3>
        <dl className="settings-summary">
          <div>
            <dt>Preferred Navigator</dt>
            <dd>{navigatorLabels[settings.preferredNavigator]}</dd>
          </div>
          <div>
            <dt>Saved Places</dt>
            <dd>
              {settings.savedPlaces.length === 0
                ? "None yet"
                : settings.savedPlaces.map((place) => place.label).join(", ")}
            </dd>
          </div>
          <div>
            <dt>Active Preferences</dt>
            <dd>
              {activePreferences.length === 0
                ? "None yet"
                : activePreferences.map((preference) => preference.text).join("; ")}
            </dd>
          </div>
        </dl>
      </div>
      <button className="card card--primary" type="button">
        Start planning a route
      </button>
      <p>
        Route planning input and parsed route previews will be implemented in later stories.
      </p>
    </section>
  );
}
