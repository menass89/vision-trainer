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

/** Deep copy so callers never hold a reference into the backing store. */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Upsert by `id`, mirroring the native backend's `INSERT OR REPLACE`. */
function upsertById<T extends { id: string }>(list: T[], item: T): void {
  const index = list.findIndex((existing) => existing.id === item.id);
  if (index >= 0) {
    list[index] = item;
  } else {
    list.push(item);
  }
}

function sortByTimestamp<T>(list: T[], getTimestamp: (item: T) => string): T[] {
  return [...list].sort((a, b) => getTimestamp(a).localeCompare(getTimestamp(b)));
}

export const memoryPersistence: Persistence = {
  async init() {
    // No durable store to migrate.
  },

  async loadSessions() {
    return sortByTimestamp(store.sessions, (session) => session.startedAt).map(clone);
  },

  async loadThresholds() {
    return sortByTimestamp(store.thresholds, (threshold) => threshold.createdAt).map(clone);
  },

  async loadSettings() {
    return store.settings ? clone(store.settings) : null;
  },

  async saveSettings(settings) {
    store.settings = clone(settings);
  },

  async saveSessionResult(session, thresholds) {
    upsertById(store.sessions, clone(session));
    for (const threshold of thresholds) {
      upsertById(store.thresholds, clone(threshold));
    }
  },
};

export const activePersistence: Persistence = memoryPersistence;
