const spectrumBarCount = 28;
const spectrumUsableBins = 256;
const spectrumGain = 1.7;
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

/**
 * Group frequency bins into bar levels on a log scale, so low (voice) bands get
 * fine resolution and high bands are coarse. Each level is a 0..1 magnitude.
 */
export function getSpectrumLevels(frequencyData: Uint8Array): number[] {
  if (frequencyData.length === 0) {
    return getStillSpectrumLevels();
  }

  const binCount = Math.min(spectrumUsableBins, frequencyData.length);

  return Array.from({ length: spectrumBarCount }, (_, barIndex) => {
    const startBin = Math.floor(binCount ** (barIndex / spectrumBarCount));
    const endBin = Math.max(
      startBin + 1,
      Math.floor(binCount ** ((barIndex + 1) / spectrumBarCount)),
    );

    let total = 0;

    for (let bin = startBin; bin < endBin; bin += 1) {
      total += frequencyData[bin];
    }

    const average = total / (endBin - startBin) / 255;

    return Math.max(0, Math.min(1, average * spectrumGain));
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
