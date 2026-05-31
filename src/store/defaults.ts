import type { SettingsState } from '@/presenters/types';

export const DEFAULT_SETTINGS: SettingsState = {
  dichopticEnabled: false,
  monocularWeakEye: 'off',
  hapticsEnabled: true,
  soundEnabled: false,
  reduceMotion: false,
  remindersEnabled: false,
};
