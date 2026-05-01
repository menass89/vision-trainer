import type { CalibrationProfile } from '../types';

const CM_PER_INCH = 2.54;

export const DEFAULT_CALIBRATION: CalibrationProfile = {
  id: 'default-calibration',
  createdAt: new Date(0).toISOString(),
  devicePixelRatio: 1,
  screenWidthPx: 1440,
  screenHeightPx: 900,
  dpi: 96,
  viewingDistanceCm: 60,
  gamma: 2.2,
  refreshRateHz: 60,
  backgroundLuminanceCdM2: 40
};

export function createBrowserCalibration(overrides: Partial<CalibrationProfile> = {}): CalibrationProfile {
  const screenWidthPx = typeof window !== 'undefined' ? window.screen.width : DEFAULT_CALIBRATION.screenWidthPx;
  const screenHeightPx = typeof window !== 'undefined' ? window.screen.height : DEFAULT_CALIBRATION.screenHeightPx;
  const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  return {
    ...DEFAULT_CALIBRATION,
    id: `cal-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    screenWidthPx,
    screenHeightPx,
    devicePixelRatio,
    ...overrides
  };
}

export function pixelsPerDegree(profile: CalibrationProfile): number {
  const pxPerCm = profile.dpi / CM_PER_INCH;
  const cmPerDegree = 2 * profile.viewingDistanceCm * Math.tan((Math.PI / 180) / 2);
  return cmPerDegree * pxPerCm * profile.devicePixelRatio;
}

export function pixelsPerCycle(spatialFrequencyCpd: number, profile: CalibrationProfile): number {
  return pixelsPerDegree(profile) / spatialFrequencyCpd;
}

export function sigmaPixels(
  _spatialFrequencyCpd: number,
  profile: CalibrationProfile,
  gaborSizeDeg = 4
): number {
  return (gaborSizeDeg / 2) * pixelsPerDegree(profile);
}

export async function estimateRefreshRate(sampleFrames = 90): Promise<number> {
  if (typeof window === 'undefined' || !('requestAnimationFrame' in window)) {
    return 60;
  }

  const deltas: number[] = [];
  let previous = performance.now();

  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      deltas.push(now - previous);
      previous = now;
      if (deltas.length >= sampleFrames) {
        resolve();
      } else {
        window.requestAnimationFrame(tick);
      }
    };
    window.requestAnimationFrame(tick);
  });

  const stable = deltas.slice(10).sort((a, b) => a - b);
  const median = stable[Math.floor(stable.length / 2)] || 16.667;
  return Math.round(1000 / median);
}

export function luminanceToLinearGray(luminanceCdM2: number, profile: CalibrationProfile): number {
  const normalized = Math.max(0, Math.min(1, luminanceCdM2 / 80));
  return Math.pow(normalized, 1 / profile.gamma);
}

export function conditionKey(spatialFrequencyCpd: number, orientationDeg: number, paradigm: string): string {
  return `${paradigm}:${spatialFrequencyCpd.toFixed(1)}cpd:${orientationDeg}deg`;
}
