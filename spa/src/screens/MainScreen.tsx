import { useEffect, useId, useRef, useState } from "react";
import {
  CalendarClock,
  CircleDot,
  Clock3,
  Flag,
  MapPin,
  Mic,
  Milestone,
  Play,
  RefreshCw,
  Square,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { buildStubNavigatorDeepLink, stubVoiceRoute } from "../data/navigationLinks";
import { type PreviousTrip } from "../data/settings";

const stubPrompt =
  "Find a kid-friendly lunch stop near the National Mall with easy parking, and avoid the Beltway unless it saves more than 15 minutes.";

type VoiceHomeMode = "initial" | "listening" | "review" | "returning";

const defaultRouteDurationMinutes = 55;
const defaultRouteDistanceMiles = 14;
const defaultRouteTargetAddress = "National Mall, Washington, DC";
const routeDetailsTimeZone = "America/New_York";

const routeDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: routeDetailsTimeZone,
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

function getTripStartAddress(trip: PreviousTrip): string {
  return trip.startAddress ?? stubVoiceRoute.startLabel;
}

function getTripEndAddress(trip: PreviousTrip): string {
  const endAddress = trip.endAddress?.trim();
  return endAddress && endAddress !== trip.prompt
    ? endAddress
    : defaultRouteTargetAddress;
}

function getTripDurationMinutes(trip: PreviousTrip): number {
  return trip.durationMinutes ?? defaultRouteDurationMinutes;
}

function getTripDistanceMiles(trip: PreviousTrip): number {
  return trip.distanceMiles ?? defaultRouteDistanceMiles;
}

function formatOrdinal(value: number): string {
  const remainder = value % 100;

  if (remainder >= 11 && remainder <= 13) {
    return `${value}th`;
  }

  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

function getDatePart(parts: Intl.DateTimeFormatPart[], type: string): string {
  return parts.find((part) => part.type === type)?.value ?? "";
}

function formatTripDateTime(timestamp: number): string {
  const parts = routeDateTimeFormatter.formatToParts(new Date(timestamp));
  const month = getDatePart(parts, "month");
  const day = Number(getDatePart(parts, "day"));
  const year = getDatePart(parts, "year");
  const hour = getDatePart(parts, "hour");
  const minute = getDatePart(parts, "minute");
  const dayPeriod = getDatePart(parts, "dayPeriod");

  return `${month} ${formatOrdinal(day)}, ${year}, ${hour}:${minute} ${dayPeriod}`;
}

function formatDuration(minutes: number): string {
  return `${minutes} min`;
}

function formatDistance(miles: number): string {
  const roundedMiles = Number.isInteger(miles) ? String(miles) : miles.toFixed(1);
  return `${roundedMiles} mi`;
}

function formatStopCount(stopCount = 0): string {
  return `${stopCount} ${stopCount === 1 ? "Stop" : "Stops"}`;
}

interface TripDetail {
  label: string;
  value: string;
  Icon: LucideIcon;
}

function getTripAddressDetails(trip: PreviousTrip): TripDetail[] {
  return [
    {
      label: "From",
      value: getTripStartAddress(trip),
      Icon: MapPin,
    },
    {
      label: "To",
      value: getTripEndAddress(trip),
      Icon: Flag,
    },
  ];
}

function getTripMetaDetails(trip: PreviousTrip): TripDetail[] {
  return [
    {
      label: "Datetime",
      value: formatTripDateTime(trip.createdAt),
      Icon: CalendarClock,
    },
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
      label: "Stops",
      value: formatStopCount(trip.stopCount),
      Icon: CircleDot,
    },
  ];
}

function getTripSearchText(trip: PreviousTrip): string {
  return [
    trip.prompt,
    ...getTripAddressDetails(trip).map((detail) => detail.value),
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
  const driveTimeoutRef = useRef<number | null>(null);
  const handoffTimeoutRef = useRef<number | null>(null);

  const isListening = mode === "listening";
  const isReviewing = mode === "review";
  const isReturning = mode === "returning";
  const primaryActionLabel = isListening ? "Next" : "Drive";
  const middleActionLabel = isListening ? "Stop" : "Rerecord";
  const normalizedTripSearch = tripSearch.trim().toLocaleLowerCase();
  const filteredPreviousTrips = normalizedTripSearch
    ? settings.previousTrips.filter((trip) =>
        getTripSearchText(trip).includes(normalizedTripSearch),
      )
    : settings.previousTrips;

  useEffect(() => {
    return () => {
      if (driveTimeoutRef.current !== null) {
        window.clearTimeout(driveTimeoutRef.current);
      }
      if (handoffTimeoutRef.current !== null) {
        window.clearTimeout(handoffTimeoutRef.current);
      }
    };
  }, []);

  const startListening = () => {
    setMode("listening");
  };

  const reviewPrompt = () => {
    setPrompt((current) => current || stubPrompt);
    setMode("review");
  };

  const rerecord = () => {
    setPrompt(stubPrompt);
    setMode("listening");
  };

  const backToPreviousTrips = () => {
    if (driveTimeoutRef.current !== null) {
      window.clearTimeout(driveTimeoutRef.current);
      driveTimeoutRef.current = null;
    }
    if (handoffTimeoutRef.current !== null) {
      window.clearTimeout(handoffTimeoutRef.current);
      handoffTimeoutRef.current = null;
    }

    setPrompt(stubPrompt);
    setMode("initial");
  };

  const drive = () => {
    const drivePrompt = prompt.trim() || stubPrompt;
    const deepLink = buildStubNavigatorDeepLink(settings.preferredNavigator, {
      ...stubVoiceRoute,
      destinationLabel: defaultRouteTargetAddress,
    });

    addPreviousTrip(drivePrompt, {
      startAddress: stubVoiceRoute.startLabel,
      endAddress: defaultRouteTargetAddress,
      durationMinutes: defaultRouteDurationMinutes,
      distanceMiles: defaultRouteDistanceMiles,
      stopCount: 0,
    });

    setMode("returning");

    if (driveTimeoutRef.current !== null) {
      window.clearTimeout(driveTimeoutRef.current);
    }
    if (handoffTimeoutRef.current !== null) {
      window.clearTimeout(handoffTimeoutRef.current);
    }

    driveTimeoutRef.current = window.setTimeout(() => {
      setPrompt(stubPrompt);
      setMode("initial");
      driveTimeoutRef.current = null;

      handoffTimeoutRef.current = window.setTimeout(() => {
        handoffTimeoutRef.current = null;
        window.open(deepLink, "_blank", "noopener,noreferrer");
      }, 160);
    }, 360);
  };

  const playPreviousTrip = (trip: PreviousTrip) => {
    window.open(
      buildStubNavigatorDeepLink(settings.preferredNavigator, {
        ...stubVoiceRoute,
        destinationLabel: getTripEndAddress(trip),
      }),
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <section className="voice-home" aria-label="Voice route request">
      {mode === "initial" && settings.previousTrips.length > 0 ? (
        <div className="previous-trips" aria-labelledby="previous-trips-title">
          <h2 className="sr-only" id="previous-trips-title">
            Previous Trips
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
            <ul className="previous-trips__list" aria-label="Previous Trips">
              {filteredPreviousTrips.map((trip) => (
                <li className="previous-trip" key={trip.id}>
                  <div className="previous-trip__body">
                    <ul
                      className="previous-trip__details"
                      aria-label={`Route details for ${trip.prompt}`}
                    >
                      {getTripAddressDetails(trip).map(({ label, value, Icon }) => (
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
                      ))}
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
                      {getTripMetaDetails(trip).map(({ label, value, Icon }) => (
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
                      ))}
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
                      <Play aria-hidden="true" size={17} strokeWidth={2.2} />
                    </button>
                    <button
                      type="button"
                      className="saved-place__icon-btn"
                      aria-label={`Remove ${trip.prompt}`}
                      title="Remove"
                      onClick={() => removePreviousTrip(trip.id)}
                    >
                      <Trash2 aria-hidden="true" size={17} strokeWidth={2.2} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="previous-trips__empty">No matching trips</p>
          )}
        </div>
      ) : null}

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

      {isReviewing ? (
        <div className="voice-home__review">
          <label className="sr-only" htmlFor={promptId}>
            Driving Request
          </label>
          <textarea
            id={promptId}
            aria-label="Driving Request"
            className="voice-home__prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
        </div>
      ) : null}

      {mode === "initial" ? (
        <button
          type="button"
          className="voice-home__mic-button"
          aria-label="Start Voice Request"
          onClick={startListening}
        >
          <Mic aria-hidden="true" />
        </button>
      ) : (
        <div
          className={`voice-home__actions${isReturning ? " voice-home__actions--returning" : ""}`}
        >
          <button
            type="button"
            className="voice-home__action voice-home__action--secondary voice-home__action--left"
            aria-label="Back to Previous Trips"
            title="Back"
            disabled={isReturning}
            onClick={backToPreviousTrips}
          >
            <Play aria-hidden="true" className="voice-home__back-icon" />
          </button>

          <button
            type="button"
            className="voice-home__action voice-home__action--secondary voice-home__action--middle"
            aria-label={middleActionLabel}
            title={middleActionLabel}
            disabled={isReturning}
            onClick={isListening ? reviewPrompt : rerecord}
          >
            {isListening ? (
              <Square aria-hidden="true" />
            ) : (
              <RefreshCw aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            className="voice-home__action voice-home__action--primary voice-home__action--right"
            aria-label={primaryActionLabel}
            title="Drive"
            disabled={isReturning}
            onClick={drive}
          >
            <Play aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
