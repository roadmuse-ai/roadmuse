import { useSettings } from "../context/SettingsContext";
import { type NavigatorId, navigatorIds, navigatorLabels } from "../data/settings";

export function ConfigScreen() {
  const { settings, setPreferredNavigator } = useSettings();

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
      <p className="form-note">
        Edits are saved automatically in your browser&apos;s local storage.
      </p>
    </section>
  );
}
