import { useAppStore } from '@/store/useAppStore';

import type { SettingsController } from './types';

export function useSettingsState(): SettingsController {
  const state = useAppStore((store) => store.settings);
  const set = useAppStore((store) => store.updateSetting);
  return { state, set };
}
