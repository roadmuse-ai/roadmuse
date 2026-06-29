import { navigatorLabels } from "../data/settings";
import { useSettings } from "../context/SettingsContext";

export function MainScreen() {
  const { settings } = useSettings();
  return (
    <section>
      <div className="card">
        <h3 className="settings-title">Current settings</h3>
        <dl className="settings-summary">
          <div>
            <dt>Preferred navigator</dt>
            <dd>{navigatorLabels[settings.preferredNavigator]}</dd>
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
