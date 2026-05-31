import { create } from 'zustand';

import type { SettingsState } from '@/presenters/types';
import type { SessionLog, ThresholdEstimate } from '@/types';
import { activePersistence as persistence } from '@/data/persistence';

import { DEFAULT_SETTINGS } from './defaults';

type AppState = {
  hydrated: boolean;
  settings: SettingsState;
  sessions: SessionLog[];
  thresholds: ThresholdEstimate[];
  hydrate: () => Promise<void>;
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  recordSessionResult: (session: SessionLog, thresholds: ThresholdEstimate[]) => Promise<void>;
};

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  settings: DEFAULT_SETTINGS,
  sessions: [],
  thresholds: [],

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      await persistence.init();
      const [sessions, thresholds, settings] = await Promise.all([
        persistence.loadSessions(),
        persistence.loadThresholds(),
        persistence.loadSettings(),
      ]);
      set({ sessions, thresholds, settings: settings ?? DEFAULT_SETTINGS, hydrated: true });
    } catch {
      // Degraded boot (e.g. sqlite unavailable on web): render with defaults/empty state.
      set({ hydrated: true });
    }
  },

  updateSetting: (key, value) => {
    const settings = { ...get().settings, [key]: value };
    set({ settings });
    void persistence.saveSettings(settings).catch(() => {});
  },

  recordSessionResult: async (session, thresholds) => {
    await persistence.saveSessionResult(session, thresholds);
    set((state) => ({
      sessions: [...state.sessions, session],
      thresholds: [...state.thresholds, ...thresholds],
    }));
  },
}));
