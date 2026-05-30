import { useState } from 'react';

import type { SettingsController, SettingsState } from './types';

const defaultSettings: SettingsState = {
  dichopticEnabled: false,
  monocularWeakEye: 'off',
  hapticsEnabled: true,
  soundEnabled: false,
  reduceMotion: false,
};

// TODO(phase4): persist to store
export function useSettingsState(): SettingsController {
  const [state, setState] = useState(defaultSettings);

  const set = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setState((current) => ({ ...current, [key]: value }));
  };

  return { state, set };
}
