import { ChevronDown } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import {
  type AutoRouteSettings,
  type BicycleRouteSettings,
  type PedestrianRouteSettings,
  type RouteTravelMode,
  type ValhallaScale,
  avoidNeutralPreferLabels,
  avoidNeutralPreferScales,
  bicycleTypeLabels,
  bicycleTypes,
  comfortScaleLabels,
  maneuverPenaltyLabels,
  routeTravelModeLabels,
  routeTravelModes,
  stepPenaltyLabels,
  strengthScaleLabels,
  valhallaScales,
  walkingSpeedRangeKph,
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
      <div className="theme-toggle theme-toggle--scale" role="radiogroup" aria-label={label}>
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
      <h4 className="settings-subtitle">Driving settings</h4>
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

interface BicycleSettingsFieldsProps {
  settings: BicycleRouteSettings;
  onChange: (updates: Partial<BicycleRouteSettings>) => void;
}

function BicycleSettingsFields({ settings, onChange }: BicycleSettingsFieldsProps) {
  return (
    <div className="route-settings__mode-panel">
      <h4 className="settings-subtitle">Bicycle settings</h4>
      <EnumSelect
        label="Bicycle type"
        value={settings.bicycleType}
        options={bicycleTypes}
        labels={bicycleTypeLabels}
        onChange={(bicycleType) => onChange({ bicycleType })}
      />
      <ScaleSegmented
        label="Road comfort"
        value={settings.roadComfort}
        scales={valhallaScales}
        optionLabels={comfortScaleLabels}
        onChange={(roadComfort) => onChange({ roadComfort })}
      />
      <ScaleSegmented
        label="Hill comfort"
        value={settings.hillComfort}
        scales={valhallaScales}
        optionLabels={comfortScaleLabels}
        onChange={(hillComfort) => onChange({ hillComfort })}
      />
      <ScaleSegmented
        label="Ferries"
        value={settings.ferryPreference}
        scales={avoidNeutralPreferScales}
        optionLabels={avoidNeutralPreferLabels}
        onChange={(ferryPreference) => onChange({ ferryPreference })}
      />
      <ScaleSegmented
        label="Avoid bad surfaces"
        value={settings.avoidBadSurfaces}
        scales={valhallaScales}
        optionLabels={strengthScaleLabels}
        onChange={(avoidBadSurfaces) => onChange({ avoidBadSurfaces })}
      />
    </div>
  );
}

interface PedestrianSettingsFieldsProps {
  settings: PedestrianRouteSettings;
  onChange: (updates: Partial<PedestrianRouteSettings>) => void;
}

function PedestrianSettingsFields({ settings, onChange }: PedestrianSettingsFieldsProps) {
  return (
    <div className="route-settings__mode-panel">
      <h4 className="settings-subtitle">Walking settings</h4>
      <label className="form-field">
        <span>Walking speed</span>
        <input
          type="number"
          aria-label="Walking speed"
          min={walkingSpeedRangeKph.min}
          max={walkingSpeedRangeKph.max}
          step={0.1}
          value={settings.walkingSpeedKph}
          onChange={(event) => {
            onChange({ walkingSpeedKph: Number(event.target.value) });
          }}
        />
        <span className="form-note">Default 5.1 km/h.</span>
      </label>
      <ScaleSegmented
        label="Hill comfort"
        value={settings.hillComfort}
        scales={valhallaScales}
        optionLabels={comfortScaleLabels}
        onChange={(hillComfort) => onChange({ hillComfort })}
      />
      <ScaleSegmented
        label="Prefer lit streets"
        value={settings.litStreetPreference}
        scales={valhallaScales}
        optionLabels={strengthScaleLabels}
        onChange={(litStreetPreference) => onChange({ litStreetPreference })}
      />
      <ScaleSegmented
        label="Ferries"
        value={settings.ferryPreference}
        scales={avoidNeutralPreferScales}
        optionLabels={avoidNeutralPreferLabels}
        onChange={(ferryPreference) => onChange({ ferryPreference })}
      />
      <EnumSelect
        label="Avoid stairs"
        value={settings.stepPenaltySeconds}
        options={[0, 60, 300] as const}
        labels={stepPenaltyLabels}
        onChange={(stepPenaltySeconds) => onChange({ stepPenaltySeconds })}
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

      <div className="theme-toggle" role="radiogroup" aria-label="Travel mode">
        {routeTravelModes.map((mode) => (
          <label
            key={mode}
            className={`theme-toggle__option${
              routeSettings.travelMode === mode ? " theme-toggle__option--active" : ""
            }`}
          >
            <input
              type="radio"
              name="travel-mode"
              value={mode}
              checked={routeSettings.travelMode === mode}
              onChange={() => updateRouteSettings({ travelMode: mode as RouteTravelMode })}
            />
            <span>{routeTravelModeLabels[mode]}</span>
          </label>
        ))}
      </div>

      {routeSettings.travelMode === "auto" ? (
        <AutoSettingsFields
          settings={routeSettings.auto}
          onChange={(auto) => updateRouteSettings({ auto })}
        />
      ) : null}

      {routeSettings.travelMode === "bicycle" ? (
        <BicycleSettingsFields
          settings={routeSettings.bicycle}
          onChange={(bicycle) => updateRouteSettings({ bicycle })}
        />
      ) : null}

      {routeSettings.travelMode === "pedestrian" ? (
        <PedestrianSettingsFields
          settings={routeSettings.pedestrian}
          onChange={(pedestrian) => updateRouteSettings({ pedestrian })}
        />
      ) : null}
    </section>
  );
}
