import { type NavigatorId } from "./settings";

export type MobilePlatform = "android" | "ios" | "other";

export type StubRoute = {
  startLabel: string;
  startLatitude: number;
  startLongitude: number;
  destinationLabel: string;
  destinationLatitude: number;
  destinationLongitude: number;
};

export type AddressRoute = {
  startAddress: string;
  destinationAddress: string;
};

export const stubVoiceRoute: StubRoute = {
  startLabel: "Rockville, MD",
  startLatitude: 39.084,
  startLongitude: -77.1528,
  destinationLabel: "kid-friendly lunch near the National Mall with easy parking",
  destinationLatitude: 38.9072,
  destinationLongitude: -77.0369,
};

function coordinate(latitude: number, longitude: number): string {
  return `${latitude},${longitude}`;
}

function encode(value: string): string {
  return encodeURIComponent(value);
}

function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildGpx(route: StubRoute): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RoadMuse">
  <metadata>
    <name>RoadMuse stub drive</name>
  </metadata>
  <wpt lat="${route.startLatitude}" lon="${route.startLongitude}">
    <name>${escapeXmlText(route.startLabel)}</name>
  </wpt>
  <wpt lat="${route.destinationLatitude}" lon="${route.destinationLongitude}">
    <name>${escapeXmlText(route.destinationLabel)}</name>
  </wpt>
</gpx>`;
}

function buildAddressGpx(route: AddressRoute): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RoadMuse">
  <metadata>
    <name>RoadMuse address route</name>
    <desc>${escapeXmlText(route.startAddress)} to ${escapeXmlText(route.destinationAddress)}</desc>
  </metadata>
</gpx>`;
}

export function detectMobilePlatform(
  userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent,
  platform = typeof navigator === "undefined" ? "" : navigator.platform,
  maxTouchPoints =
    typeof navigator === "undefined" ? 0 : navigator.maxTouchPoints,
): MobilePlatform {
  if (/android/i.test(userAgent)) {
    return "android";
  }

  if (
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (platform === "MacIntel" && maxTouchPoints > 1)
  ) {
    return "ios";
  }

  return "other";
}

export function resolveDriveNavigator(
  preferredNavigator: NavigatorId | null | undefined,
  platform: MobilePlatform = detectMobilePlatform(),
): NavigatorId {
  if (preferredNavigator) {
    return preferredNavigator;
  }

  return platform === "ios" ? "apple-maps" : "google-maps";
}

export function buildStubNavigatorDeepLink(
  preferredNavigator?: NavigatorId | null,
  route: StubRoute = stubVoiceRoute,
  platform: MobilePlatform = detectMobilePlatform(),
): string {
  const navigatorId = resolveDriveNavigator(preferredNavigator, platform);
  const start = coordinate(route.startLatitude, route.startLongitude);
  const destination = coordinate(route.destinationLatitude, route.destinationLongitude);

  switch (navigatorId) {
    case "apple-maps":
      return `https://maps.apple.com/?saddr=${encode(start)}&daddr=${encode(route.destinationLabel)}&dirflg=d`;
    case "waze":
      return `https://waze.com/ul?q=${encode(route.destinationLabel)}&navigate=yes`;
    case "here-wego":
      return `https://wego.here.com/directions/drive/${encode(start)}/${encode(destination)}`;
    case "organic-maps":
      return `om://route?sll=${encode(start)}&saddr=${encode(route.startLabel)}&dll=${encode(destination)}&daddr=${encode(route.destinationLabel)}&type=vehicle`;
    case "gpx-export":
      return `data:application/gpx+xml;charset=utf-8,${encode(buildGpx(route))}`;
    case "google-maps":
    default:
      return `https://www.google.com/maps/dir/?api=1&origin=${encode(start)}&destination=${encode(route.destinationLabel)}&travelmode=driving`;
  }
}

export function buildAddressNavigatorDeepLink(
  preferredNavigator: NavigatorId | null | undefined,
  route: AddressRoute,
  platform: MobilePlatform = detectMobilePlatform(),
): string {
  const navigatorId = resolveDriveNavigator(preferredNavigator, platform);
  const start = route.startAddress.trim();
  const destination = route.destinationAddress.trim();

  switch (navigatorId) {
    case "apple-maps":
      return `https://maps.apple.com/?saddr=${encode(start)}&daddr=${encode(destination)}&dirflg=d`;
    case "waze":
      return `https://waze.com/ul?q=${encode(destination)}&navigate=yes`;
    case "here-wego":
      return `https://wego.here.com/directions/drive/${encode(start)}/${encode(destination)}`;
    case "organic-maps":
      return `om://route?saddr=${encode(start)}&daddr=${encode(destination)}&type=vehicle`;
    case "gpx-export":
      return `data:application/gpx+xml;charset=utf-8,${encode(
        buildAddressGpx({ startAddress: start, destinationAddress: destination }),
      )}`;
    case "google-maps":
    default:
      return `https://www.google.com/maps/dir/?api=1&origin=${encode(start)}&destination=${encode(destination)}&travelmode=driving`;
  }
}
