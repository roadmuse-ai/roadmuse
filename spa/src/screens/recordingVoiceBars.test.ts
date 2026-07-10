import { describe, expect, it } from "vitest";
import {
  dampVoiceBarLevels,
  getStillVoiceBarLevels,
  getVoiceBarState,
  voiceBarAnalyserConfig,
} from "./recordingVoiceBars";

function createAudioFrame(amplitude: number): Uint8Array {
  return Uint8Array.from({ length: voiceBarAnalyserConfig.fftSize }, (_, index) =>
    Math.round(128 + Math.sin(index / 9) * amplitude),
  );
}

describe("recordingVoiceBars", () => {
  it("keeps the bars flat for silent microphone input", () => {
    const state = getVoiceBarState(
      createAudioFrame(0),
      [],
      window.performance.now(),
    );

    expect(state.isVoiceActive).toBe(false);
    expect(state.history).toEqual([]);
    expect(state.levels).toEqual(getStillVoiceBarLevels());
  });

  it("uses microphone volume to create larger active levels", () => {
    const quietState = getVoiceBarState(createAudioFrame(2), [], 1000);
    const loudState = getVoiceBarState(createAudioFrame(18), [], 1000);
    const maxQuietLevel = Math.max(...quietState.levels);
    const maxLoudLevel = Math.max(...loudState.levels);

    expect(quietState.isVoiceActive).toBe(true);
    expect(loudState.isVoiceActive).toBe(true);
    expect(maxLoudLevel).toBeGreaterThan(maxQuietLevel + 0.25);
  });

  it("lets recorded voice levels trail through the two-second history", () => {
    const activeState = getVoiceBarState(createAudioFrame(12), [], 1000);
    const trailingState = getVoiceBarState(
      createAudioFrame(0),
      activeState.history,
      2850,
    );

    expect(trailingState.isVoiceActive).toBe(false);
    expect(trailingState.history).toHaveLength(1);
    expect(trailingState.levels.slice(0, 6).some((level) => level > 0.18)).toBe(
      true,
    );
  });

  it("damps rendered bars without freezing meaningful movement", () => {
    const previousLevels = getStillVoiceBarLevels();
    const targetLevels = previousLevels.map((level, index) =>
      index === previousLevels.length - 1 ? 0.8 : level,
    );
    const dampedLevels = dampVoiceBarLevels(previousLevels, targetLevels);

    expect(dampedLevels.at(-1)).toBeGreaterThan(previousLevels.at(-1) ?? 0);
    expect(dampedLevels.slice(0, -1)).toEqual(previousLevels.slice(0, -1));
  });
});
