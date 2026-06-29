import { navigatorLabels } from "../data/settings";
import { useSettings } from "../context/SettingsContext";

export function MainScreen() {
  const { settings } = useSettings();
  return (
    <section>
      <p>RoadMuse currently supports route planning requests, navigator handoff, and local settings.</p>
      <div className="card">
        <h2>Current settings</h2>
        <dl className="settings-summary">
          <div>
            <dt>Preferred navigator</dt>
            <dd>{navigatorLabels[settings.preferredNavigator]}</dd>
          </div>
          <div>
            <dt>Saved Home</dt>
            <dd>{settings.savedPlaces.home || "Not set"}</dd>
          </div>
          <div>
            <dt>Saved Work</dt>
            <dd>{settings.savedPlaces.work || "Not set"}</dd>
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
