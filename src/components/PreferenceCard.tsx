import { useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
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
  onRemove: (id: string) => void;
}

function badgeClassName(status: PreferenceValidationStatus): string {
  switch (status) {
    case "supported":
      return "preference-badge preference-badge--supported";
    case "partially-supported":
      return "preference-badge preference-badge--partial";
    case "needs-route-context":
      return "preference-badge preference-badge--context";
    case "needs-clarification":
      return "preference-badge preference-badge--clarification";
    case "unsupported":
      return "preference-badge preference-badge--unsupported";
    case "pending":
      return "preference-badge preference-badge--pending";
    default:
      return "preference-badge preference-badge--unknown";
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

export function PreferenceCard({ preference, onUpdate, onRemove }: PreferenceCardProps) {
  const requestIdRef = useRef(0);

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
      <div className="preference-card__header">
        <label className="preference-card__toggle">
          <input
            type="checkbox"
            checked={preference.enabled}
            onChange={(event) =>
              onUpdate(preference.id, { enabled: event.target.checked })
            }
            aria-label={`Enable preference: ${preference.text.trim() || "new preference"}`}
          />
          <span>{preference.enabled ? "Enabled" : "Disabled"}</span>
        </label>
        <button
          type="button"
          className="saved-place__icon-btn"
          onClick={() => onRemove(preference.id)}
          aria-label={`Remove preference: ${preference.text.trim() || "new preference"}`}
          title="Remove"
        >
          <Trash2 aria-hidden="true" size={17} strokeWidth={2.2} />
        </button>
      </div>

      <label className="form-field preference-card__field">
        <span className="sr-only">Preference text</span>
        <textarea
          aria-label="Preference text"
          className="preference-card__textarea"
          value={preference.text}
          onChange={(event) => onUpdate(preference.id, { text: event.target.value })}
          placeholder='e.g., "Avoid tolls unless they save 20 minutes"'
          rows={3}
        />
      </label>

      <div className="preference-card__validation">
        <span className={badgeClassName(preference.validationStatus)}>
          {badgeLabel(preference.validationStatus)}
        </span>
        {preference.validationExplanation ? (
          <p className="preference-card__explanation">{preference.validationExplanation}</p>
        ) : null}
      </div>
    </li>
  );
}
