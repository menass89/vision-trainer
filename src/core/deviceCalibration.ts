import { Dimensions, PixelRatio } from 'react-native';

import { DEFAULT_CALIBRATION } from './displayCalibration';
import type { CalibrationProfile } from '../types';

export function buildDeviceCalibration(): CalibrationProfile {
  const dpr = PixelRatio.get();
  const { width, height } = Dimensions.get('window');

  if (
    !Number.isFinite(dpr) ||
    dpr <= 0 ||
    !Number.isFinite(width) ||
    width <= 0 ||
    !Number.isFinite(height) ||
    height <= 0
  ) {
    return DEFAULT_CALIBRATION;
  }

  const screenWidthPx = Math.round(width * dpr);
  const screenHeightPx = Math.round(height * dpr);

  return {
    ...DEFAULT_CALIBRATION,
    id: 'device-calibration',
    devicePixelRatio: dpr,
    screenWidthPx,
    screenHeightPx,
    dpi: 160,
    viewingDistanceCm: 33,
    createdAt: DEFAULT_CALIBRATION.createdAt,
  };
}
