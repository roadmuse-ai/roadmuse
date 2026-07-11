import { describe, expect, it } from "vitest";
import {
  getSpectrumLevels,
  getStillSpectrumLevels,
  isSpectrumActive,
  smoothSpectrumLevels,
  spectrumAnalyserConfig,
} from "./recordingSpectrum";

const binCount = spectrumAnalyserConfig.fftSize / 2;

function createFrequencyFrame(magnitude: number): Uint8Array {
  return Uint8Array.from({ length: binCount }, () => magnitude);
}

describe("recordingSpectrum", () => {
  it("reads no levels from a silent frame", () => {
    const levels = getSpectrumLevels(createFrequencyFrame(0));

    expect(levels).toEqual(getStillSpectrumLevels());
    expect(isSpectrumActive(levels)).toBe(false);
  });

  it("reads higher levels for louder frequency energy", () => {
    const quietLevels = getSpectrumLevels(createFrequencyFrame(20));
    const loudLevels = getSpectrumLevels(createFrequencyFrame(200));

    expect(Math.max(...loudLevels)).toBeGreaterThan(Math.max(...quietLevels));
    expect(isSpectrumActive(loudLevels)).toBe(true);
  });

  it("emphasizes the bands that carry energy", () => {
    const frame = new Uint8Array(binCount);
    frame.fill(220, 1, 8);
    const levels = getSpectrumLevels(frame);

    expect(Math.max(...levels.slice(0, 6))).toBeGreaterThan(
      Math.max(...levels.slice(-6)),
    );
  });

  it("rises faster than it falls", () => {
    const still = getStillSpectrumLevels();
    const target = still.map(() => 1);
    const rise = smoothSpectrumLevels(still, target)[0];
    const fall = 1 - smoothSpectrumLevels(target, still)[0];

    expect(rise).toBeGreaterThan(0);
    expect(fall).toBeGreaterThan(0);
    expect(rise).toBeGreaterThan(fall);
  });
});
