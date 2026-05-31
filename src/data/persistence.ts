import type { SessionLog, ThresholdEstimate } from '@/types';
import type { SettingsState } from '@/presenters/types';

export type Persistence = {
  init(): Promise<void>;
  loadSessions(): Promise<SessionLog[]>;
  loadThresholds(): Promise<ThresholdEstimate[]>;
  loadSettings(): Promise<SettingsState | null>;
  saveSettings(settings: SettingsState): Promise<void>;
  saveSessionResult(session: SessionLog, thresholds: ThresholdEstimate[]): Promise<void>;
};

/**
 * In-memory persistence used on web and in tests. The device build resolves
 * `persistence.native.ts` instead (real on-device sqlite), so `expo-sqlite` —
 * whose web entry statically imports a `.wasm` Metro cannot bundle — never
 * enters the web bundle. State here lives only for the lifetime of the JS
 * context; web is a development/preview surface, not the shipping target.
 */
const store: {
  sessions: SessionLog[];
  thresholds: ThresholdEstimate[];
  settings: SettingsState | null;
} = {
  sessions: [],
  thresholds: [],
  settings: null,
};

export const memoryPersistence: Persistence = {
  async init() {
    // No durable store to migrate.
  },

  async loadSessions() {
    return [...store.sessions];
  },

  async loadThresholds() {
    return [...store.thresholds];
  },

  async loadSettings() {
    return store.settings;
  },

  async saveSettings(settings) {
    store.settings = settings;
  },

  async saveSessionResult(session, thresholds) {
    store.sessions.push(session);
    store.thresholds.push(...thresholds);
  },
};

export const activePersistence: Persistence = memoryPersistence;
