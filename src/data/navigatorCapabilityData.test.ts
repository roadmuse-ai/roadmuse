import { describe, expect, it } from "vitest";
import {
  capabilityDescriptions,
  type CapabilityName,
  providerMatrix,
} from "./navigatorCapabilityData";

describe("navigator capability data", () => {
  it("describes each capability for every provider", () => {
    const capabilityNames = capabilityDescriptions.map((item) => item.name);

    expect(providerMatrix).toHaveLength(6);

    providerMatrix.forEach((provider) => {
      expect(provider.provider).toBeTruthy();
      expect(provider.notes).toBeTruthy();
      expect(provider.strengths.length).toBeGreaterThanOrEqual(2);
      expect(Object.keys(provider.capability)).toEqual(capabilityNames);

      capabilityNames.forEach((capability) => {
        const detail = provider.capability[capability as CapabilityName];
        expect(detail.icon).toMatch(/^[^\s]+$/);
        expect(detail.detail).toBeTruthy();
      });
    });
  });
});
