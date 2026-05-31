import type { SessionLog, ThresholdEstimate } from '@/types';
import type { SettingsState } from '@/presenters/types';
import { DEFAULT_SETTINGS } from '@/store/defaults';

export type SessionRow = {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  payload: string;
};

export type ThresholdRow = {
  id: string;
  session_id: string;
  condition_key: string;
  spatial_frequency: number;
  created_at: string;
  payload: string;
};

export function sessionToRow(session: SessionLog): SessionRow {
  return {
    id: session.id,
    started_at: session.startedAt,
    completed_at: session.completedAt ?? null,
    status: session.status,
    payload: JSON.stringify(session),
  };
}

export function rowToSession(row: SessionRow): SessionLog {
  return JSON.parse(row.payload) as SessionLog;
}

export function thresholdToRow(threshold: ThresholdEstimate): ThresholdRow {
  return {
    id: threshold.id,
    session_id: threshold.sessionId,
    condition_key: threshold.conditionKey,
    spatial_frequency: threshold.spatialFrequencyCpd,
    created_at: threshold.createdAt,
    payload: JSON.stringify(threshold),
  };
}

export function rowToThreshold(row: ThresholdRow): ThresholdEstimate {
  return JSON.parse(row.payload) as ThresholdEstimate;
}

export function settingsToPayload(settings: SettingsState): string {
  return JSON.stringify(settings);
}

export function payloadToSettings(payload: string): SettingsState {
  try {
    const parsed = JSON.parse(payload) as unknown;
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(parsed as Partial<SettingsState>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
