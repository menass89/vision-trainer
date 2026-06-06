import { useCallback, useMemo, useRef, useState } from 'react';

import { buildDeviceCalibration } from '@/core/deviceCalibration';
import { uuid } from '@/core/uuid';
import { contrastFromLog10, QuestStaircase } from '@/psychophysics/quest';
import {
  buildBlockThreshold,
  buildGuidedSessionLog,
  GUIDED_STIM_DURATION_MS,
} from '@/session/sessionResult';
import {
  FIRST_SESSION_QUEST_PARAMS,
  FIRST_VISIBLE_STIM_DURATION_MS,
  SECOND_VISIBLE_STIM_DURATION_MS,
} from '@/session/calibrationQuest';
import { useAppStore } from '@/store/useAppStore';
import type {
  CalibrationProfile,
  GaborStimulus,
  Orientation,
  PlannedBlock,
  ThresholdEstimate,
  TrialInterval,
} from '@/types';
import { now } from '@/utils/clock';

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
  showBlockBreak: boolean;
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

type SessionBlock = {
  spatialFrequencyCpd: number;
  orientationDeg: Orientation;
  durationMs?: number;
  gaborSizeDeg?: number;
  label: string;
  role: PlannedBlock['role'];
  showBreak?: boolean;
};

const TRIALS_PER_BLOCK = 10;
const GUIDED_BLOCKS: SessionBlock[] = [
  { spatialFrequencyCpd: 4, orientationDeg: 0 as Orientation, label: 'Warm-up · 4 cpd', role: 'warm-up' as const },
  { spatialFrequencyCpd: 6, orientationDeg: 90 as Orientation, label: 'Training · 6 cpd', role: 'training' as const },
];
const FIRST_SESSION_BLOCKS: SessionBlock[] = [
  {
    spatialFrequencyCpd: 1,
    orientationDeg: 0 as Orientation,
    durationMs: FIRST_VISIBLE_STIM_DURATION_MS,
    gaborSizeDeg: 8,
    label: 'Calibration · 1 cpd',
    role: 'warm-up' as const,
    showBreak: false,
  },
  {
    spatialFrequencyCpd: 2,
    orientationDeg: 90 as Orientation,
    durationMs: SECOND_VISIBLE_STIM_DURATION_MS,
    gaborSizeDeg: 6,
    label: 'Calibration · 2 cpd',
    role: 'assessment' as const,
    showBreak: false,
  },
];
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

function blocksForNextSession(): SessionBlock[] {
  return useAppStore.getState().sessions.length === 0 ? FIRST_SESSION_BLOCKS : GUIDED_BLOCKS;
}

// FUTURE(free-practice): Halide drag-as-dial lives in a separate practice mode, not the guided spine.
export function useSessionController(): SessionController {
  const calibration = useMemo(() => buildDeviceCalibration(), []);
  const [state, setState] = useState(INITIAL_STATE);
  const stateRef = useRef(state);
  const trialRef = useRef<TrialPlan | null>(null);
  const sessionIdRef = useRef('');
  const startedAtRef = useRef('');
  const questsRef = useRef<QuestStaircase[]>([]);
  const blocksRef = useRef<SessionBlock[]>(blocksForNextSession());
  const blockIdsRef = useRef<string[]>([]);
  const plannedBlocksRef = useRef<PlannedBlock[]>([]);
  const thresholdsRef = useRef<ThresholdEstimate[]>([]);
  const currentIntensityRef = useRef(0);

  const updateState = useCallback((nextState: SessionState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const buildTrial = useCallback((blockIndex: number): TrialPlan => {
    const quest = questsRef.current[blockIndex];
    const block = blocksRef.current[blockIndex] ?? blocksRef.current[0];
    const intensityLog10 = quest.nextIntensity();
    currentIntensityRef.current = intensityLog10;
    const targetInterval: TrialInterval = nextRandom() < 0.5 ? 1 : 2;
    const stimulus: GaborStimulus = {
      spatialFrequencyCpd: block.spatialFrequencyCpd,
      orientationDeg: block.orientationDeg,
      contrast: contrastFromLog10(intensityLog10),
      phaseRad: nextRandom() * Math.PI * 2,
      durationMs: block.durationMs ?? GUIDED_STIM_DURATION_MS,
      gaborSizeDeg: block.gaborSizeDeg,
      backgroundLuminanceCdM2: calibration.backgroundLuminanceCdM2,
    };
    return { intervals: targetInterval === 1 ? [stimulus, null] : [null, stimulus], targetInterval };
  }, [calibration.backgroundLuminanceCdM2]);

  const currentTrial = useCallback(() => {
    if (!trialRef.current) {
      trialRef.current = buildTrial(stateRef.current.blockIndex);
    }

    return trialRef.current;
  }, [buildTrial]);

  const begin = useCallback(() => {
    if (stateRef.current.status !== 'ready') return;

    const blocks = blocksForNextSession();
    const isFirstSession = blocks === FIRST_SESSION_BLOCKS;

    sessionIdRef.current = `session-${uuid()}`;
    startedAtRef.current = now().toISOString();
    blocksRef.current = blocks;
    questsRef.current = blocks.map((_, i) => (
      isFirstSession ? new QuestStaircase(FIRST_SESSION_QUEST_PARAMS[i]) : new QuestStaircase()
    ));
    blockIdsRef.current = blocks.map(() => `block-${uuid()}`);
    plannedBlocksRef.current = blocks.map((b, i) => ({
      id: blockIdsRef.current[i],
      label: b.label,
      paradigm: 'contrast-detection' as const,
      condition: {
        paradigm: 'contrast-detection' as const,
        spatialFrequencyCpd: b.spatialFrequencyCpd,
        orientationDeg: b.orientationDeg,
        trialsPerBlock: TRIALS_PER_BLOCK,
        durationMs: b.durationMs ?? GUIDED_STIM_DURATION_MS,
        gaborSizeDeg: b.gaborSizeDeg,
      },
      role: b.role,
    }));
    thresholdsRef.current = [];
    trialRef.current = buildTrial(0);
    updateState({ ...INITIAL_STATE, status: 'running' });
  }, [buildTrial, updateState]);

  const respond = useCallback(
    (choice: TrialInterval) => {
      const currentState = stateRef.current;
      const trial = trialRef.current;

      if (currentState.status !== 'running' || !trial) {
        return { correct: false };
      }

      const correct = choice === trial.targetInterval;
      questsRef.current[currentState.blockIndex].record(currentIntensityRef.current, correct);
      const completedTrials = currentState.completedTrials + 1;
      const nextTrialIndex = currentState.trialIndex + 1;
      const finishedBlock = nextTrialIndex >= TRIALS_PER_BLOCK;
      const blocks = blocksRef.current;
      const finishedSession = finishedBlock && currentState.blockIndex + 1 >= blocks.length;

      if (finishedBlock) {
        const bi = currentState.blockIndex;
        const quest = questsRef.current[bi];
        thresholdsRef.current.push(buildBlockThreshold({
          sessionId: sessionIdRef.current,
          blockId: blockIdsRef.current[bi],
          spatialFrequencyCpd: blocks[bi].spatialFrequencyCpd,
          orientationDeg: blocks[bi].orientationDeg,
          durationMs: blocks[bi].durationMs ?? GUIDED_STIM_DURATION_MS,
          estimate: quest.estimate(),
          gaborSizeDeg: blocks[bi].gaborSizeDeg,
          trialCount: quest.trialCount(),
          lapseRate: quest.lapseRate(),
          createdAtIso: now().toISOString(),
        }));
      }

      if (finishedSession) {
        const session = buildGuidedSessionLog({
          id: sessionIdRef.current,
          startedAtIso: startedAtRef.current,
          completedAtIso: now().toISOString(),
          calibrationId: calibration.id,
          plannedBlocks: plannedBlocksRef.current,
          completedTrials,
        });
        void useAppStore
          .getState()
          .recordSessionResult(session, [...thresholdsRef.current])
          .catch((error: unknown) => {
            console.warn('[session] failed to persist result', error);
          });
      }

      trialRef.current = finishedBlock ? null : buildTrial(currentState.blockIndex);

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
    [buildTrial, calibration.id, updateState]
  );

  const advanceBlock = useCallback(() => {
    const currentState = stateRef.current;

    if (currentState.status !== 'block-complete') return;

    const blockIndex = currentState.blockIndex + 1;
    trialRef.current = buildTrial(blockIndex);
    updateState({
      ...currentState,
      status: 'running',
      blockIndex,
      trialIndex: 0,
      lastCorrect: null,
    });
  }, [buildTrial, updateState]);

  return {
    calibration,
    status: state.status,
    blockIndex: state.blockIndex,
    totalBlocks: blocksRef.current.length,
    blockLabel: blocksRef.current[state.blockIndex]?.label ?? blocksRef.current[0].label,
    trialIndex: state.trialIndex,
    trialsPerBlock: TRIALS_PER_BLOCK,
    correctCount: state.correctCount,
    lastCorrect: state.lastCorrect,
    progress: state.completedTrials / (blocksRef.current.length * TRIALS_PER_BLOCK),
    showBlockBreak: blocksRef.current[state.blockIndex]?.showBreak !== false,
    currentTrial,
    respond,
    begin,
    advanceBlock,
  };
}
