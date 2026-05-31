import { describe, expect, it } from 'vitest';

import { contrastFromLog10 } from '@/psychophysics/quest';
import type { PlannedBlock } from '@/types';

import { buildBlockThreshold, buildGuidedSessionLog } from './sessionResult';

describe('sessionResult', () => {
  it('builds a threshold estimate from a QUEST block result', () => {
    const createdAtIso = '2026-05-31T10:00:00.000Z';
    const threshold = buildBlockThreshold({
      sessionId: 'session-1',
      blockId: 'block-1',
      spatialFrequencyCpd: 4,
      orientationDeg: 0,
      estimate: {
        thresholdLog10: -1.3,
        sdLog10: 0.1,
        ciLowLog10: -1.5,
        ciHighLog10: -1.1,
      },
      trialCount: 10,
      lapseRate: 0.1,
      createdAtIso,
    });

    expect(threshold.thresholdContrast).toBeCloseTo(contrastFromLog10(-1.3));
    expect(threshold.thresholdLog10).toBe(-1.3);
    expect(threshold.ciLow).toBeLessThan(threshold.thresholdContrast);
    expect(threshold.thresholdContrast).toBeLessThan(threshold.ciHigh);
    expect(threshold.paradigm).toBe('contrast-detection');
    expect(threshold.conditionKey).toContain('4.0cpd:0deg');
    expect(threshold.conditionKey).toContain('150ms');
    expect(threshold.createdAt).toBe(createdAtIso);
    expect(threshold.id).toMatch(/^threshold-/);
  });

  it('builds a completed guided session log', () => {
    const plannedBlocks: PlannedBlock[] = [];
    const session = buildGuidedSessionLog({
      id: 'session-1',
      startedAtIso: '2026-05-31T10:00:00.000Z',
      completedAtIso: '2026-05-31T10:05:00.000Z',
      calibrationId: 'calibration-1',
      plannedBlocks,
      completedTrials: 20,
    });

    expect(session.status).toBe('completed');
    expect(session.sessionType).toBe('guided');
    expect(session.eyeMode).toBe('both');
    expect(session.startedAt).toBe('2026-05-31T10:00:00.000Z');
    expect(session.completedAt).toBe('2026-05-31T10:05:00.000Z');
    expect(session.protocolVersion).toBe('mvp-0.2');
    expect(session.plannedBlocks).toBe(plannedBlocks);
    expect(session.completedTrials).toBe(20);
    expect(session.metadata.targetSessionMinutes).toBe(30);
  });
});
