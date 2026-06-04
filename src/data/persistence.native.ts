import type { SessionLog, ThresholdEstimate } from '@/types';
import type { SettingsState } from '@/presenters/types';

import { getDatabase, migrate } from './db';
import {
  payloadToSettings,
  rowToSession,
  rowToThreshold,
  sessionToRow,
  settingsToPayload,
  thresholdToRow,
  type SessionRow,
  type ThresholdRow,
} from './mappers';
import type { Persistence } from './persistence';

export const sqlitePersistence: Persistence = {
  async init() {
    await migrate();
  },

  async loadSessions() {
    const db = await getDatabase();
    const rows = await db.getAllAsync<SessionRow>(
      'SELECT id, started_at, completed_at, status, payload FROM sessions ORDER BY started_at ASC'
    );
    return rows.map(rowToSession).filter((session): session is SessionLog => session !== null);
  },

  async loadThresholds() {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ThresholdRow>(
      'SELECT id, session_id, condition_key, spatial_frequency, created_at, payload FROM thresholds ORDER BY created_at ASC'
    );
    return rows.map(rowToThreshold).filter((threshold): threshold is ThresholdEstimate => threshold !== null);
  },

  async loadSettings() {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ payload: string }>(
      'SELECT payload FROM settings WHERE id = 1'
    );
    return row ? payloadToSettings(row.payload) : null;
  },

  async saveSettings(settings) {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT OR REPLACE INTO settings (id, payload) VALUES (1, ?)',
      settingsToPayload(settings)
    );
  },

  async saveSessionResult(session, thresholds) {
    const db = await getDatabase();
    const sessionRow = sessionToRow(session);
    const thresholdRows = thresholds.map(thresholdToRow);
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(
        'INSERT OR REPLACE INTO sessions (id, started_at, completed_at, status, payload) VALUES (?, ?, ?, ?, ?)',
        sessionRow.id,
        sessionRow.started_at,
        sessionRow.completed_at,
        sessionRow.status,
        sessionRow.payload
      );
      for (const row of thresholdRows) {
        await txn.runAsync(
          'INSERT OR REPLACE INTO thresholds (id, session_id, condition_key, spatial_frequency, created_at, payload) VALUES (?, ?, ?, ?, ?, ?)',
          row.id,
          row.session_id,
          row.condition_key,
          row.spatial_frequency,
          row.created_at,
          row.payload
        );
      }
    });
  },
};

/** Native platforms (iOS/Android) use the real on-device sqlite store. */
export const activePersistence: Persistence = sqlitePersistence;
