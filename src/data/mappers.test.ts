import { describe, expect, it, vi } from 'vitest';

import type { SettingsState } from '@/presenters/types';
import type { SessionLog, ThresholdEstimate } from '@/types';
import { DEFAULT_SETTINGS } from '../store/defaults';

vi.mock('@/store/defaults', () => ({
  DEFAULT_SETTINGS: {
    dichopticEnabled: false,
    displayBrightness: 0.85,
    monocularWeakEye: 'off',
    hapticsEnabled: true,
    soundEnabled: false,
    reduceMotion: false,
    remindersEnabled: false,
    onboardingComplete: false,
  },
}));

import {
  payloadToSettings,
  rowToSession,
  rowToThreshold,
  sessionToRow,
  settingsToPayload,
  thresholdToRow,
} from './mappers';

describe('data mappers', () => {
  it('round-trips a full session and populates the completed-at index', () => {
    const session: SessionLog = {
      id: 'session-1',
      startedAt: '2026-05-31T08:00:00.000Z',
      completedAt: '2026-05-31T08:12:00.000Z',
      status: 'completed',
      eyeMode: 'both',
      sessionType: 'guided',
      calibrationId: 'calibration-1',
      protocolVersion: '1.0.0',
      plannedBlocks: [
        {
          id: 'block-1',
          label: 'Contrast detection',
          paradigm: 'contrast-detection',
          condition: {
            paradigm: 'contrast-detection',
            spatialFrequencyCpd: 6,
            orientationDeg: 90,
            trialsPerBlock: 20,
            durationMs: 200,
            gaborSizeDeg: 2,
          },
          role: 'assessment',
        },
      ],
      completedTrials: 20,
      metadata: { source: 'test', dichoptic: false, score: 0.92 },
    };

    const row = sessionToRow(session);

    expect(row.completed_at).toBe('2026-05-31T08:12:00.000Z');
    expect(rowToSession(row)).toEqual(session);
  });

  it('returns null for corrupt session rows', () => {
    expect(rowToSession({
      completed_at: null,
      id: 'session-corrupt',
      payload: '{bad json',
      started_at: '2026-05-31T08:00:00.000Z',
      status: 'completed',
    })).toBeNull();
    expect(rowToSession({
      completed_at: null,
      id: 'session-invalid',
      payload: JSON.stringify({ id: 'session-invalid' }),
      started_at: '2026-05-31T08:00:00.000Z',
      status: 'completed',
    })).toBeNull();
  });

  it('round-trips a full threshold and populates its indexed columns', () => {
    const threshold: ThresholdEstimate = {
      id: 'threshold-1',
      sessionId: 'session-1',
      blockId: 'block-1',
      conditionKey: 'contrast-detection:6:90',
      paradigm: 'contrast-detection',
      spatialFrequencyCpd: 6,
      orientationDeg: 90,
      thresholdContrast: 0.08,
      thresholdLog10: -1.09691,
      ciLow: 0.06,
      ciHigh: 0.1,
      trialCount: 20,
      lapseRate: 0.02,
      createdAt: '2026-05-31T08:12:00.000Z',
    };

    const row = thresholdToRow(threshold);

    expect(row.spatial_frequency).toBe(6);
    expect(row.condition_key).toBe('contrast-detection:6:90');
    expect(rowToThreshold(row)).toEqual(threshold);
  });

  it('returns null for corrupt threshold rows', () => {
    expect(rowToThreshold({
      condition_key: 'contrast-detection:6:90',
      created_at: '2026-05-31T08:12:00.000Z',
      id: 'threshold-corrupt',
      payload: '{bad json',
      session_id: 'session-1',
      spatial_frequency: 6,
    })).toBeNull();
    expect(rowToThreshold({
      condition_key: 'contrast-detection:6:90',
      created_at: '2026-05-31T08:12:00.000Z',
      id: 'threshold-invalid',
      payload: JSON.stringify({ id: 'threshold-invalid' }),
      session_id: 'session-1',
      spatial_frequency: 6,
    })).toBeNull();
  });

  it('returns defaults for malformed settings JSON', () => {
    expect(payloadToSettings('{bad json')).toEqual(DEFAULT_SETTINGS);
  });

  it('merges partial settings over defaults', () => {
    expect(payloadToSettings('{"soundEnabled":true}')).toEqual({
      ...DEFAULT_SETTINGS,
      soundEnabled: true,
    });
  });

  it('sanitizes settings fields before merging over defaults', () => {
    expect(payloadToSettings(JSON.stringify({
      dichopticEnabled: 1,
      displayBrightness: 2,
      hapticsEnabled: 0,
      monocularWeakEye: 'center',
      onboardingComplete: 'yes',
      reduceMotion: '',
      remindersEnabled: null,
      soundEnabled: 'enabled',
      unknown: true,
    }))).toEqual({
      ...DEFAULT_SETTINGS,
      dichopticEnabled: true,
      displayBrightness: 1,
      hapticsEnabled: false,
      onboardingComplete: true,
      remindersEnabled: false,
      soundEnabled: true,
    });
    expect(payloadToSettings('{"displayBrightness":-1,"monocularWeakEye":"right"}')).toEqual({
      ...DEFAULT_SETTINGS,
      displayBrightness: 0,
      monocularWeakEye: 'right',
    });
    expect(payloadToSettings('{"displayBrightness":"bright"}')).toEqual(DEFAULT_SETTINGS);
  });

  it('round-trips full settings', () => {
    const settings: SettingsState = {
      dichopticEnabled: true,
      displayBrightness: 0.72,
      monocularWeakEye: 'left',
      hapticsEnabled: false,
      soundEnabled: true,
      reduceMotion: true,
      remindersEnabled: true,
      onboardingComplete: true,
    };

    expect(payloadToSettings(settingsToPayload(settings))).toEqual(settings);
  });
});
