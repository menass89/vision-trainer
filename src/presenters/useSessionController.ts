import { useCallback, useRef, useState } from 'react';

import { DEFAULT_CALIBRATION } from '@/core/displayCalibration';
import type { CalibrationProfile, GaborStimulus, Orientation, TrialInterval } from '@/types';

export type SessionStatus = 'ready' | 'running' | 'block-complete' | 'complete';

export type TrialPlan = {
  /** The two intervals; exactly one holds a stimulus, the other is null (blank). */
  intervals: [GaborStimulus | null, GaborStimulus | null];
  targetInterval: TrialInterval;
};

export type SessionController = {
  calibration: CalibrationProfile;
  status: SessionStatus;
  blockIndex: number;
  totalBlocks: number;
  blockLabel: string;
  trialIndex: number;
  trialsPerBlock: number;
  correctCount: number;
  lastCorrect: boolean | null;
  progress: number;
  currentTrial: () => TrialPlan;
  respond: (choice: TrialInterval) => { correct: boolean };
  begin: () => void;
  advanceBlock: () => void;
};

type SessionState = {
  status: SessionStatus;
  blockIndex: number;
  trialIndex: number;
  correctCount: number;
  completedTrials: number;
  lastCorrect: boolean | null;
};

const TOTAL_BLOCKS = 2;
const TRIALS_PER_BLOCK = 10;
const BLOCK_LABELS = ['Warm-up \u00b7 4 cpd', 'Training \u00b7 6 cpd'] as const;
const SPATIAL_FREQUENCIES = [4, 6] as const;
const ORIENTATIONS: Orientation[] = [0, 45, 90, 135];
const INITIAL_STATE: SessionState = {
  status: 'ready',
  blockIndex: 0,
  trialIndex: 0,
  correctCount: 0,
  completedTrials: 0,
  lastCorrect: null,
};

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const nextRandom = mulberry32(0x53455353);

function clampContrast(value: number) {
  return Math.min(Math.max(value, 0.04), 0.22);
}

// TODO(phase4): replace mock trial generation with real sessionPlanner + QUEST staircase.
function createMockTrial(blockIndex: number, contrast: number): TrialPlan {
  const targetInterval: TrialInterval = nextRandom() < 0.5 ? 1 : 2;
  const orientationDeg = ORIENTATIONS[Math.floor(nextRandom() * ORIENTATIONS.length)];
  const stimulus: GaborStimulus = {
    spatialFrequencyCpd: SPATIAL_FREQUENCIES[blockIndex],
    orientationDeg,
    contrast: clampContrast(contrast + (nextRandom() - 0.5) * 0.012),
    phaseRad: 0,
    durationMs: 150,
    backgroundLuminanceCdM2: DEFAULT_CALIBRATION.backgroundLuminanceCdM2,
  };

  return {
    intervals: targetInterval === 1 ? [stimulus, null] : [null, stimulus],
    targetInterval,
  };
}

// FUTURE(free-practice): Halide drag-as-dial lives in a separate practice mode, not the guided spine.
export function useSessionController(): SessionController {
  const [state, setState] = useState(INITIAL_STATE);
  const stateRef = useRef(state);
  const trialRef = useRef<TrialPlan | null>(null);
  const contrastRef = useRef(0.18);

  const updateState = useCallback((nextState: SessionState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const currentTrial = useCallback(() => {
    if (!trialRef.current) {
      trialRef.current = createMockTrial(stateRef.current.blockIndex, contrastRef.current);
    }

    return trialRef.current;
  }, []);

  const begin = useCallback(() => {
    if (stateRef.current.status !== 'ready') return;

    contrastRef.current = 0.18;
    trialRef.current = createMockTrial(0, contrastRef.current);
    updateState({ ...INITIAL_STATE, status: 'running' });
  }, [updateState]);

  const respond = useCallback(
    (choice: TrialInterval) => {
      const currentState = stateRef.current;
      const trial = trialRef.current;

      if (currentState.status !== 'running' || !trial) {
        return { correct: false };
      }

      const correct = choice === trial.targetInterval;
      const completedTrials = currentState.completedTrials + 1;
      const nextTrialIndex = currentState.trialIndex + 1;
      const finishedBlock = nextTrialIndex >= TRIALS_PER_BLOCK;
      const finishedSession = finishedBlock && currentState.blockIndex + 1 >= TOTAL_BLOCKS;

      contrastRef.current = clampContrast(contrastRef.current + (correct ? -0.02 : 0.02));
      trialRef.current = finishedBlock
        ? null
        : createMockTrial(currentState.blockIndex, contrastRef.current);

      updateState({
        ...currentState,
        status: finishedSession ? 'complete' : finishedBlock ? 'block-complete' : 'running',
        trialIndex: finishedBlock ? currentState.trialIndex : nextTrialIndex,
        correctCount: currentState.correctCount + (correct ? 1 : 0),
        completedTrials,
        lastCorrect: correct,
      });

      return { correct };
    },
    [updateState]
  );

  const advanceBlock = useCallback(() => {
    const currentState = stateRef.current;

    if (currentState.status !== 'block-complete') return;

    const blockIndex = currentState.blockIndex + 1;
    trialRef.current = createMockTrial(blockIndex, contrastRef.current);
    updateState({
      ...currentState,
      status: 'running',
      blockIndex,
      trialIndex: 0,
      lastCorrect: null,
    });
  }, [updateState]);

  return {
    calibration: DEFAULT_CALIBRATION,
    status: state.status,
    blockIndex: state.blockIndex,
    totalBlocks: TOTAL_BLOCKS,
    blockLabel: BLOCK_LABELS[state.blockIndex],
    trialIndex: state.trialIndex,
    trialsPerBlock: TRIALS_PER_BLOCK,
    correctCount: state.correctCount,
    lastCorrect: state.lastCorrect,
    progress: state.completedTrials / (TOTAL_BLOCKS * TRIALS_PER_BLOCK),
    currentTrial,
    respond,
    begin,
    advanceBlock,
  };
}
