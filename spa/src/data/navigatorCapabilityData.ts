type CapabilityDetail = {
  icon: string;
  detail: string;
};

export type CapabilityName =
  | "Waypoints"
  | "Route shape carry-over"
  | "Avoid options"
  | "Traffic focus"
  | "Favorites/multi-stop UI";

export type ProviderCapabilityData = Record<CapabilityName, CapabilityDetail>;

export type ProviderMatrixRow = {
  provider: string;
  strengths: string[];
  capability: ProviderCapabilityData;
  notes: string;
};

export const providerMatrix: ProviderMatrixRow[] = [
  {
    provider: "Google Maps",
    strengths: [
      "Best all-around default when route shaping is simple",
      "Supports destination handoff links",
    ],
    capability: {
      "Waypoints": {
        icon: "✅",
        detail: "Waypoint support depends on destination mode and app limits (mobile links may cap at 3)",
      },
      "Route shape carry-over": {
        icon: "⚠️",
        detail: "Best effort; custom shaping may be re-routed by the target app",
      },
      "Avoid options": {
        icon: "✅",
        detail: "Supports avoid=tolls, avoid=highways, and avoid=ferries where supported",
      },
      "Traffic focus": {
        icon: "✅",
        detail: "Uses platform traffic input in supported scenarios",
      },
      "Favorites/multi-stop UI": {
        icon: "⚠️",
        detail: "Favorite destination behavior exists, but route planning is variable",
      },
    },
    notes:
      "Capability and UI vary by product/version; if route details are unsupported, the link falls back to the nearest supported behavior.",
  },
  {
    provider: "Waze",
    strengths: [
      "Strong traffic-first driving experience",
      "Supports search and favorite destination handoff",
    ],
    capability: {
      "Waypoints": {
        icon: "❌",
        detail: "Not documented as multi-stop deep-link handoff",
      },
      "Route shape carry-over": {
        icon: "⚠️",
        detail: "Traffic-aware reroute model may not preserve a handcrafted corridor",
      },
      "Avoid options": {
        icon: "✅",
        detail: "Supports avoid-related behavior when exposed by app-level preferences",
      },
      "Traffic focus": {
        icon: "✅",
        detail: "Strongest differentiator for real-time traffic-first routing",
      },
      "Favorites/multi-stop UI": {
        icon: "✅",
        detail: "Home and work destination shortcuts are commonly supported",
      },
    },
    notes:
      "Deep-link docs focus on `q`/`ll` plus navigation parameters and favorites, so multi-stop shaping should be treated as limited.",
  },
  {
    provider: "Apple Maps",
    strengths: [
      "Native iOS map handoff",
      "Strong on-device map handoff for common destinations",
    ],
    capability: {
      "Waypoints": {
        icon: "⚠️",
        detail: "Destination-first URL scheme; fewer explicit waypoints than specialized flow",
      },
      "Route shape carry-over": {
        icon: "⚠️",
        detail: "No strong guarantee of preserving a custom corridor from external input",
      },
      "Avoid options": {
        icon: "⚠️",
        detail: "Mode and basic route request input is available in common flows",
      },
      "Traffic focus": {
        icon: "⚠️",
        detail: "Depends on platform settings and Apple Maps implementation state",
      },
      "Favorites/multi-stop UI": {
        icon: "❌",
        detail: "Not positioned as a multi-stop deep-link planner",
      },
    },
    notes:
      "Apple Maps URL links are direction-focused and best used for destination or destination+mode handoff.",
  },
  {
    provider: "HERE WeGo",
    strengths: [
      "Most capable for route-shaping + pass-through behavior",
      "Designed for route editing and control-heavy use",
    ],
    capability: {
      "Waypoints": {
        icon: "✅",
        detail: "Supports regular and pass-through waypoints in shared-route formats",
      },
      "Route shape carry-over": {
        icon: "✅",
        detail: "Designed for stronger route-shaping handoff than many alternatives",
      },
      "Avoid options": {
        icon: "✅",
        detail: "Routing constraints commonly supported in route links",
      },
      "Traffic focus": {
        icon: "⚠️",
        detail: "Own map/network stack with variable traffic behavior by route/region",
      },
      "Favorites/multi-stop UI": {
        icon: "✅",
        detail: "Visible and hidden stops can be carried by share links",
      },
    },
    notes:
      "HERE WeGo Pro deep links support up to 100 waypoints, with implementation guidance to keep practical URLs shorter.",
  },
  {
    provider: "Organic Maps",
    strengths: [
      "Offline-first and privacy-first routing flow",
      "Supports car/walk/bike/transit route route requests in tested deep-link API",
    ],
    capability: {
      "Waypoints": {
        icon: "⚠️",
        detail: "Mostly start/end handoff in observed intent examples",
      },
      "Route shape carry-over": {
        icon: "⚠️",
        detail: "Route-shape intent not guaranteed across all target apps",
      },
      "Avoid options": {
        icon: "⚠️",
        detail: "Constraint handling depends on map profile and runtime support",
      },
      "Traffic focus": {
        icon: "❌",
        detail: "Traffic-first planning is not its core differentiator",
      },
      "Favorites/multi-stop UI": {
        icon: "⚠️",
        detail: "Best for destination/mode handoff; less for multi-stop control",
      },
    },
    notes:
      "Organic Maps exposes intent-based route links through its API/intent scheme; validate for multi-stop and profile-specific behavior on target devices.",
  },
  {
    provider: "GPX Export",
    strengths: [
      "Most deterministic for carrying a planned path",
      "Useful when exact route shape matters most",
    ],
    capability: {
      "Waypoints": {
        icon: "✅",
        detail: "Best for retaining route shape through generated multi-point track",
      },
      "Route shape carry-over": {
        icon: "✅",
        detail: "Usually highest fidelity for corridor intent, if importer accepts GPX",
      },
      "Avoid options": {
        icon: "⚪",
        detail: "Avoid preferences generally remain with the file format or importing app",
      },
      "Traffic focus": {
        icon: "❌",
        detail: "No live traffic logic in the route file itself",
      },
      "Favorites/multi-stop UI": {
        icon: "⚪",
        detail: "Acts as route artifact rather than a live navigation profile",
      },
    },
    notes:
      "Use this when route shape or exact corridor intent is most important, and accept that the destination app may still re-compute parts depending on compatibility.",
  },
];

export const capabilityDescriptions: Array<{ name: CapabilityName; meaning: string }> = [
  {
    name: "Waypoints",
    meaning:
      "Whether the navigator handoff can include intermediate stop points and honor their order during routing.",
  },
  {
    name: "Route shape carry-over",
    meaning:
      "Whether the route’s intended shape (specific road choices and corridor shape) is likely preserved, or likely rebuilt by the target app.",
  },
  {
    name: "Avoid options",
    meaning:
      "Whether the navigator handoff can respect exclusions like tolls, highways, and ferries during route request.",
  },
  {
    name: "Traffic focus",
    meaning:
      "Whether live traffic inputs are central to how the app routes and re-optimizes compared with static or minimal traffic behavior.",
  },
  {
    name: "Favorites/multi-stop UI",
    meaning:
      "Whether the handoff is good for quickly opening saved places and for routes with multiple stops.",
  },
];
