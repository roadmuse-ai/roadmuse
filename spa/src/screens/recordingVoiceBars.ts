const voiceActivityThreshold = 0.008;
const voiceBarCount = 32;
const voiceBarHistorySampleMs = 50;
const voiceBarHistoryWindowMs = 2_000;
const voiceBarInputResponse = 0.72;
const voiceBarRenderDeadband = 0.003;
const voiceBarRenderResponse = 0.62;
const stillVoiceBarLevel = 0.16;
const voiceBarSensitivity = 42;

export const voiceBarAnalyserConfig = {
  fftSize: 512,
  smoothingTimeConstant: 0.35,
} as const;

export type VoiceLevelHistoryPoint = {
  level: number;
  time: number;
};

type VoiceBarState = {
  history: VoiceLevelHistoryPoint[];
  isVoiceActive: boolean;
  levels: number[];
};

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

export function getStillVoiceBarLevels(): number[] {
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

export function dampVoiceBarLevels(
  previousLevels: number[],
  targetLevels: number[],
): number[] {
  return targetLevels.map((targetLevel, index) => {
    const previousLevel = previousLevels[index] ?? stillVoiceBarLevel;

    if (Math.abs(targetLevel - previousLevel) < voiceBarRenderDeadband) {
      return previousLevel;
    }

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

export function getVoiceBarState(
  timeDomainData: Uint8Array,
  history: VoiceLevelHistoryPoint[],
  currentTime: number,
): VoiceBarState {
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

  const recentHistory = history.filter(
    (point) => currentTime - point.time <= voiceBarHistoryWindowMs,
  );
  const previousHistoryPoint = recentHistory[recentHistory.length - 1];
  const rawCurrentLevel = clampVoiceBarLevel(
    stillVoiceBarLevel +
      Math.max(0, audioVolume - voiceActivityThreshold) * voiceBarSensitivity,
  );
  const currentLevel =
    previousHistoryPoint === undefined
      ? rawCurrentLevel
      : clampVoiceBarLevel(
          previousHistoryPoint.level * (1 - voiceBarInputResponse) +
            rawCurrentLevel * voiceBarInputResponse,
        );
  const shouldAddHistoryPoint =
    previousHistoryPoint === undefined ||
    currentTime - previousHistoryPoint.time >= voiceBarHistorySampleMs;
  const nextHistory = shouldAddHistoryPoint
    ? [...recentHistory, { level: currentLevel, time: currentTime }]
    : recentHistory;

  return {
    history: nextHistory,
    isVoiceActive: true,
    levels: smoothVoiceBarLevels(getVoiceHistoryLevels(nextHistory, currentTime)),
  };
}
