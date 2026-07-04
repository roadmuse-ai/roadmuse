import { describe, expect, it } from "vitest";
import {
  buildAddressNavigatorDeepLink,
  buildStubNavigatorDeepLink,
  detectMobilePlatform,
  resolveDriveNavigator,
  stubVoiceRoute,
} from "./navigationLinks";

describe("navigation link helpers", () => {
  it("detects Android, iOS, and other mobile platforms", () => {
    expect(detectMobilePlatform("Mozilla/5.0 Android", "Linux", 0)).toBe("android");
    expect(detectMobilePlatform("Mozilla/5.0 iPhone", "iPhone", 0)).toBe("ios");
    expect(detectMobilePlatform("Mozilla/5.0", "MacIntel", 5)).toBe("ios");
    expect(detectMobilePlatform("Mozilla/5.0", "MacIntel", 0)).toBe("other");
  });

  it("prefers the configured navigator before platform fallbacks", () => {
    expect(resolveDriveNavigator("waze", "ios")).toBe("waze");
    expect(resolveDriveNavigator(undefined, "ios")).toBe("apple-maps");
    expect(resolveDriveNavigator(undefined, "android")).toBe("google-maps");
    expect(resolveDriveNavigator(null, "other")).toBe("google-maps");
  });

  it("builds Google Maps and Waze links for the stub voice route", () => {
    const googleLink = buildStubNavigatorDeepLink("google-maps", stubVoiceRoute);
    const wazeLink = buildStubNavigatorDeepLink("waze", stubVoiceRoute);

    expect(googleLink).toContain("https://www.google.com/maps/dir/");
    expect(googleLink).toContain("origin=39.084%2C-77.1528");
    expect(googleLink).toContain(
      "destination=kid-friendly%20lunch%20near%20the%20National%20Mall%20with%20easy%20parking",
    );
    expect(wazeLink).toBe(
      "https://waze.com/ul?q=kid-friendly%20lunch%20near%20the%20National%20Mall%20with%20easy%20parking&navigate=yes",
    );
  });

  it("builds navigator links from saved trip addresses", () => {
    const route = {
      startAddress: "Rockville, MD",
      destinationAddress: "Bethesda coffee stop",
    };

    expect(buildAddressNavigatorDeepLink("google-maps", route)).toBe(
      "https://www.google.com/maps/dir/?api=1&origin=Rockville%2C%20MD&destination=Bethesda%20coffee%20stop&travelmode=driving",
    );
    expect(buildAddressNavigatorDeepLink("apple-maps", route)).toBe(
      "https://maps.apple.com/?saddr=Rockville%2C%20MD&daddr=Bethesda%20coffee%20stop&dirflg=d",
    );
    expect(buildAddressNavigatorDeepLink("here-wego", route)).toBe(
      "https://wego.here.com/directions/drive/Rockville%2C%20MD/Bethesda%20coffee%20stop",
    );
    expect(buildAddressNavigatorDeepLink("organic-maps", route)).toBe(
      "om://route?saddr=Rockville%2C%20MD&daddr=Bethesda%20coffee%20stop&type=vehicle",
    );
    expect(buildAddressNavigatorDeepLink("waze", route)).toBe(
      "https://waze.com/ul?q=Bethesda%20coffee%20stop&navigate=yes",
    );
  });

  it("adds intermediate waypoints to route providers that support them", () => {
    const route = {
      startAddress: "Rockville, MD",
      destinationAddress: "National Mall, Washington, DC",
      waypoints: [
        {
          address: "Rockville, MD",
          latitude: 39.084,
          longitude: -77.1528,
        },
        {
          address: "Bethesda Row, Bethesda, MD",
          latitude: 38.9818,
          longitude: -77.0969,
        },
        {
          address: "Georgetown Waterfront Park, Washington, DC",
          latitude: 38.9029,
          longitude: -77.0625,
        },
        {
          address: "National Mall, Washington, DC",
          latitude: 38.8895,
          longitude: -77.0353,
        },
      ],
    };

    expect(buildAddressNavigatorDeepLink("google-maps", route)).toBe(
      "https://www.google.com/maps/dir/?api=1&origin=Rockville%2C%20MD&destination=National%20Mall%2C%20Washington%2C%20DC&waypoints=Bethesda%20Row%2C%20Bethesda%2C%20MD%7CGeorgetown%20Waterfront%20Park%2C%20Washington%2C%20DC&travelmode=driving",
    );
    expect(buildAddressNavigatorDeepLink("here-wego", route)).toBe(
      "https://wego.here.com/directions/drive/39.084%2C-77.1528/38.9818%2C-77.0969/38.9029%2C-77.0625/38.8895%2C-77.0353",
    );
    expect(buildAddressNavigatorDeepLink("waze", route)).toBe(
      "https://waze.com/ul?q=National%20Mall%2C%20Washington%2C%20DC&navigate=yes",
    );
  });

  it("uses Apple Maps as the iOS fallback when no navigator is configured", () => {
    expect(buildStubNavigatorDeepLink(undefined, stubVoiceRoute, "ios")).toContain(
      "https://maps.apple.com/",
    );
  });

  it("builds a GPX data URL for the GPX export provider", () => {
    const link = buildStubNavigatorDeepLink("gpx-export", stubVoiceRoute);

    expect(link).toContain("data:application/gpx+xml");
    expect(decodeURIComponent(link)).toContain("<name>RoadMuse stub drive</name>");
    expect(decodeURIComponent(link)).toContain("Rockville, MD");
  });

  it("builds a metadata-only GPX data URL from saved trip addresses", () => {
    const link = buildAddressNavigatorDeepLink("gpx-export", {
      startAddress: "Rockville, MD",
      destinationAddress: "Bethesda coffee stop",
    });

    expect(link).toContain("data:application/gpx+xml");
    expect(decodeURIComponent(link)).toContain("<name>RoadMuse address route</name>");
    expect(decodeURIComponent(link)).toContain(
      "<desc>Rockville, MD to Bethesda coffee stop</desc>",
    );
  });

  it("exports coordinate waypoints in GPX route data", () => {
    const link = buildAddressNavigatorDeepLink("gpx-export", {
      startAddress: "Rockville, MD",
      destinationAddress: "National Mall, Washington, DC",
      waypoints: [
        {
          address: "Rockville, MD",
          latitude: 39.084,
          longitude: -77.1528,
        },
        {
          address: "Bethesda Row, Bethesda, MD",
          latitude: 38.9818,
          longitude: -77.0969,
        },
        {
          address: "National Mall, Washington, DC",
          latitude: 38.8895,
          longitude: -77.0353,
        },
      ],
    });
    const decodedLink = decodeURIComponent(link);

    expect(decodedLink).toContain('<wpt lat="39.084" lon="-77.1528">');
    expect(decodedLink).toContain("<name>Bethesda Row, Bethesda, MD</name>");
    expect(decodedLink).toContain('<wpt lat="38.8895" lon="-77.0353">');
  });
});
