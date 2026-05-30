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

export function pixelsPerDegree(profile: CalibrationProfile): number {
  const pxPerCm = profile.dpi / CM_PER_INCH;
  const cmPerDegree = 2 * profile.viewingDistanceCm * Math.tan((Math.PI / 180) / 2);
  return cmPerDegree * pxPerCm * profile.devicePixelRatio;
}

export function pixelsPerCycle(spatialFrequencyCpd: number, profile: CalibrationProfile): number {
  return pixelsPerDegree(profile) / spatialFrequencyCpd;
}

export function sigmaPixels(
  profile: CalibrationProfile,
  gaborSizeDeg = 4
): number {
  const sizeDeg = Number.isFinite(gaborSizeDeg) && gaborSizeDeg > 0 ? gaborSizeDeg : 4;
  return (sizeDeg / 2) * pixelsPerDegree(profile);
}

export function luminanceToLinearGray(luminanceCdM2: number, profile: CalibrationProfile): number {
  const normalized = Math.max(0, Math.min(1, luminanceCdM2 / 80));
  return Math.pow(normalized, 1 / profile.gamma);
}

export function conditionKey(
  spatialFrequencyCpd: number,
  orientationDeg: number,
  paradigm: string,
  durationMs?: number,
  gaborSizeDeg?: number
): string {
  const baseKey = `${paradigm}:${spatialFrequencyCpd.toFixed(1)}cpd:${orientationDeg}deg`;
  const withDuration = Number.isFinite(durationMs) ? `${baseKey}:${durationMs}ms` : baseKey;
  const sizeDeg = Number.isFinite(gaborSizeDeg) && (gaborSizeDeg as number) > 0 ? gaborSizeDeg : undefined;
  return sizeDeg === undefined ? withDuration : `${withDuration}:${sizeDeg}deg`;
}
