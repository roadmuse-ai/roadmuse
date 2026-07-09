import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
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
  X,
  type LucideIcon,
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import {
  buildAddressNavigatorDeepLink,
  stubVoiceRoute,
} from "../data/navigationLinks";
import {
  type DistanceUnits,
  type PreviousTrip,
  type RouteWaypoint,
} from "../data/settings";

const stubPrompt =
  "Route Rockville to National Mall via Bethesda Row and Georgetown Waterfront Park. Find kid-friendly lunch with easy parking; avoid the Beltway unless it saves 15+ min.";

type VoiceHomeMode = "initial" | "listening" | "review" | "manual";

const defaultRouteDurationMinutes = 55;
const defaultRouteDistanceMiles = 14;
const kilometersPerMile = 1.609344;
const voiceActivityThreshold = 0.008;
const voiceBarCount = 21;
const voiceBarHistoryWindowMs = 1800;
const voiceBarRenderResponse = 0.62;
const stillVoiceBarLevel = 0.16;
const voiceBarSensitivity = 3.6;
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

type AudioEnabledWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };
type VoiceLevelHistoryPoint = {
  level: number;
  time: number;
};

function getRandomStarterTripPrompt(currentPrompt?: string): string {
  const promptOptions =
    currentPrompt && starterTripPrompts.length > 1
      ? starterTripPrompts.filter((starterPrompt) => starterPrompt !== currentPrompt)
      : starterTripPrompts;
  const promptIndex = Math.floor(Math.random() * promptOptions.length);

  return promptOptions[promptIndex] ?? starterTripPrompts[0];
}

function getAudioVolume(timeDomainData: Uint8Array): number {
  if (timeDomainData.length === 0) {
    return 0;
  }

  let totalSquares = 0;

  for (const byte of timeDomainData) {
    const normalizedSample = (byte - 128) / 128;
    totalSquares += normalizedSample * normalizedSample;
  }

  return Math.sqrt(totalSquares / timeDomainData.length);
}

function clampVoiceBarLevel(level: number): number {
  return Math.max(stillVoiceBarLevel, Math.min(1, level));
}

function getStillVoiceBarLevels(): number[] {
  return Array.from({ length: voiceBarCount }, () => stillVoiceBarLevel);
}

function smoothVoiceBarLevels(levels: number[]): number[] {
  return levels.map((level, index) => {
    const previousLevel = levels[index - 1] ?? level;
    const nextLevel = levels[index + 1] ?? level;

    return clampVoiceBarLevel(
      previousLevel * 0.2 + level * 0.6 + nextLevel * 0.2,
    );
  });
}

function dampVoiceBarLevels(
  previousLevels: number[],
  targetLevels: number[],
): number[] {
  return targetLevels.map((targetLevel, index) => {
    const previousLevel = previousLevels[index] ?? stillVoiceBarLevel;

    return clampVoiceBarLevel(
      previousLevel * (1 - voiceBarRenderResponse) +
        targetLevel * voiceBarRenderResponse,
    );
  });
}

function getVoiceHistoryLevels(
  history: VoiceLevelHistoryPoint[],
  currentTime: number,
): number[] {
  const maxBarIndex = Math.max(1, voiceBarCount - 1);
  const weightedLevels = Array.from({ length: voiceBarCount }, () => 0);
  const barWeights = Array.from({ length: voiceBarCount }, () => 0);

  for (const point of history) {
    const pointAge = currentTime - point.time;

    if (pointAge < 0 || pointAge > voiceBarHistoryWindowMs) {
      continue;
    }

    const barPosition =
      maxBarIndex - (pointAge / voiceBarHistoryWindowMs) * maxBarIndex;
    const lowerBarIndex = Math.floor(barPosition);
    const upperBarIndex = Math.ceil(barPosition);
    const upperBarWeight = barPosition - lowerBarIndex;
    const lowerBarWeight = 1 - upperBarWeight;

    weightedLevels[lowerBarIndex] += point.level * lowerBarWeight;
    barWeights[lowerBarIndex] += lowerBarWeight;

    if (upperBarIndex !== lowerBarIndex) {
      weightedLevels[upperBarIndex] += point.level * upperBarWeight;
      barWeights[upperBarIndex] += upperBarWeight;
    }
  }

  return weightedLevels.map((level, index) => {
    const weight = barWeights[index];

    return weight > 0 ? clampVoiceBarLevel(level / weight) : stillVoiceBarLevel;
  });
}

function getVoiceBarState(
  timeDomainData: Uint8Array,
  history: VoiceLevelHistoryPoint[],
  currentTime: number,
): {
  history: VoiceLevelHistoryPoint[];
  isVoiceActive: boolean;
  levels: number[];
} {
  const audioVolume = getAudioVolume(timeDomainData);

  if (timeDomainData.length === 0 || audioVolume < voiceActivityThreshold) {
    const trailingHistory = history.filter(
      (point) => currentTime - point.time <= voiceBarHistoryWindowMs,
    );
    const trailingLevels =
      trailingHistory.length > 0
        ? smoothVoiceBarLevels(getVoiceHistoryLevels(trailingHistory, currentTime))
        : getStillVoiceBarLevels();

    return {
      history: trailingHistory,
      isVoiceActive: false,
      levels: trailingLevels,
    };
  }

  const currentLevel = clampVoiceBarLevel(
    stillVoiceBarLevel + audioVolume * voiceBarSensitivity * 3.4,
  );
  const nextHistory = [
    ...history,
    { level: currentLevel, time: currentTime },
  ].filter((point) => currentTime - point.time <= voiceBarHistoryWindowMs);

  return {
    history: nextHistory,
    isVoiceActive: true,
    levels: smoothVoiceBarLevels(getVoiceHistoryLevels(nextHistory, currentTime)),
  };
}

function getVoiceBarStyle(level: number, index: number): CSSProperties {
  return {
    "--voice-index": index.toString(),
    "--voice-level": level.toFixed(3),
  } as CSSProperties;
}

function stopAudioStream(stream?: MediaStream): void {
  stream?.getTracks().forEach((track) => track.stop());
}

function getAudioContextConstructor(): typeof AudioContext | undefined {
  return window.AudioContext ?? (window as AudioEnabledWindow).webkitAudioContext;
}

function useVoiceBars(isListening: boolean): {
  isAudioResponsive: boolean;
  isVoiceActive: boolean;
  levels: number[];
} {
  const [levels, setLevels] = useState(getStillVoiceBarLevels);
  const [isAudioResponsive, setIsAudioResponsive] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const voiceLevelHistoryRef = useRef<VoiceLevelHistoryPoint[]>([]);
  const renderedVoiceLevelsRef = useRef(getStillVoiceBarLevels());

  useEffect(() => {
    if (!isListening) {
      voiceLevelHistoryRef.current = [];
      renderedVoiceLevelsRef.current = getStillVoiceBarLevels();
      setLevels(getStillVoiceBarLevels());
      setIsAudioResponsive(false);
      setIsVoiceActive(false);
      return undefined;
    }

    let isActive = true;
    let animationFrameId: number | undefined;
    let audioContext: AudioContext | undefined;
    let audioSource: MediaStreamAudioSourceNode | undefined;
    let stream: MediaStream | undefined;

    const stopAudioAnalysis = () => {
      if (animationFrameId !== undefined) {
        window.cancelAnimationFrame(animationFrameId);
      }

      audioSource?.disconnect();
      void audioContext?.close();
      stopAudioStream(stream);
    };

    const startAudioAnalysis = async () => {
      const AudioContextConstructor = getAudioContextConstructor();

      if (!navigator.mediaDevices?.getUserMedia || !AudioContextConstructor) {
        voiceLevelHistoryRef.current = [];
        renderedVoiceLevelsRef.current = getStillVoiceBarLevels();
        setLevels(getStillVoiceBarLevels());
        setIsAudioResponsive(false);
        setIsVoiceActive(false);
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        if (!isActive) {
          stopAudioStream(stream);
          return;
        }

        audioContext = new AudioContextConstructor();

        if (audioContext.state === "suspended") {
          await audioContext.resume().catch(() => undefined);
        }

        if (!isActive) {
          stopAudioAnalysis();
          return;
        }

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.64;
        const timeDomainData = new Uint8Array(analyser.fftSize);
        audioSource = audioContext.createMediaStreamSource(stream);
        audioSource.connect(analyser);
        setIsAudioResponsive(true);

        const updateLevels = () => {
          if (!isActive) {
            return;
          }

          analyser.getByteTimeDomainData(timeDomainData);
          const voiceBarState = getVoiceBarState(
            timeDomainData,
            voiceLevelHistoryRef.current,
            window.performance.now(),
          );
          voiceLevelHistoryRef.current = voiceBarState.history;
          renderedVoiceLevelsRef.current =
            voiceBarState.history.length > 0
              ? dampVoiceBarLevels(
                  renderedVoiceLevelsRef.current,
                  voiceBarState.levels,
                )
              : voiceBarState.levels;
          setLevels(renderedVoiceLevelsRef.current);
          setIsVoiceActive(voiceBarState.isVoiceActive);
          animationFrameId = window.requestAnimationFrame(updateLevels);
        };

        updateLevels();
      } catch {
        if (!isActive) {
          return;
        }

        stopAudioStream(stream);
        stream = undefined;
        voiceLevelHistoryRef.current = [];
        renderedVoiceLevelsRef.current = getStillVoiceBarLevels();
        setLevels(getStillVoiceBarLevels());
        setIsAudioResponsive(false);
        setIsVoiceActive(false);
      }
    };

    void startAudioAnalysis();

    return () => {
      isActive = false;
      stopAudioAnalysis();
    };
  }, [isListening]);

  return { isAudioResponsive, isVoiceActive, levels };
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

function formatDistance(miles: number, units: DistanceUnits): string {
  const distance = units === "kilometers" ? miles * kilometersPerMile : miles;
  const roundedDistance = Number.isInteger(distance)
    ? String(distance)
    : distance.toFixed(1);
  const unitLabel = units === "kilometers" ? "km" : "mi";

  return `${roundedDistance} ${unitLabel}`;
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

function getTripMetaDetails(trip: PreviousTrip, units: DistanceUnits): TripDetail[] {
  return [
    {
      label: "Duration",
      value: formatDuration(getTripDurationMinutes(trip)),
      Icon: Clock3,
    },
    {
      label: "Distance",
      value: formatDistance(getTripDistanceMiles(trip), units),
      Icon: Milestone,
    },
    {
      label: "stops",
      value: formatStopCount(getTripStopCount(trip)),
      Icon: CircleDot,
    },
  ];
}

function getTripSearchText(trip: PreviousTrip, units: DistanceUnits): string {
  return [
    trip.prompt,
    ...getTripRoute(trip).flatMap((waypoint) => formatWaypoint(waypoint) ?? []),
    ...getTripMetaDetails(trip, units).map((detail) => detail.value),
  ]
    .join(" ")
    .toLocaleLowerCase();
}

export function MainScreen() {
  const { settings, addPreviousTrip, removePreviousTrip } = useSettings();
  const promptId = useId();
  const searchId = useId();
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<VoiceHomeMode>("initial");
  const [prompt, setPrompt] = useState(stubPrompt);
  const [tripSearch, setTripSearch] = useState("");
  const [starterTripPrompt, setStarterTripPrompt] = useState(
    getRandomStarterTripPrompt,
  );

  const isListening = mode === "listening";
  const {
    isAudioResponsive,
    isVoiceActive,
    levels: voiceBarLevels,
  } = useVoiceBars(isListening);
  const isReviewing = mode === "review" || mode === "manual";
  const showsPromptEntry = isListening || isReviewing;
  const reviewTitle =
    mode === "manual" || isListening ? "Enter Your Route" : "Review Your Route";
  const primaryActionLabel = isListening ? "Next" : "Drive";
  const middleActionLabel = isListening ? "Stop" : "Rerecord";
  const distanceUnits = settings.routeSettings.units;
  const normalizedTripSearch = tripSearch.trim().toLocaleLowerCase();
  const filteredPreviousTrips = normalizedTripSearch
    ? settings.previousTrips.filter((trip) =>
        getTripSearchText(trip, distanceUnits).includes(normalizedTripSearch),
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

  useEffect(() => {
    if (mode === "manual") {
      promptRef.current?.focus();
    }
  }, [mode]);

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
    <section
      className={`voice-home${showsPromptEntry ? " voice-home--prompt-entry" : ""}`}
      aria-label="Voice route request"
    >
      {mode === "initial" && settings.previousTrips.length > 0 ? (
        <div className="previous-trips" aria-labelledby="previous-trips-title">
          <h2 className="previous-trips__title" id="previous-trips-title">
            My Trips
          </h2>
          <div className="form-field previous-trips__search">
            <label className="sr-only" htmlFor={searchId}>
              Search Previous Trips
            </label>
            <div className="previous-trips__search-control">
              <input
                id={searchId}
                type="search"
                value={tripSearch}
                placeholder="Search previous trips"
                aria-label="Search Previous Trips"
                onChange={(event) => setTripSearch(event.target.value)}
              />
              {tripSearch ? (
                <button
                  type="button"
                  className="previous-trips__search-clear"
                  aria-label="Clear Previous Trips Search"
                  title="Clear"
                  onClick={() => setTripSearch("")}
                >
                  <X aria-hidden="true" />
                </button>
              ) : null}
            </div>
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
                            {getTripMetaDetails(trip, distanceUnits).map(
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
          <h2
            aria-live="polite"
            className="previous-trips__starter-title"
            key={starterTripPrompt}
          >
            {starterTripPrompt}
          </h2>
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
              ref={promptRef}
              aria-label="Driving Request"
              className="voice-home__prompt"
              disabled={isListening}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
            {isListening ? (
              <div
                className={`voice-home__voice-bars${
                  isAudioResponsive
                    ? " voice-home__voice-bars--responsive"
                    : " voice-home__voice-bars--fallback"
                }`}
                aria-label="Sound-responsive voice bars"
                data-audio-responsive={isAudioResponsive}
                data-voice-active={isVoiceActive}
                role="img"
              >
                {voiceBarLevels.map((level, index) => (
                  <span key={index} style={getVoiceBarStyle(level, index)} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {mode === "initial" ? (
        <>
          <button
            type="button"
            className="voice-home__mic-button"
            aria-label="Start Voice Request"
            onClick={startListening}
          >
            <Mic aria-hidden="true" />
          </button>
          <button
            type="button"
            className="voice-home__manual-button"
            aria-label="Enter Route"
            title="Enter Route"
            onClick={startManualEntry}
          >
            <Pencil aria-hidden="true" />
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
