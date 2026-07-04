import { ChevronDown } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import {
  type AutoRouteSettings,
  type ValhallaScale,
  avoidNeutralPreferLabels,
  avoidNeutralPreferScales,
  maneuverPenaltyLabels,
} from "../data/routeSettings";

function SelectChevron() {
  return (
    <ChevronDown className="select-control__icon" aria-hidden="true" size={17} strokeWidth={2.2} />
  );
}

interface ScaleSegmentedProps<T extends ValhallaScale> {
  label: string;
  value: T;
  scales: readonly T[];
  optionLabels: Record<T, string>;
  onChange: (value: T) => void;
}

function ScaleSegmented<T extends ValhallaScale>({
  label,
  value,
  scales,
  optionLabels,
  onChange,
}: ScaleSegmentedProps<T>) {
  const groupName = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="route-settings__segmented">
      <span className="route-settings__segmented-label">{label}</span>
      <div className="theme-toggle theme-toggle--scale" role="radiogroup" aria-label={label}>
        {scales.map((scale) => (
          <label
            key={scale}
            className={`theme-toggle__option${
              value === scale ? " theme-toggle__option--active" : ""
            }`}
          >
            <input
              type="radio"
              name={groupName}
              value={scale}
              checked={value === scale}
              onChange={() => onChange(scale)}
            />
            <span>{optionLabels[scale]}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

interface OnOffSegmentedProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  hint?: string;
}

function OnOffSegmented({ label, value, onChange, hint }: OnOffSegmentedProps) {
  const groupName = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="route-settings__segmented">
      <span className="route-settings__segmented-label">{label}</span>
      <div
        className="theme-toggle theme-toggle--scale theme-toggle--two"
        role="radiogroup"
        aria-label={label}
      >
        <label
          className={`theme-toggle__option${!value ? " theme-toggle__option--active" : ""}`}
        >
          <input
            type="radio"
            name={groupName}
            checked={!value}
            onChange={() => onChange(false)}
          />
          <span>Off</span>
        </label>
        <label
          className={`theme-toggle__option${value ? " theme-toggle__option--active" : ""}`}
        >
          <input
            type="radio"
            name={groupName}
            checked={value}
            onChange={() => onChange(true)}
          />
          <span>On</span>
        </label>
      </div>
      {hint ? <span className="form-note">{hint}</span> : null}
    </div>
  );
}

interface EnumSelectProps<T extends string | number> {
  label: string;
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
}

function EnumSelect<T extends string | number>({
  label,
  value,
  options,
  labels,
  onChange,
}: EnumSelectProps<T>) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <span className="select-control">
        <select
          aria-label={label}
          value={String(value)}
          onChange={(event) => {
            const raw = event.target.value;
            const next = typeof value === "number" ? Number(raw) : raw;
            onChange(next as T);
          }}
        >
          {options.map((option) => (
            <option key={String(option)} value={String(option)}>
              {labels[option]}
            </option>
          ))}
        </select>
        <SelectChevron />
      </span>
    </label>
  );
}

interface AutoSettingsFieldsProps {
  settings: AutoRouteSettings;
  onChange: (updates: Partial<AutoRouteSettings>) => void;
}

function AutoSettingsFields({ settings, onChange }: AutoSettingsFieldsProps) {
  return (
    <div className="route-settings__mode-panel">
      <ScaleSegmented
        label="Toll roads"
        value={settings.tollPreference}
        scales={avoidNeutralPreferScales}
        optionLabels={avoidNeutralPreferLabels}
        onChange={(tollPreference) => onChange({ tollPreference })}
      />
      <ScaleSegmented
        label="Highways"
        value={settings.highwayPreference}
        scales={avoidNeutralPreferScales}
        optionLabels={avoidNeutralPreferLabels}
        onChange={(highwayPreference) => onChange({ highwayPreference })}
      />
      <ScaleSegmented
        label="Ferries"
        value={settings.ferryPreference}
        scales={avoidNeutralPreferScales}
        optionLabels={avoidNeutralPreferLabels}
        onChange={(ferryPreference) => onChange({ ferryPreference })}
      />
      <OnOffSegmented
        label="Avoid unpaved roads"
        value={settings.excludeUnpaved}
        onChange={(excludeUnpaved) => onChange({ excludeUnpaved })}
      />
      <OnOffSegmented
        label="Avoid cash-only tolls"
        value={settings.excludeCashOnlyTolls}
        onChange={(excludeCashOnlyTolls) => onChange({ excludeCashOnlyTolls })}
      />
      <OnOffSegmented
        label="Allow HOV 2+"
        value={settings.includeHov2}
        onChange={(includeHov2) => onChange({ includeHov2 })}
      />
      <OnOffSegmented
        label="Allow HOV 3+"
        value={settings.includeHov3}
        onChange={(includeHov3) => onChange({ includeHov3 })}
      />
      <OnOffSegmented
        label="Allow HOT lanes"
        value={settings.includeHot}
        onChange={(includeHot) => onChange({ includeHot })}
      />
      <EnumSelect
        label="Simpler route / fewer turns"
        value={settings.maneuverPenaltySeconds}
        options={[5, 30, 60] as const}
        labels={maneuverPenaltyLabels}
        onChange={(maneuverPenaltySeconds) => onChange({ maneuverPenaltySeconds })}
      />
      <OnOffSegmented
        label="Prefer shortest distance"
        value={settings.shortest}
        onChange={(shortest) => onChange({ shortest })}
        hint="May choose a shorter but slower route over the fastest option."
      />
    </div>
  );
}

export function RouteSettingsSection() {
  const { settings, updateRouteSettings } = useSettings();
  const routeSettings = settings.routeSettings;

  return (
    <section className="config-section route-settings">
      <h3 className="settings-title">Route Settings</h3>

      <AutoSettingsFields
        settings={routeSettings.auto}
        onChange={(auto) => updateRouteSettings({ auto })}
      />
    </section>
  );
}
