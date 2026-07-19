import { afterEach, describe, expect, it, vi } from "vitest";
import { intentToAddressRoute, planRoute } from "./routePlan";

const baseIntent = {
  origin: {
    kind: "coordinate",
    label: null,
    coordinate: { latitude: 39.0, longitude: -77.1 },
    saved_place_id: null,
    is_resolved: true,
    is_ambiguous: false,
  },
  destination: {
    kind: "poi",
    label: "National Mall",
    coordinate: null,
    saved_place_id: null,
    is_resolved: false,
    is_ambiguous: false,
  },
  waypoints: [
    {
      location: {
        kind: "poi",
        label: "Bethesda Row",
        coordinate: null,
        saved_place_id: null,
        is_resolved: false,
        is_ambiguous: false,
      },
      kind: "break",
    },
  ],
  mode: "drive",
  raw_prompt: "home to the mall via Bethesda",
};

describe("intentToAddressRoute", () => {
  it("orders origin, waypoints, destination and maps labels/coordinates", () => {
    const route = intentToAddressRoute(baseIntent);

    expect(route.waypoints).toEqual([
      { address: undefined, latitude: 39.0, longitude: -77.1 },
      { address: "Bethesda Row", latitude: undefined, longitude: undefined },
      { address: "National Mall", latitude: undefined, longitude: undefined },
    ]);
    // origin has no label -> its coordinate becomes the start string
    expect(route.startAddress).toBe("39,-77.1");
    expect(route.destinationAddress).toBe("National Mall");
  });
});

describe("planRoute", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when no API base URL is configured", async () => {
    // VITE_API_BASE_URL is unset in tests, so no request is attempted.
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await planRoute("go to the mall", undefined, []);

    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns null for an empty prompt", async () => {
    expect(await planRoute("   ", undefined, [])).toBeNull();
  });
});
