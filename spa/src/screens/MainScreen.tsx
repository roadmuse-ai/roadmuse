import { useEffect, useId, useState } from "react";
import {
  CircleDot,
  Clock3,
  Flag,
  MapPin,
  Mic,
  Milestone,
  Pencil,
  Play,
  Square,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import {
  buildAddressNavigatorDeepLink,
  stubVoiceRoute,
} from "../data/navigationLinks";
import { type PreviousTrip, type RouteWaypoint } from "../data/settings";

const stubPrompt =
  "Route Rockville to National Mall via Bethesda Row and Georgetown Waterfront Park. Find kid-friendly lunch with easy parking; avoid the Beltway unless it saves 15+ min.";

type VoiceHomeMode = "initial" | "listening" | "review" | "manual";

const defaultRouteDurationMinutes = 55;
const defaultRouteDistanceMiles = 14;
const defaultRouteTargetAddress = "National Mall, Washington, DC";
const defaultRouteWaypoints: RouteWaypoint[] = [
  {
    address: stubVoiceRoute.startLabel,
    latitude: stubVoiceRoute.startLatitude,
    longitude: stubVoiceRoute.startLongitude,
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
    address: defaultRouteTargetAddress,
    latitude: 38.8895,
    longitude: -77.0353,
  },
];
const starterTripPrompts = [
  "Dictate your first trip!",
  "Start with your voice!",
  "Say your first trip!",
  "Tell us where to go!",
  "Where to head?",
  "Speak your journey!",
  "Name your road!",
  "Whisper your destination...",
  "Tell where the road leads...",
  "Where shall we wander?",
  "Where are we off to?",
  "Let's start the journey!",
  "Say it, and we'll route it!",
] as const;
const starterTripPromptRotationMs = 4000;

function getRandomStarterTripPrompt(currentPrompt?: string): string {
  const promptOptions =
    currentPrompt && starterTripPrompts.length > 1
      ? starterTripPrompts.filter((starterPrompt) => starterPrompt !== currentPrompt)
      : starterTripPrompts;
  const promptIndex = Math.floor(Math.random() * promptOptions.length);

  return promptOptions[promptIndex] ?? starterTripPrompts[0];
}

function formatWaypoint(waypoint?: RouteWaypoint): string | null {
  if (!waypoint) {
    return null;
  }

  const address = waypoint.address?.trim();
  if (address) {
    return address;
  }

  if (Number.isFinite(waypoint.latitude) && Number.isFinite(waypoint.longitude)) {
    return `${waypoint.latitude},${waypoint.longitude}`;
  }

  return null;
}

function getStoredTripRoute(trip: PreviousTrip): RouteWaypoint[] {
  return (
    trip.route?.filter((waypoint) => formatWaypoint(waypoint) !== null) ?? []
  );
}

function getTripStartAddress(trip: PreviousTrip): string {
  return (
    formatWaypoint(getStoredTripRoute(trip)[0]) ??
    trip.startAddress ??
    stubVoiceRoute.startLabel
  );
}

function getTripEndAddress(trip: PreviousTrip): string {
  const route = getStoredTripRoute(trip);
  const routeEnd = formatWaypoint(route[route.length - 1]);
  if (routeEnd) {
    return routeEnd;
  }

  const endAddress = trip.endAddress?.trim();
  return endAddress && endAddress !== trip.prompt
    ? endAddress
    : defaultRouteTargetAddress;
}

function getTripRoute(trip: PreviousTrip): RouteWaypoint[] {
  const route = getStoredTripRoute(trip);

  if (route.length >= 2) {
    return route;
  }

  return [
    { address: getTripStartAddress(trip) },
    { address: getTripEndAddress(trip) },
  ];
}

function getTripDurationMinutes(trip: PreviousTrip): number {
  return trip.durationMinutes ?? defaultRouteDurationMinutes;
}

function getTripDistanceMiles(trip: PreviousTrip): number {
  return trip.distanceMiles ?? defaultRouteDistanceMiles;
}

function formatDuration(minutes: number): string {
  return `${minutes} min`;
}

function formatDistance(miles: number): string {
  const roundedMiles = Number.isInteger(miles) ? String(miles) : miles.toFixed(1);
  return `${roundedMiles} mi`;
}

function formatStopCount(stopCount = 0): string {
  return `${stopCount} ${stopCount === 1 ? "stop" : "stops"}`;
}

function getTripStopCount(trip: PreviousTrip): number {
  const route = getStoredTripRoute(trip);

  return route.length >= 2 ? Math.max(0, route.length - 2) : (trip.stopCount ?? 0);
}

interface TripDetail {
  label: string;
  value: string;
  Icon: LucideIcon;
}

interface TripTimeGroup {
  label: string;
  trips: PreviousTrip[];
}

const millisecondsPerDay = 24 * 60 * 60 * 1000;

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfLocalWeek(date: Date): Date {
  const start = startOfLocalDay(date);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function startOfLocalMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getTripTimeGroup(createdAt: number, nowTimestamp: number): string {
  const createdAtDate = new Date(createdAt);
  const now = new Date(nowTimestamp);
  const todayStart = startOfLocalDay(now);
  const yesterdayStart = new Date(todayStart.getTime() - millisecondsPerDay);
  const weekStart = startOfLocalWeek(now);
  const monthStart = startOfLocalMonth(now);

  if (createdAtDate >= todayStart) {
    return "Today";
  }

  if (createdAtDate >= yesterdayStart) {
    return "Yesterday";
  }

  if (createdAtDate >= weekStart) {
    return "This Week";
  }

  if (createdAtDate >= monthStart) {
    return "This Month";
  }

  return "Earlier";
}

function groupTripsByTime(
  trips: PreviousTrip[],
  nowTimestamp: number,
): TripTimeGroup[] {
  const groups = new Map<string, PreviousTrip[]>();

  trips.forEach((trip) => {
    const label = getTripTimeGroup(trip.createdAt, nowTimestamp);
    groups.set(label, [...(groups.get(label) ?? []), trip]);
  });

  return ["Today", "Yesterday", "This Week", "This Month", "Earlier"].flatMap(
    (label) => {
      const groupTrips = groups.get(label);
      return groupTrips && groupTrips.length > 0
        ? [{ label, trips: groupTrips }]
        : [];
    },
  );
}

function getTripAddressDetails(trip: PreviousTrip): TripDetail[] {
  const route = getTripRoute(trip);
  const start = route[0];
  const destination = route[route.length - 1];

  return [
    {
      label: "From",
      value: formatWaypoint(start) ?? getTripStartAddress(trip),
      Icon: MapPin,
    },
    {
      label: "To",
      value: formatWaypoint(destination) ?? getTripEndAddress(trip),
      Icon: Flag,
    },
  ];
}

function getTripMetaDetails(trip: PreviousTrip): TripDetail[] {
  return [
    {
      label: "Duration",
      value: formatDuration(getTripDurationMinutes(trip)),
      Icon: Clock3,
    },
    {
      label: "Distance",
      value: formatDistance(getTripDistanceMiles(trip)),
      Icon: Milestone,
    },
    {
      label: "stops",
      value: formatStopCount(getTripStopCount(trip)),
      Icon: CircleDot,
    },
  ];
}

function getTripSearchText(trip: PreviousTrip): string {
  return [
    trip.prompt,
    ...getTripRoute(trip).flatMap((waypoint) => formatWaypoint(waypoint) ?? []),
    ...getTripMetaDetails(trip).map((detail) => detail.value),
  ]
    .join(" ")
    .toLocaleLowerCase();
}

export function MainScreen() {
  const { settings, addPreviousTrip, removePreviousTrip } = useSettings();
  const promptId = useId();
  const searchId = useId();
  const [mode, setMode] = useState<VoiceHomeMode>("initial");
  const [prompt, setPrompt] = useState(stubPrompt);
  const [tripSearch, setTripSearch] = useState("");
  const [starterTripPrompt, setStarterTripPrompt] = useState(
    getRandomStarterTripPrompt,
  );

  const isListening = mode === "listening";
  const isReviewing = mode === "review" || mode === "manual";
  const showsPromptEntry = isListening || isReviewing;
  const reviewTitle =
    mode === "manual" || isListening ? "Enter Your Route" : "Review Your Route";
  const primaryActionLabel = isListening ? "Next" : "Drive";
  const middleActionLabel = isListening ? "Stop" : "Rerecord";
  const normalizedTripSearch = tripSearch.trim().toLocaleLowerCase();
  const filteredPreviousTrips = normalizedTripSearch
    ? settings.previousTrips.filter((trip) =>
        getTripSearchText(trip).includes(normalizedTripSearch),
      )
    : settings.previousTrips;
  const previousTripGroups = groupTripsByTime(filteredPreviousTrips, Date.now());

  useEffect(() => {
    if (mode !== "initial" || settings.previousTrips.length > 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setStarterTripPrompt((currentPrompt) =>
        getRandomStarterTripPrompt(currentPrompt),
      );
    }, starterTripPromptRotationMs);

    return () => window.clearInterval(intervalId);
  }, [mode, settings.previousTrips.length]);

  const startListening = () => {
    setPrompt("");
    setMode("listening");
  };

  const startManualEntry = () => {
    setPrompt("");
    setMode("manual");
  };

  const reviewPrompt = () => {
    setPrompt((current) => current || stubPrompt);
    setMode("review");
  };

  const rerecord = () => {
    setPrompt("");
    setMode("listening");
  };

  const backToPreviousTrips = () => {
    setPrompt(stubPrompt);
    setMode("initial");
  };

  const drive = () => {
    const drivePrompt = prompt.trim() || stubPrompt;
    const deepLink = buildAddressNavigatorDeepLink(settings.preferredNavigator, {
      startAddress: defaultRouteWaypoints[0]?.address ?? stubVoiceRoute.startLabel,
      destinationAddress:
        defaultRouteWaypoints[defaultRouteWaypoints.length - 1]?.address ??
        defaultRouteTargetAddress,
      waypoints: defaultRouteWaypoints,
    });

    addPreviousTrip(drivePrompt, {
      route: defaultRouteWaypoints,
      startAddress: stubVoiceRoute.startLabel,
      endAddress: defaultRouteTargetAddress,
      durationMinutes: defaultRouteDurationMinutes,
      distanceMiles: defaultRouteDistanceMiles,
      stopCount: 2,
    });

    setPrompt(stubPrompt);
    setMode("initial");
    window.open(deepLink, "_blank", "noopener,noreferrer");
  };

  const playPreviousTrip = (trip: PreviousTrip) => {
    window.open(
      buildAddressNavigatorDeepLink(settings.preferredNavigator, {
        startAddress: getTripStartAddress(trip),
        destinationAddress: getTripEndAddress(trip),
        waypoints: getTripRoute(trip),
      }),
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <section className="voice-home" aria-label="Voice route request">
      {mode === "initial" && settings.previousTrips.length > 0 ? (
        <div className="previous-trips" aria-labelledby="previous-trips-title">
          <h2 className="previous-trips__title" id="previous-trips-title">
            My Trips
          </h2>
          <div className="form-field previous-trips__search">
            <label className="sr-only" htmlFor={searchId}>
              Search Previous Trips
            </label>
            <input
              id={searchId}
              type="search"
              value={tripSearch}
              placeholder="Search previous trips"
              aria-label="Search Previous Trips"
              onChange={(event) => setTripSearch(event.target.value)}
            />
          </div>

          {filteredPreviousTrips.length > 0 ? (
            <div className="previous-trips__groups" aria-label="Previous Trips">
              {previousTripGroups.map((group) => (
                <div className="previous-trips__group" key={group.label}>
                  <h3 className="previous-trips__group-title">{group.label}</h3>
                  <ul className="previous-trips__list">
                    {group.trips.map((trip) => (
                      <li className="previous-trip" key={trip.id}>
                        <div className="previous-trip__body">
                          <ul
                            className="previous-trip__details"
                            aria-label={`Route details for ${trip.prompt}`}
                          >
                            {getTripAddressDetails(trip).map(
                              ({ label, value, Icon }) => (
                                <li
                                  className="previous-trip__detail previous-trip__detail--address"
                                  key={label}
                                  aria-label={`${label} ${value}`}
                                >
                                  <Icon
                                    aria-hidden="true"
                                    className="previous-trip__detail-icon"
                                  />
                                  <span>{value}</span>
                                </li>
                              ),
                            )}
                          </ul>
                          <p
                            className="previous-trip__prompt"
                            aria-label={`Prompt ${trip.prompt}`}
                          >
                            {trip.prompt}
                          </p>
                          <ul
                            className="previous-trip__meta"
                            aria-label={`Route stats for ${trip.prompt}`}
                          >
                            {getTripMetaDetails(trip).map(
                              ({ label, value, Icon }) => (
                                <li
                                  className="previous-trip__meta-item"
                                  key={label}
                                  aria-label={`${label} ${value}`}
                                >
                                  <Icon
                                    aria-hidden="true"
                                    className="previous-trip__meta-icon"
                                  />
                                  <span>{value}</span>
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                        <div className="previous-trip__actions">
                          <button
                            type="button"
                            className="saved-place__icon-btn"
                            aria-label={`Play ${trip.prompt}`}
                            title="Play"
                            onClick={() => playPreviousTrip(trip)}
                          >
                            <Play
                              aria-hidden="true"
                              size={17}
                              strokeWidth={2.2}
                            />
                          </button>
                          <button
                            type="button"
                            className="saved-place__icon-btn"
                            aria-label={`Remove ${trip.prompt}`}
                            title="Remove"
                            onClick={() => removePreviousTrip(trip.id)}
                          >
                            <Trash2
                              aria-hidden="true"
                              size={17}
                              strokeWidth={2.2}
                            />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="previous-trips__empty">No matching trips</p>
          )}
        </div>
      ) : null}

      {mode === "initial" && settings.previousTrips.length === 0 ? (
        <div className="previous-trips__starter">
          <h2 aria-live="polite">{starterTripPrompt}</h2>
        </div>
      ) : null}

      {showsPromptEntry ? (
        <div className="voice-home__review">
          <h2 className="voice-home__review-title">{reviewTitle}</h2>
          <label className="sr-only" htmlFor={promptId}>
            Driving Request
          </label>
          <div className="voice-home__prompt-shell">
            <textarea
              id={promptId}
              aria-label="Driving Request"
              className="voice-home__prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
            {isListening ? (
              <div
                className="voice-home__waves"
                aria-label="Voice waves animation"
                role="img"
              >
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {mode === "initial" ? (
        <>
          <button
            type="button"
            className="voice-home__manual-button"
            aria-label="Enter Route"
            title="Enter Route"
            onClick={startManualEntry}
          >
            <Pencil aria-hidden="true" />
          </button>
          <button
            type="button"
            className="voice-home__mic-button"
            aria-label="Start Voice Request"
            onClick={startListening}
          >
            <Mic aria-hidden="true" />
          </button>
        </>
      ) : (
        <div className="voice-home__actions">
          <button
            type="button"
            className="voice-home__action voice-home__action--secondary voice-home__action--left"
            aria-label="Back to Previous Trips"
            title="Back"
            onClick={backToPreviousTrips}
          >
            <Play aria-hidden="true" className="voice-home__back-icon" />
          </button>

          <button
            type="button"
            className="voice-home__action voice-home__action--secondary voice-home__action--middle"
            aria-label={middleActionLabel}
            title={middleActionLabel}
            onClick={isListening ? reviewPrompt : rerecord}
          >
            {isListening ? (
              <Square aria-hidden="true" />
            ) : (
              <Mic aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            className="voice-home__action voice-home__action--primary voice-home__action--right"
            aria-label={primaryActionLabel}
            title="Drive"
            onClick={drive}
          >
            <Play aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
