import type { EyeMode, Orientation, ParadigmId } from '../types';

export function detailLevelLabel(spatialFrequencyCpd: number): string {
  if (spatialFrequencyCpd <= 1.5) {
    return 'Coarse';
  }
  if (spatialFrequencyCpd <= 3) {
    return 'Medium';
  }
  if (spatialFrequencyCpd <= 6) {
    return 'Fine';
  }
  return 'Ultra-fine';
}

export function orientationLabel(orientationDeg: Orientation): string {
  const labels: Record<Orientation, string> = {
    0: 'Horizontal',
    45: 'Diagonal ↗',
    90: 'Vertical',
    135: 'Diagonal ↘'
  };
  return labels[orientationDeg];
}

export function conditionLabel(spatialFrequencyCpd: number, orientationDeg: Orientation): string {
  return `${detailLevelLabel(spatialFrequencyCpd)} detail · ${orientationLabel(orientationDeg)}`;
}

export function eyeModeLabel(eyeMode: EyeMode): string {
  const labels: Record<EyeMode, string> = {
    both: 'Both eyes',
    left: 'Left eye only',
    right: 'Right eye only'
  };
  return labels[eyeMode];
}

export function oppositeEyeLabel(eyeMode: EyeMode): string {
  if (eyeMode === 'left') {
    return 'right';
  }
  if (eyeMode === 'right') {
    return 'left';
  }
  return 'other';
}

export function paradigmLabel(paradigm: ParadigmId): string {
  const labels: Record<ParadigmId, string> = {
    'contrast-detection': 'Pattern detection',
    'lateral-masking': 'Side pattern training',
    'spatial-masking': 'Clutter training',
    'backward-masking': 'Brief pattern training',
    'pedestal-discrimination': 'Contrast comparison'
  };
  return labels[paradigm];
}
