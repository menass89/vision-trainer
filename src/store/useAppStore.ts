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

// Shared across re-entrant calls so React Strict Mode's dev double-mount runs
// init/load exactly once instead of racing two concurrent hydrations.
let hydration: Promise<void> | null = null;

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  settings: DEFAULT_SETTINGS,
  sessions: [],
  thresholds: [],

  hydrate: () => {
    if (get().hydrated) return Promise.resolve();
    if (hydration) return hydration;
    hydration = (async () => {
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
    })();
    return hydration;
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
