const spectrumBarCount = 20;
const spectrumBandCount = Math.ceil(spectrumBarCount / 2);
const spectrumUsableBins = 256;
const spectrumGain = 0.8625;
const spectrumCurve = 0.6;
const spectrumTilt = 1;
const spectrumActivityLevel = 0.08;
const spectrumAttack = 0.6;
const spectrumRelease = 0.2;

export const spectrumAnalyserConfig = {
  fftSize: 1024,
  smoothingTimeConstant: 0.7,
} as const;

export const stillSpectrumLevel = 0;

export function getStillSpectrumLevels(): number[] {
  return Array.from({ length: spectrumBarCount }, () => stillSpectrumLevel);
}

function getBandLevels(frequencyData: Uint8Array): number[] {
  const binCount = Math.min(spectrumUsableBins, frequencyData.length);

  return Array.from({ length: spectrumBandCount }, (_, band) => {
    const startBin = Math.floor(binCount ** (band / spectrumBandCount));
    const endBin = Math.max(
      startBin + 1,
      Math.floor(binCount ** ((band + 1) / spectrumBandCount)),
    );

    let total = 0;

    for (let bin = startBin; bin < endBin; bin += 1) {
      total += frequencyData[bin];
    }

    const magnitude = total / (endBin - startBin) / 255;
    // Boost higher bands, which are naturally quieter for voice, so the outer
    // bars still show life instead of sitting flat.
    const tilt =
      spectrumBandCount > 1
        ? 1 + spectrumTilt * (band / (spectrumBandCount - 1))
        : 1;
    const level = magnitude ** spectrumCurve * spectrumGain * tilt;

    return Math.max(0, Math.min(1, level));
  });
}

/**
 * Turn a frequency frame into mirrored, center-peaked bar levels: the loudest
 * (low) bands sit at the center and higher bands fan out symmetrically to both
 * edges. A soft curve plus a high-frequency tilt keep bars from saturating.
 */
export function getSpectrumLevels(frequencyData: Uint8Array): number[] {
  if (frequencyData.length === 0) {
    return getStillSpectrumLevels();
  }

  const bands = getBandLevels(frequencyData);
  const center = (spectrumBarCount - 1) / 2;

  return Array.from({ length: spectrumBarCount }, (_, barIndex) => {
    const band = Math.min(
      spectrumBandCount - 1,
      Math.floor(Math.abs(barIndex - center)),
    );

    return bands[band];
  });
}

/**
 * Ease each bar toward its target with a fast attack and slower release, so the
 * spectrum jumps up on sound and falls back smoothly.
 */
export function smoothSpectrumLevels(
  previousLevels: number[],
  targetLevels: number[],
): number[] {
  return targetLevels.map((targetLevel, index) => {
    const previousLevel = previousLevels[index] ?? stillSpectrumLevel;
    const response =
      targetLevel > previousLevel ? spectrumAttack : spectrumRelease;

    return previousLevel + (targetLevel - previousLevel) * response;
  });
}

export function isSpectrumActive(levels: number[]): boolean {
  return Math.max(...levels) > spectrumActivityLevel;
}
