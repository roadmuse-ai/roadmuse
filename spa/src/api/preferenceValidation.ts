import {
  type PreferenceValidationResult,
  validatePreferenceLocally,
} from "../data/preferences";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export async function validatePreferenceText(
  text: string,
): Promise<PreferenceValidationResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      status: "needs-clarification",
      explanation: "Enter a preference before validation.",
    };
  }

  if (!apiBaseUrl) {
    return validatePreferenceLocally(trimmed);
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/preferences/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    });

    if (!response.ok) {
      return validatePreferenceLocally(trimmed);
    }

    const payload = (await response.json()) as Partial<PreferenceValidationResult>;
    if (
      payload.status === "supported" ||
      payload.status === "partially-supported" ||
      payload.status === "needs-route-context" ||
      payload.status === "needs-clarification" ||
      payload.status === "unsupported"
    ) {
      return {
        status: payload.status,
        explanation:
          typeof payload.explanation === "string" && payload.explanation.trim()
            ? payload.explanation.trim()
            : validatePreferenceLocally(trimmed).explanation,
      };
    }
  } catch {
    // Fall back when the backend is unavailable during Phase 1 development.
  }

  return validatePreferenceLocally(trimmed);
}
