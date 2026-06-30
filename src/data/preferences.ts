export const preferenceValidationStatuses = [
  "supported",
  "partially-supported",
  "needs-route-context",
  "needs-clarification",
  "unsupported",
  "pending",
  "unknown",
] as const;

export type PreferenceValidationStatus = (typeof preferenceValidationStatuses)[number];

export interface TextPreference {
  id: string;
  text: string;
  enabled: boolean;
  validationStatus: PreferenceValidationStatus;
  validationExplanation?: string;
}

export const preferenceValidationLabels: Record<
  Exclude<PreferenceValidationStatus, "pending" | "unknown">,
  string
> = {
  supported: "Supported",
  "partially-supported": "Partially supported",
  "needs-route-context": "Needs route context",
  "needs-clarification": "Needs clarification",
  unsupported: "Unsupported",
};

export interface PreferenceValidationResult {
  status: Exclude<PreferenceValidationStatus, "pending" | "unknown">;
  explanation: string;
}

const isValidationStatus = (
  value: unknown,
): value is Exclude<PreferenceValidationStatus, "pending" | "unknown"> => {
  return (
    typeof value === "string" &&
    (preferenceValidationStatuses as readonly string[]).includes(value) &&
    value !== "pending" &&
    value !== "unknown"
  );
};

export const isTextPreference = (value: unknown): value is TextPreference => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.text !== "string" ||
    typeof candidate.enabled !== "boolean" ||
    typeof candidate.validationStatus !== "string"
  ) {
    return false;
  }

  if (
    candidate.validationExplanation !== undefined &&
    typeof candidate.validationExplanation !== "string"
  ) {
    return false;
  }

  return (preferenceValidationStatuses as readonly string[]).includes(
    candidate.validationStatus,
  );
};

export const normalizeTextPreference = (raw: TextPreference): TextPreference => ({
  id: raw.id,
  text: raw.text,
  enabled: raw.enabled,
  validationStatus: isValidationStatus(raw.validationStatus) ? raw.validationStatus : "unknown",
  validationExplanation:
    typeof raw.validationExplanation === "string"
      ? raw.validationExplanation.trim() || undefined
      : undefined,
});

export function getEnabledPreferences(preferences: TextPreference[]): TextPreference[] {
  return preferences.filter((entry) => entry.enabled && entry.text.trim().length > 0);
}

export function createEmptyPreference(): TextPreference {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: "",
    enabled: true,
    validationStatus: "unknown",
  };
}

/**
 * Temporary client-side fallback until PreferenceValidationAgent (#13) is available.
 */
export function validatePreferenceLocally(text: string): PreferenceValidationResult {
  const normalized = text.trim().toLowerCase();

  if (/avoid\s+tolls?/.test(normalized)) {
    return {
      status: "supported",
      explanation: "RoadMuse can apply toll avoidance during Valhalla routing.",
    };
  }

  if (/waze/.test(normalized) && /(exact|geometry|preserve|valhalla)/.test(normalized)) {
    return {
      status: "unsupported",
      explanation: "Waze cannot preserve exact Valhalla route geometry.",
    };
  }

  if (/when driving from|from .+ to /.test(normalized)) {
    return {
      status: "needs-route-context",
      explanation: "This preference applies only when origin and destination match the saved context.",
    };
  }

  if (/\bexit\s+\d+\b/.test(normalized) && !/from .+ to /.test(normalized)) {
    return {
      status: "needs-clarification",
      explanation: "Specify which trip or corridor this exit preference applies to.",
    };
  }

  if (/poorly lit|unpaved|scenic|ferry|highway|unlit/.test(normalized)) {
    return {
      status: "partially-supported",
      explanation: "RoadMuse can attempt this preference, but coverage depends on routing data.",
    };
  }

  return {
    status: "partially-supported",
    explanation: "RoadMuse will review this preference during route planning.",
  };
}
