import { describe, expect, it } from 'vitest';

import type { SettingsState } from '@/presenters/types';
import type { SessionLog, ThresholdEstimate } from '@/types';

import { memoryPersistence } from './persistence';

function session(id: string): SessionLog {
  return {
    id,
    startedAt: '2026-05-31T10:00:00.000Z',
    completedAt: '2026-05-31T10:04:00.000Z',
    status: 'completed',
    eyeMode: 'both',
    sessionType: 'guided',
    calibrationId: 'default-calibration',
    protocolVersion: 'mvp-0.2',
    plannedBlocks: [],
    completedTrials: 20,
    metadata: {},
  };
}

function threshold(id: string, sessionId: string): ThresholdEstimate {
  return {
    id,
    sessionId,
    blockId: `block-${id}`,
    conditionKey: 'contrast-detection:4.0cpd:0deg:150ms',
    paradigm: 'contrast-detection',
    spatialFrequencyCpd: 4,
    orientationDeg: 0,
    thresholdContrast: 0.05,
    thresholdLog10: Math.log10(0.05),
    ciLow: 0.04,
    ciHigh: 0.06,
    trialCount: 10,
    lapseRate: 0,
    createdAt: '2026-05-31T10:04:00.000Z',
  };
}

describe('memoryPersistence', () => {
  it('upserts sessions and thresholds by id (no duplicates on re-save)', async () => {
    const s = session('session-dup');
    await memoryPersistence.saveSessionResult(s, [threshold('threshold-dup', 'session-dup')]);
    await memoryPersistence.saveSessionResult(s, [threshold('threshold-dup', 'session-dup')]);

    const sessions = await memoryPersistence.loadSessions();
    const thresholds = await memoryPersistence.loadThresholds();
    expect(sessions.filter((row) => row.id === 'session-dup')).toHaveLength(1);
    expect(thresholds.filter((row) => row.id === 'threshold-dup')).toHaveLength(1);
  });

  it('clones on read so callers cannot mutate the backing store', async () => {
    await memoryPersistence.saveSessionResult(session('session-clone'), []);
    const first = await memoryPersistence.loadSessions();
    const target = first.find((row) => row.id === 'session-clone');
    expect(target).toBeDefined();
    target!.completedTrials = 999;

    const second = await memoryPersistence.loadSessions();
    expect(second.find((row) => row.id === 'session-clone')?.completedTrials).toBe(20);
  });

  it('clones settings on write and read', async () => {
    const settings: SettingsState = {
      dichopticEnabled: false,
      monocularWeakEye: 'off',
      hapticsEnabled: true,
      soundEnabled: false,
      reduceMotion: false,
      remindersEnabled: false,
    };
    await memoryPersistence.saveSettings(settings);
    settings.hapticsEnabled = false; // mutate caller's copy after save

    const loaded = await memoryPersistence.loadSettings();
    expect(loaded?.hapticsEnabled).toBe(true);
  });
});
