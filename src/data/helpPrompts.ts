export interface HelpPromptCategory {
  id: string;
  title: string;
  description: string;
  prompts: string[];
  /** Short provider-limitation summary; details live on the Navigator Comparison page. */
  limitationNote: string;
}

/**
 * Category ids the competitor-parity story (#40) requires to exist
 * with at least five examples each.
 */
export const requiredCategoryIds = [
  "waze-search",
  "along-route-search",
  "road-trip-ideas",
  "advanced-routing",
  "multi-stop",
  "exact-route-gpx",
] as const;

export const helpPromptCategories: HelpPromptCategory[] = [
  {
    id: "everyday-destinations",
    title: "Everyday Destinations",
    description: "Get going with saved places, addresses, and precise entrances.",
    prompts: [
      "Take me home.",
      "Navigate to work.",
      "Drive me to BWI.",
      "Take me to the ER entrance, not the main hospital.",
      "Use the school pickup entrance.",
      "Route me to the loading dock.",
      "Find parking near the venue and walk me in.",
      "Drive me to a Metro station, then transit into DC.",
    ],
    limitationNote:
      "Exact entrances and multi-leg plans hand off as coordinates; some navigators re-resolve them to the main address.",
  },
  {
    id: "waze-search",
    title: "Waze Search",
    description: "Search and navigate in Waze with live driver traffic.",
    prompts: [
      "Open Waze and search for Chabad Frederick.",
      "Navigate in Waze to Georgetown University.",
      "Use Waze for this destination.",
      "Open in Waze and avoid tolls.",
      "Use Waze, avoid freeways.",
      "Use Waze motorcycle mode.",
      "Use Waze for live traffic on my commute.",
      "Search for the nearest gas station in Waze.",
    ],
    limitationNote:
      "Waze recalculates on its own traffic model: multi-stop deep links and custom route shaping are not preserved.",
  },
  {
    id: "along-route-search",
    title: "Search Along the Route",
    description: "Describe what you need, not just a business name.",
    prompts: [
      "Find a quiet café on the way.",
      "Find a charger where I won't have to wait in a long coffee line.",
      "Find a public tennis court with lights tonight.",
      "I need coffee and a restroom.",
      "Find a kid-friendly lunch stop.",
      "Find a cheap gas station on the way.",
      "I need gas and food in one stop.",
      "Find coffee, gas, and a clean bathroom on the way.",
      "What interesting places are along this route?",
    ],
    limitationNote:
      "Results depend on place-data coverage; open hours and ratings are shown only when the data provider returns them.",
  },
  {
    id: "road-trip-ideas",
    title: "Road-Trip Ideas",
    description: "Roadtrippers-style trips with stops worth making.",
    prompts: [
      "Plan a scenic route to Ocean City with two interesting stops.",
      "Build a family-friendly road trip with playgrounds and lunch.",
      "Find a quick detour hidden gem.",
      "Plan this like Roadtrippers, but open in Google Maps.",
      "Bathroom stops every 90 minutes.",
      "Find a playground halfway there.",
      "No more than two hours without a break.",
      "Add one memorable food stop on the way to the beach.",
    ],
    limitationNote:
      "Trips with many stops hand off best to HERE WeGo, Organic Maps, or GPX; Google Maps mobile links may cap waypoints.",
  },
  {
    id: "advanced-routing",
    title: "Advanced Routing",
    description: "inRoute-style control: scenic, weather, vehicle, and surface constraints.",
    prompts: [
      "Take the scenic route, but don't add more than 30 minutes.",
      "Avoid mountain roads in snow.",
      "Avoid high wind bridges if possible.",
      "I'm driving an RV, avoid low bridges.",
      "Truck route, 12-foot height.",
      "Give me a fun motorcycle route with back roads.",
      "Bike me there, avoid busy roads.",
      "Flat bike route, please.",
      "Wheelchair-friendly route, no stairs.",
      "No dirt roads; my car is low.",
    ],
    limitationNote:
      "Constraints are planned with Valhalla costing; most navigators rebuild the route on handoff, so custom shaping may be lost.",
  },
  {
    id: "multi-stop",
    title: "Multi-Stop and Errands",
    description: "Optimize stop order and time windows across your day.",
    prompts: [
      "I need pharmacy, groceries, gas, then home — optimize it.",
      "Pick the best order for these five stops.",
      "Plan my 12 stops and end at home.",
      "Here are 10 addresses; optimize them and end at home.",
      "Paste these stops and open in HERE WeGo.",
      "This route has 12 stops; open it in the best navigator.",
      "Pharmacy closes at 6, daycare pickup by 5:30, then groceries.",
      "Make a route that gets me to the appointment by 3:45.",
      "Optimize these addresses, but avoid left turns on busy roads.",
    ],
    limitationNote:
      "Waze has no multi-stop handoff and Google Maps mobile links may cap at 3 waypoints; HERE WeGo supports up to 100.",
  },
  {
    id: "exact-route-gpx",
    title: "Exact Route (GPX)",
    description: "Keep the precise planned corridor instead of letting apps recalculate.",
    prompts: [
      "Export the exact route.",
      "I want to follow the planned route, not let another app recalculate.",
      "Save this route as a GPX file.",
      "Keep the exact corridor; don't let Google reroute me.",
      "Export this scenic loop for my GPS.",
      "Give me a GPX with all my stops included.",
    ],
    limitationNote:
      "GPX carries route shape with the highest fidelity, but the importing app may still recompute parts of the track.",
  },
  {
    id: "conditional-preferences",
    title: "Preferences and Conditions",
    description: "Rules with thresholds, not just on/off switches.",
    prompts: [
      "Avoid tolls.",
      "Use tolls only if they save at least 20 minutes.",
      "Avoid the Beltway unless it saves more than 15 minutes.",
      "Avoid I-95 unless the alternative is terrible.",
      "I'm tired, give me the easiest route home.",
      "Fewer turns, please.",
      "Keep me on this route unless it saves more than 15 minutes.",
      "Do not reroute me unless there is a closure.",
      "Avoid downtown unless it adds more than 10 minutes.",
    ],
    limitationNote:
      "Threshold logic is applied while planning; after handoff, the external navigator's own reroute behavior takes over.",
  },
  {
    id: "contextual-rules",
    title: "Contextual Rules",
    description: "Preferences that apply only on specific trips.",
    prompts: [
      "When I'm driving from Washington to home, prefer Exit 26.",
      "When going from work to daycare, use the back way through Rockville.",
      "From home to synagogue, prefer Route 355 unless traffic is bad.",
      "Use my normal route unless traffic is terrible.",
      "Prefer my usual commute route.",
      "Avoid the stadium area on game nights.",
    ],
    limitationNote:
      "Context matching happens during planning; navigators that rebuild routes may drop the preferred road unless it is a waypoint.",
  },
  {
    id: "provider-choice",
    title: "Choosing a Navigator",
    description: "Pick the right app for each route — or let RoadMuse recommend one.",
    prompts: [
      "Open this in Google Maps.",
      "Use Waze for live traffic.",
      "Use HERE because this route has many stops.",
      "Use Organic Maps because I want offline and privacy.",
      "Which navigator is best for this route?",
      "Open the first leg in Apple Maps.",
      "Use Waze for final navigation, but RoadMuse should plan the route first.",
      "Recommend the best app for a 15-stop route.",
    ],
    limitationNote:
      "Each navigator preserves different parts of a plan; the comparison page details waypoint, avoid, and shaping support.",
  },
  {
    id: "route-explanation",
    title: "Route Explanation",
    description: "Understand why a route was chosen before you drive it.",
    prompts: [
      "Why are you taking me this way?",
      "Why not my usual route?",
      "Is this because of traffic, tolls, or my preferences?",
      "Explain what preferences were applied.",
      "What warnings should I know before opening this in Waze?",
      "Compare this route to the fastest one.",
    ],
    limitationNote:
      "Explanations describe the plan at handoff time; live traffic conditions inside the external navigator can differ.",
  },
];

export function getTotalPromptCount(): number {
  return helpPromptCategories.reduce(
    (total, category) => total + category.prompts.length,
    0,
  );
}
