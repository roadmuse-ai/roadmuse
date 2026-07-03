import { useEffect, useRef } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { validatePreferenceText } from "../api/preferenceValidation";
import {
  type PreferenceValidationStatus,
  type TextPreference,
  preferenceValidationLabels,
} from "../data/preferences";

const VALIDATION_DEBOUNCE_MS = 450;

interface PreferenceCardProps {
  preference: TextPreference;
  onUpdate: (id: string, updates: Partial<TextPreference>) => void;
  onEdit: (preference: TextPreference) => void;
  onRemove: (id: string) => void;
}

function statusClassName(status: PreferenceValidationStatus): string {
  switch (status) {
    case "supported":
      return "preference-status preference-status--supported";
    case "partially-supported":
      return "preference-status preference-status--partial";
    case "needs-route-context":
      return "preference-status preference-status--context";
    case "needs-clarification":
      return "preference-status preference-status--clarification";
    case "unsupported":
      return "preference-status preference-status--unsupported";
    case "pending":
      return "preference-status preference-status--pending";
    default:
      return "preference-status preference-status--unknown";
  }
}

function badgeLabel(status: PreferenceValidationStatus): string {
  if (status === "pending") {
    return "Validating…";
  }

  if (status === "unknown") {
    return "Not validated";
  }

  return preferenceValidationLabels[status];
}

function badgeDescription(preference: TextPreference): string {
  if (preference.validationExplanation) {
    return preference.validationExplanation;
  }

  if (preference.validationStatus === "pending") {
    return "Checking whether this preference can be applied to route planning.";
  }

  if (preference.validationStatus === "unknown") {
    return "This preference has not been validated yet.";
  }

  return `${badgeLabel(preference.validationStatus)} for route planning.`;
}

export function PreferenceCard({
  preference,
  onUpdate,
  onEdit,
  onRemove,
}: PreferenceCardProps) {
  const requestIdRef = useRef(0);
  const trimmedText = preference.text.trim();
  const preferenceName = trimmedText || "new preference";
  const tooltipId = `preference-${preference.id}-validation`;

  useEffect(() => {
    const trimmed = preference.text.trim();
    if (!trimmed) {
      onUpdate(preference.id, {
        validationStatus: "unknown",
        validationExplanation: undefined,
      });
      return;
    }

    onUpdate(preference.id, { validationStatus: "pending" });
    const requestId = ++requestIdRef.current;

    const handle = window.setTimeout(() => {
      void validatePreferenceText(trimmed).then((result) => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        onUpdate(preference.id, {
          validationStatus: result.status,
          validationExplanation: result.explanation,
        });
      });
    }, VALIDATION_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(handle);
    };
  }, [preference.id, preference.text, onUpdate]);

  return (
    <li className={`preference-card${preference.enabled ? "" : " preference-card--disabled"}`}>
      <div className="preference-card__top-row">
        <div className="preference-card__meta">
          <label className="preference-card__toggle">
            <input
              type="checkbox"
              checked={preference.enabled}
              onChange={(event) =>
                onUpdate(preference.id, { enabled: event.target.checked })
              }
              aria-label={`Enable preference: ${preferenceName}`}
            />
            <span>{preference.enabled ? "Enabled" : "Disabled"}</span>
          </label>

          <span className="preference-status__wrap">
            <button
              type="button"
              className={statusClassName(preference.validationStatus)}
              aria-label={`${badgeLabel(preference.validationStatus)} validation details`}
              aria-describedby={tooltipId}
            >
              {badgeLabel(preference.validationStatus)}
            </button>
            <span className="preference-status__tooltip" id={tooltipId} role="tooltip">
              {badgeDescription(preference)}
            </span>
          </span>
        </div>

        <div className="preference-card__actions">
          <button
            type="button"
            className="saved-place__icon-btn"
            onClick={() => onEdit(preference)}
            aria-label={`Edit preference: ${preferenceName}`}
            title="Edit"
          >
            <Pencil aria-hidden="true" size={17} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className="saved-place__icon-btn"
            onClick={() => onRemove(preference.id)}
            aria-label={`Remove preference: ${preferenceName}`}
            title="Remove"
          >
            <Trash2 aria-hidden="true" size={17} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <p className="preference-card__text">{trimmedText || "No preference text yet"}</p>
    </li>
  );
}
