import { afterEach, describe, expect, it, vi } from "vitest";

describe("validatePreferenceText", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  async function loadValidator() {
    const module = await import("./preferenceValidation");
    return module.validatePreferenceText;
  }

  it("requires text before validation", async () => {
    const validatePreferenceText = await loadValidator();

    await expect(validatePreferenceText("   ")).resolves.toEqual({
      status: "needs-clarification",
      explanation: "Enter a preference before validation.",
    });
  });

  it("uses the local placeholder when no API base URL is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    const validatePreferenceText = await loadValidator();

    await expect(validatePreferenceText("Avoid tolls")).resolves.toEqual({
      status: "supported",
      explanation: "Preference saved. Full validation will run once the backend is connected.",
    });
  });

  it("returns API validation results when the backend responds successfully", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com");
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "partially-supported",
        explanation: "Needs route context.",
      }),
    } as Response);
    const validatePreferenceText = await loadValidator();

    await expect(validatePreferenceText("Prefer Exit 26")).resolves.toEqual({
      status: "partially-supported",
      explanation: "Needs route context.",
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.example.com/api/preferences/validate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Prefer Exit 26" }),
      },
    );
  });

  it("falls back locally when the API fails or returns invalid data", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com");
    const validatePreferenceText = await loadValidator();

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
    } as Response);
    await expect(validatePreferenceText("Avoid tolls")).resolves.toMatchObject({
      status: "supported",
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "invalid", explanation: "" }),
    } as Response);
    await expect(validatePreferenceText("Avoid tolls")).resolves.toMatchObject({
      status: "supported",
    });

    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("offline"));
    await expect(validatePreferenceText("Avoid tolls")).resolves.toMatchObject({
      status: "supported",
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "unsupported", explanation: "   " }),
    } as Response);
    await expect(validatePreferenceText("Avoid tolls")).resolves.toEqual({
      status: "unsupported",
      explanation: "Preference saved. Full validation will run once the backend is connected.",
    });
  });
});
