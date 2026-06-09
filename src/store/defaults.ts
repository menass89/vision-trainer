import type { SettingsState } from '@/presenters/types';

export const DEFAULT_SETTINGS: SettingsState = {
  dichopticEnabled: false,
  displayBrightness: 0.85,
  monocularWeakEye: 'off',
  hapticsEnabled: true,
  soundEnabled: false,
  reduceMotion: false,
  remindersEnabled: false,
  onboardingComplete: false,
  subscriptionStatus: 'free',
  trialStartedAt: null,
  visionGoal: 'unspecified',
};
