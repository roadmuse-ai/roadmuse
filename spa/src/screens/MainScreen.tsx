import { useEffect, useId, useRef, useState } from "react";
import { Mic, Play, RefreshCw, Square, Trash2 } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { buildStubNavigatorDeepLink, stubVoiceRoute } from "../data/navigationLinks";

const stubPrompt =
  "Find a kid-friendly lunch stop near the National Mall with easy parking, and avoid the Beltway unless it saves more than 15 minutes.";

type VoiceHomeMode = "initial" | "listening" | "review" | "returning";

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
        trip.prompt.toLocaleLowerCase().includes(normalizedTripSearch),
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
    if (isListening) {
      reviewPrompt();
      return;
    }

    const drivePrompt = prompt.trim() || stubPrompt;
    const deepLink = buildStubNavigatorDeepLink(settings.preferredNavigator, {
      ...stubVoiceRoute,
      destinationLabel: drivePrompt,
    });

    addPreviousTrip(drivePrompt);

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

  const playPreviousTrip = (tripPrompt: string) => {
    window.open(
      buildStubNavigatorDeepLink(settings.preferredNavigator, {
        ...stubVoiceRoute,
        destinationLabel: tripPrompt,
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
                  <p className="previous-trip__prompt">{trip.prompt}</p>
                  <div className="previous-trip__actions">
                    <button
                      type="button"
                      className="saved-place__icon-btn"
                      aria-label={`Play ${trip.prompt}`}
                      title="Play"
                      onClick={() => playPreviousTrip(trip.prompt)}
                    >
                      <Play aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="saved-place__icon-btn"
                      aria-label={`Remove ${trip.prompt}`}
                      title="Remove"
                      onClick={() => removePreviousTrip(trip.id)}
                    >
                      <Trash2 aria-hidden="true" />
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
