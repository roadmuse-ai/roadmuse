import { ChevronDown } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import {
  type AutoRouteSettings,
  type BicycleRouteSettings,
  type DistanceUnits,
  type PedestrianRouteSettings,
  type RouteTravelMode,
  type ValhallaScale,
  alternateCountLabels,
  alternateCounts,
  avoidNeutralPreferLabels,
  avoidNeutralPreferScales,
  bicycleTypeLabels,
  bicycleTypes,
  comfortScaleLabels,
  distanceUnitLabels,
  distanceUnits,
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

interface ToggleFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}

function ToggleField({ label, checked, onChange, hint }: ToggleFieldProps) {
  return (
    <label className="form-field form-field--checkbox">
      <span className="route-settings__checkbox">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>{label}</span>
      </span>
      {hint ? <span className="form-note">{hint}</span> : null}
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
      <h4 className="settings-subtitle">Driving / Auto settings</h4>
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
      <ToggleField
        label="Avoid unpaved roads"
        checked={settings.excludeUnpaved}
        onChange={(excludeUnpaved) => onChange({ excludeUnpaved })}
      />
      <ToggleField
        label="Avoid cash-only tolls"
        checked={settings.excludeCashOnlyTolls}
        onChange={(excludeCashOnlyTolls) => onChange({ excludeCashOnlyTolls })}
      />
      <ToggleField
        label="Allow HOV 2+"
        checked={settings.includeHov2}
        onChange={(includeHov2) => onChange({ includeHov2 })}
      />
      <ToggleField
        label="Allow HOV 3+"
        checked={settings.includeHov3}
        onChange={(includeHov3) => onChange({ includeHov3 })}
      />
      <ToggleField
        label="Allow HOT lanes"
        checked={settings.includeHot}
        onChange={(includeHot) => onChange({ includeHot })}
      />
      <EnumSelect
        label="Simpler route / fewer turns"
        value={settings.maneuverPenaltySeconds}
        options={[5, 30, 60] as const}
        labels={maneuverPenaltyLabels}
        onChange={(maneuverPenaltySeconds) => onChange({ maneuverPenaltySeconds })}
      />
      <ToggleField
        label="Prefer shortest distance"
        checked={settings.shortest}
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
      <h4 className="settings-subtitle">Walking / Pedestrian settings</h4>
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
        <span className="form-note">Valhalla uses km/h (default 5.1 kph).</span>
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
      <p className="form-note">
        Route Settings are direct Valhalla routing controls. Route Preferences are
        plain-English rules that RoadMuse interprets later. External navigators may
        not preserve every Valhalla setting unless GPX/export or the selected provider
        supports it.
      </p>

      <h4 className="settings-subtitle">Core route settings</h4>
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

      <h4 className="settings-subtitle route-settings__units-heading">Distance units</h4>
      <div
        className="theme-toggle route-settings__units"
        role="radiogroup"
        aria-label="Distance units"
      >
        {distanceUnits.map((unit) => (
          <label
            key={unit}
            className={`theme-toggle__option${
              routeSettings.units === unit ? " theme-toggle__option--active" : ""
            }`}
          >
            <input
              type="radio"
              name="distance-units"
              value={unit}
              checked={routeSettings.units === unit}
              onChange={() => updateRouteSettings({ units: unit as DistanceUnits })}
            />
            <span>{distanceUnitLabels[unit]}</span>
          </label>
        ))}
      </div>

      <EnumSelect
        label="Alternate routes"
        value={routeSettings.alternates}
        options={alternateCounts}
        labels={alternateCountLabels}
        onChange={(alternates) => updateRouteSettings({ alternates })}
      />

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
