import { useCallback, useMemo, useRef, useState } from 'react';

import { buildDeviceCalibration } from '@/core/deviceCalibration';
import { uuid } from '@/core/uuid';
import { contrastFromLog10, QuestStaircase } from '@/psychophysics/quest';
import { buildGuidedSessionBlocks, type GuidedSessionBlock } from '@/session/guidedProtocol';
import { buildBlockThreshold, buildGuidedSessionLog, GUIDED_STIM_DURATION_MS } from '@/session/sessionResult';
import { useAppStore } from '@/store/useAppStore';
import type {
  CalibrationProfile,
  GaborStimulus,
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

function blocksForNextSession(): GuidedSessionBlock[] {
  const { sessions, settings, thresholds } = useAppStore.getState();

  return buildGuidedSessionBlocks({
    sessionsCompleted: sessions.length,
    thresholds,
    visionGoal: settings.visionGoal,
  });
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
  const blocksRef = useRef<GuidedSessionBlock[]>(blocksForNextSession());
  const thresholdsRef = useRef<ThresholdEstimate[]>([]);
  const currentIntensityRef = useRef(0);

  const updateState = useCallback((nextState: SessionState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const buildTrial = useCallback((blockIndex: number): TrialPlan => {
    const quest = questsRef.current[blockIndex];
    const block = blocksRef.current[blockIndex] ?? blocksRef.current[0];
    const condition = block.condition;
    const intensityLog10 = quest.nextIntensity();
    currentIntensityRef.current = intensityLog10;
    const targetInterval: TrialInterval = nextRandom() < 0.5 ? 1 : 2;
    const stimulus: GaborStimulus = {
      spatialFrequencyCpd: condition.spatialFrequencyCpd,
      orientationDeg: condition.orientationDeg,
      contrast: contrastFromLog10(intensityLog10),
      phaseRad: nextRandom() * Math.PI * 2,
      durationMs: condition.durationMs ?? GUIDED_STIM_DURATION_MS,
      gaborSizeDeg: condition.gaborSizeDeg,
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

    sessionIdRef.current = `session-${uuid()}`;
    startedAtRef.current = now().toISOString();
    blocksRef.current = blocks;
    questsRef.current = blocks.map((block) => new QuestStaircase(block.questParams));
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
      const blocks = blocksRef.current;
      const block = blocks[currentState.blockIndex];
      const finishedBlock = nextTrialIndex >= block.trialsPerBlock;
      const finishedSession = finishedBlock && currentState.blockIndex + 1 >= blocks.length;

      if (finishedBlock) {
        const bi = currentState.blockIndex;
        const quest = questsRef.current[bi];
        const condition = blocks[bi].condition;
        thresholdsRef.current.push(buildBlockThreshold({
          sessionId: sessionIdRef.current,
          blockId: blocks[bi].id,
          spatialFrequencyCpd: condition.spatialFrequencyCpd,
          orientationDeg: condition.orientationDeg,
          durationMs: condition.durationMs ?? GUIDED_STIM_DURATION_MS,
          estimate: quest.estimate(),
          gaborSizeDeg: condition.gaborSizeDeg,
          paradigm: condition.paradigm,
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
          plannedBlocks: blocks.map((block) => block.plannedBlock),
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
    trialsPerBlock: blocksRef.current[state.blockIndex]?.trialsPerBlock ?? blocksRef.current[0].trialsPerBlock,
    correctCount: state.correctCount,
    lastCorrect: state.lastCorrect,
    progress: state.completedTrials / blocksRef.current.reduce((sum, block) => sum + block.trialsPerBlock, 0),
    showBlockBreak: blocksRef.current[state.blockIndex]?.showBreak,
    currentTrial,
    respond,
    begin,
    advanceBlock,
  };
}
