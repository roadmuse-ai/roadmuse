import { describe, expect, it } from "vitest";
import { buildWazeLink, wazeWaypointWarning } from "./wazeLinks";

describe("buildWazeLink", () => {
  it("builds a destination link from coordinates with navigate=yes by default", () => {
    const { url, warnings } = buildWazeLink({
      coordinates: { latitude: 40.758895, longitude: -73.985131 },
    });

    expect(url).toBe(
      "https://waze.com/ul?ll=40.758895%2C-73.985131&navigate=yes&utm_source=roadmuse",
    );
    expect(warnings).toEqual([]);
  });

  it("builds a search link with %20-encoded spaces", () => {
    const { url } = buildWazeLink({ query: "66 Acacia Avenue", navigate: false });

    expect(url).toBe("https://waze.com/ul?q=66%20Acacia%20Avenue&utm_source=roadmuse");
    expect(url).not.toContain("+");
  });

  it("combines a search query with a coordinate hint", () => {
    const { url } = buildWazeLink({
      query: "Chabad Frederick",
      coordinates: { latitude: 39.4143, longitude: -77.4105 },
    });

    expect(url).toContain("q=Chabad%20Frederick");
    expect(url).toContain("ll=39.4143%2C-77.4105");
    expect(url).toContain("navigate=yes");
  });

  it("omits navigate when explicitly disabled and supports zoom", () => {
    const { url } = buildWazeLink({
      coordinates: { latitude: 45.6906304, longitude: -120.810983 },
      navigate: false,
      zoom: 10,
    });

    expect(url).not.toContain("navigate=");
    expect(url).toContain("z=10");
  });

  it("includes avoid flags only when explicitly set", () => {
    const { url } = buildWazeLink({
      query: "BWI",
      avoidTolls: true,
      avoidFreeways: false,
      avoidDangerousTurns: false,
    });

    expect(url).toContain("avoid_tolls=true");
    expect(url).toContain("avoid_freeways=false");
    expect(url).toContain("avoid_dangerous_turns=false");
    expect(url).not.toContain("avoid_ferries");
    expect(url).not.toContain("avoid_trails");
  });

  it("supports ferries, trails, and vehicle type parameters", () => {
    const { url } = buildWazeLink({
      query: "Ocean City",
      avoidFerries: true,
      avoidTrails: "avoid_long",
      vehicleType: "motorcycle",
    });

    expect(url).toContain("avoid_ferries=true");
    expect(url).toContain("avoid_trails=avoid_long");
    expect(url).toContain("vehicle_type=motorcycle");
  });

  it("trims the query and encodes special characters", () => {
    const { url } = buildWazeLink({ query: "  Ben & Jerry's, Main St  " });

    expect(url).toContain("q=Ben%20%26%20Jerry's%2C%20Main%20St");
  });

  it("drops waypoints from the URL and returns the limitation warning", () => {
    const { url, warnings } = buildWazeLink({
      coordinates: { latitude: 39.0, longitude: -77.0 },
      waypoints: [
        { latitude: 39.1, longitude: -77.1 },
        { latitude: 39.2, longitude: -77.2 },
      ],
    });

    expect(url).toBe(
      "https://waze.com/ul?ll=39%2C-77&navigate=yes&utm_source=roadmuse",
    );
    expect(warnings).toEqual([wazeWaypointWarning]);
    expect(wazeWaypointWarning).toMatch(/HERE WeGo, Organic Maps, or GPX/);
  });

  it("returns no warning for an empty waypoint list", () => {
    const { warnings } = buildWazeLink({ query: "BWI", waypoints: [] });

    expect(warnings).toEqual([]);
  });

  it("throws without a query or coordinates", () => {
    expect(() => buildWazeLink({})).toThrow(/search query or destination coordinates/);
    expect(() => buildWazeLink({ query: "   " })).toThrow(
      /search query or destination coordinates/,
    );
  });

  it("throws on non-finite coordinates", () => {
    expect(() =>
      buildWazeLink({ coordinates: { latitude: Number.NaN, longitude: -77 } }),
    ).toThrow(/finite numbers/);
  });
});
