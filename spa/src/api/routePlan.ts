import { type AddressRoute } from "../data/navigationLinks";
import { type RouteWaypoint, type SavedPlace } from "../data/settings";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

interface WireCoordinate {
  latitude: number;
  longitude: number;
}

interface WireLocationRef {
  kind: string;
  label: string | null;
  coordinate: WireCoordinate | null;
  saved_place_id: string | null;
  is_resolved: boolean;
  is_ambiguous: boolean;
}

interface WireWaypoint {
  location: WireLocationRef;
  kind: string;
}

interface WireRouteIntent {
  origin: WireLocationRef | null;
  destination: WireLocationRef;
  waypoints: WireWaypoint[];
  mode: string;
  raw_prompt: string | null;
}

interface RoutePlanResponse {
  interpreted_intent: WireRouteIntent;
  warnings: string[];
}

export interface PlannedRoute {
  route: AddressRoute;
  warnings: string[];
}

function toWaypoint(location: WireLocationRef): RouteWaypoint {
  return {
    address: location.label ?? undefined,
    latitude: location.coordinate?.latitude,
    longitude: location.coordinate?.longitude,
  };
}

function waypointLabel(waypoint: RouteWaypoint): string {
  if (waypoint.address?.trim()) {
    return waypoint.address.trim();
  }
  if (Number.isFinite(waypoint.latitude) && Number.isFinite(waypoint.longitude)) {
    return `${waypoint.latitude},${waypoint.longitude}`;
  }
  return "";
}

/** Map the backend's interpreted intent to the SPA's navigator-link shape. */
export function intentToAddressRoute(intent: WireRouteIntent): AddressRoute {
  const points: RouteWaypoint[] = [];
  if (intent.origin) {
    points.push(toWaypoint(intent.origin));
  }
  for (const waypoint of intent.waypoints) {
    points.push(toWaypoint(waypoint.location));
  }
  points.push(toWaypoint(intent.destination));

  const start = points[0];
  const end = points[points.length - 1];
  return {
    startAddress: start ? waypointLabel(start) : "",
    destinationAddress: end ? waypointLabel(end) : "",
    waypoints: points,
  };
}

/**
 * Parse a free-text prompt into a route via the backend.
 *
 * Returns null when no backend is configured, the request fails, or the
 * response is unusable — the caller falls back to its stub route so the app
 * keeps working offline (mirrors preferenceValidation.ts).
 */
export async function planRoute(
  prompt: string,
  currentLocation: WireCoordinate | undefined,
  savedPlaces: SavedPlace[],
): Promise<PlannedRoute | null> {
  const trimmed = prompt.trim();
  if (!apiBaseUrl || !trimmed) {
    return null;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/route/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: trimmed,
        current_location: currentLocation ?? null,
        settings: {
          saved_places: savedPlaces.map((place) => ({
            id: place.id,
            label: place.label,
            address: place.address,
            latitude: place.latitude,
            longitude: place.longitude,
          })),
        },
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as Partial<RoutePlanResponse>;
    if (!payload.interpreted_intent?.destination) {
      return null;
    }

    return {
      route: intentToAddressRoute(payload.interpreted_intent),
      warnings: payload.warnings ?? [],
    };
  } catch {
    return null;
  }
}
