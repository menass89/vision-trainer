import { Play, Target } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CalibrationProfile, GaborStimulus, GamificationAward, SessionLog, ThresholdEstimate, TrialInterval, TrialRecord } from '../types';
import { conditionKey } from '../core/displayCalibration';
import { uuid } from '../core/uuid';
import { contrastFromLog10, QuestStaircase } from '../psychophysics/quest';
import type { ContrastTrialPlan } from '../tasks/contrastDetection';
import { getParadigmModule } from '../tasks/paradigmRegistry';
import type { PlannedBlock } from '../session/sessionPlanner';
import { conditionLabel } from '../utils/labels';
import { playCorrectTone, playLevelUpTone } from '../utils/audio';
import { GaborCanvas, type GaborCanvasHandle } from './GaborCanvas';
import { TaskInstructions } from './TaskInstructions';

type Phase = 'idle' | 'fixation' | 'interval-1' | 'isi' | 'interval-2' | 'response' | 'saving' | 'complete';

type ContrastTaskProps = {
  session: SessionLog;
  blocks: PlannedBlock[];
  calibration: CalibrationProfile;
  audioMuted: boolean;
  onTrial: (trial: TrialRecord) => Promise<GamificationAward | void>;
  onThreshold: (threshold: ThresholdEstimate) => Promise<void>;
  onComplete: () => Promise<void>;
};

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const interTrialIntervalMs = 1200;

export function ContrastTask({ session, blocks, calibration, audioMuted, onTrial, onThreshold, onComplete }: ContrastTaskProps) {
  const stageRef = useRef<GaborCanvasHandle | null>(null);
  const staircaseRef = useRef(new QuestStaircase());
  const responseStartedAt = useRef(0);
  const runningRef = useRef(false);
  const [blockIndex, setBlockIndex] = useState(0);
  const [trialIndex, setTrialIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [plan, setPlan] = useState<ContrastTrialPlan | null>(null);
  const [instructionsDismissed, setInstructionsDismissed] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; correctCount: number; completedCount: number } | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const block = blocks[blockIndex];
  const paradigmModule = block ? getParadigmModule(block.paradigm) : null;
  const progress = useMemo(() => {
    const completedBefore = blocks.slice(0, blockIndex).reduce((sum, item) => sum + item.condition.trialsPerBlock, 0);
    const total = blocks.reduce((sum, item) => sum + item.condition.trialsPerBlock, 0);
    return { completed: completedBefore + trialIndex, total };
  }, [blockIndex, blocks, trialIndex]);

  useEffect(() => {
    staircaseRef.current = new QuestStaircase();
    setTrialIndex(0);
    setPlan(null);
    setPhase('idle');
    setInstructionsDismissed(false);
    setFeedback(null);
    runningRef.current = false;
  }, [blockIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === '1') {
        void submitResponse(1);
      }
      if (event.key === '2') {
        void submitResponse(2);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const runTrial = async (trialNumber = trialIndex) => {
    if (!block || !paradigmModule || !instructionsDismissed || runningRef.current) {
      return;
    }
    runningRef.current = true;
    setFeedback(null);

    const nextPlan = paradigmModule.createTrial(staircaseRef.current, block.condition, block.id, trialNumber);
    setPlan(nextPlan);
    setPhase('fixation');
    stageRef.current?.clear();
    await wait(300);

    await presentInterval(nextPlan, 1);

    setPhase('isi');
    stageRef.current?.clear();
    await wait(500);

    await presentInterval(nextPlan, 2);

    stageRef.current?.clear();
    responseStartedAt.current = performance.now();
    runningRef.current = false;
    setPhase('response');
  };

  const presentInterval = async (trialPlan: ContrastTrialPlan, interval: TrialInterval) => {
    setPhase(interval === 1 ? 'interval-1' : 'interval-2');
    const intervalStimulus = stimulusForInterval(trialPlan, interval);

    if (intervalStimulus) {
      await stageRef.current?.present(intervalStimulus);
    } else {
      stageRef.current?.clear();
      await wait(trialPlan.stimulus.durationMs);
    }

    if (trialPlan.maskStimulus && (trialPlan.maskInBothIntervals || interval === trialPlan.targetInterval)) {
      stageRef.current?.clear();
      await wait(trialPlan.maskDelayMs ?? 0);
      await stageRef.current?.present(trialPlan.maskStimulus);
    }
  };

  const stimulusForInterval = (trialPlan: ContrastTrialPlan, interval: TrialInterval): GaborStimulus | null => {
    if (interval === trialPlan.targetInterval) {
      return trialPlan.stimulus;
    }
    return trialPlan.comparisonStimulus ?? null;
  };

  const submitResponse = async (response: TrialInterval) => {
    if (phase !== 'response' || !plan || !block) {
      return;
    }
    setPhase('saving');
    const reactionTimeMs = performance.now() - responseStartedAt.current;
    const trial = getParadigmModule(block.paradigm).buildTrialRecord(session.id, plan, response, reactionTimeMs);
    staircaseRef.current.record(plan.intensityLog10, trial.correct, plan.catchTrial);
    const award = await onTrial(trial);
    if (trial.correct) {
      playCorrectTone(audioMuted);
    }
    if (award?.leveledUp) {
      playLevelUpTone(audioMuted);
    }
    const nextCorrectCount = correctCount + (trial.correct ? 1 : 0);
    const completedCount = progress.completed + 1;
    setCorrectCount(nextCorrectCount);
    setFeedback({ correct: trial.correct, correctCount: nextCorrectCount, completedCount });

    const nextTrialIndex = trialIndex + 1;
    if (nextTrialIndex >= block.condition.trialsPerBlock) {
      await wait(interTrialIntervalMs);
      await finishBlock();
      return;
    }

    setTrialIndex(nextTrialIndex);
    setPlan(null);
    stageRef.current?.clear();
    await wait(interTrialIntervalMs);
    setPhase('idle');
    void runTrial(nextTrialIndex);
  };

  const finishBlock = async () => {
    if (!block) {
      return;
    }
    const estimate = staircaseRef.current.estimate();
    const threshold: ThresholdEstimate = {
      id: `threshold-${uuid()}`,
      sessionId: session.id,
      blockId: block.id,
      conditionKey: conditionKey(
        block.condition.spatialFrequencyCpd,
        block.condition.orientationDeg,
        block.paradigm,
        block.condition.durationMs,
        block.condition.gaborSizeDeg
      ),
      paradigm: block.paradigm,
      spatialFrequencyCpd: block.condition.spatialFrequencyCpd,
      orientationDeg: block.condition.orientationDeg,
      thresholdContrast: contrastFromLog10(estimate.thresholdLog10),
      thresholdLog10: estimate.thresholdLog10,
      ciLow: contrastFromLog10(estimate.ciLowLog10),
      ciHigh: contrastFromLog10(estimate.ciHighLog10),
      trialCount: staircaseRef.current.trialCount(),
      lapseRate: staircaseRef.current.lapseRate(),
      createdAt: new Date().toISOString()
    };
    await onThreshold(threshold);

    if (blockIndex + 1 >= blocks.length) {
      setPhase('complete');
      await onComplete();
      return;
    }

    setBlockIndex((current) => current + 1);
  };

  if (!block || !paradigmModule) {
    return null;
  }

  const currentValue = describeCurrentValue(plan);

  return (
    <section className="task-layout" aria-labelledby="task-heading">
      <div className="task-stage">
        <GaborCanvas ref={stageRef} calibration={calibration} />
        <div className={`phase-overlay ${phase}`}>
          {phase === 'fixation' ? <span className="fixation">+</span> : null}
          {phase === 'interval-1' ? <span className="interval-label">Interval 1</span> : null}
          {phase === 'isi' ? <span>Wait</span> : null}
          {phase === 'interval-2' ? <span className="interval-label">Interval 2</span> : null}
        </div>
        {feedback ? (
          <div className={`inline-feedback ${feedback.correct ? 'correct' : 'incorrect'}`} aria-live="polite">
            <span className="feedback-dot">{feedback.correct ? '✓' : '✗'}</span>
            <span>{feedback.correctCount}/{feedback.completedCount} correct</span>
          </div>
        ) : null}
      </div>

      <aside className="panel task-panel">
        <div className="section-heading">
          <Target size={20} />
          <div>
            <h2 id="task-heading">{paradigmModule.label}</h2>
          </div>
        </div>

        {!instructionsDismissed ? (
          <TaskInstructions block={block} onDismiss={() => setInstructionsDismissed(true)} />
        ) : null}

        <div className="task-metrics">
          <div>
            <span>Block</span>
            <strong>{block.label}</strong>
          </div>
          <div>
            <span>Condition</span>
            <strong title={`${block.condition.spatialFrequencyCpd} cycles per degree, ${block.condition.orientationDeg} degrees`}>
              {conditionLabel(block.condition.spatialFrequencyCpd, block.condition.orientationDeg)}
            </strong>
          </div>
          <div>
            <span>Progress</span>
            <strong>{progress.completed} / {progress.total}</strong>
          </div>
          <div>
            <span>Current contrast</span>
            <strong>{currentValue}</strong>
          </div>
        </div>

        <div className="progress-track">
          <span style={{ width: `${Math.max(2, (progress.completed / progress.total) * 100)}%` }} />
        </div>

        {phase === 'response' ? (
          <div className="response-grid">
            <button type="button" className="choice-button" onClick={() => void submitResponse(1)}>
              <span className="choice-key">1</span>
              First interval
            </button>
            <button type="button" className="choice-button" onClick={() => void submitResponse(2)}>
              <span className="choice-key">2</span>
              Second interval
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="primary-button wide"
            onClick={() => void runTrial()}
            disabled={phase !== 'idle' || !instructionsDismissed || trialIndex > 0}
          >
            <Play size={16} />
            {phase === 'idle' ? 'Begin Trial' : 'Running Trial'}
          </button>
        )}

      </aside>
    </section>
  );
}

function describeCurrentValue(plan: ContrastTrialPlan | null): string {
  if (!plan) {
    return 'Ready';
  }
  if (plan.condition.paradigm === 'backward-masking') {
    return `${plan.maskDelayMs ?? 0} ms gap`;
  }
  if (plan.condition.paradigm === 'pedestal-discrimination' && plan.comparisonStimulus) {
    const increment = Math.max(0, plan.stimulus.contrast - plan.comparisonStimulus.contrast);
    return `+${(increment * 100).toFixed(1)}%`;
  }
  return `${(plan.stimulus.contrast * 100).toFixed(1)}%`;
}
