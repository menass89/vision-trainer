import { Activity, Play, Target } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { AssessmentResult, CalibrationProfile, EyeMode, TrialInterval } from '../types';
import {
  buildAssessmentResult,
  createAssessmentTrials,
  type AssessmentResponse,
  type AssessmentTrialPlan
} from '../assessment/csfMeasurement';
import { detailLevelLabel, eyeModeLabel, orientationLabel } from '../utils/labels';
import { GaborCanvas, type GaborCanvasHandle } from './GaborCanvas';

type AssessmentProps = {
  calibration: CalibrationProfile;
  eyeMode: EyeMode;
  previousResult?: AssessmentResult;
  onComplete: (result: AssessmentResult) => Promise<void>;
  onCancel: () => void;
};

type Phase = 'ready' | 'fixation' | 'interval-1' | 'gap' | 'interval-2' | 'response' | 'saving' | 'complete';

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export function Assessment({ calibration, eyeMode, previousResult, onComplete, onCancel }: AssessmentProps) {
  const stageRef = useRef<GaborCanvasHandle | null>(null);
  const startedAt = useRef(new Date().toISOString());
  const trials = useMemo(() => createAssessmentTrials(), []);
  const [phase, setPhase] = useState<Phase>('ready');
  const [trialIndex, setTrialIndex] = useState(0);
  const [currentTrial, setCurrentTrial] = useState<AssessmentTrialPlan | null>(null);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);

  const runTrial = async () => {
    if (phase !== 'ready') {
      return;
    }
    const trial = trials[trialIndex];
    setCurrentTrial(trial);
    setPhase('fixation');
    stageRef.current?.clear();
    await wait(300);
    await presentInterval(trial, 1);
    setPhase('gap');
    stageRef.current?.clear();
    await wait(500);
    await presentInterval(trial, 2);
    stageRef.current?.clear();
    setPhase('response');
  };

  const presentInterval = async (trial: AssessmentTrialPlan, interval: TrialInterval) => {
    setPhase(interval === 1 ? 'interval-1' : 'interval-2');
    if (trial.targetInterval === interval) {
      await stageRef.current?.present(trial.stimulus);
    } else {
      await wait(trial.stimulus.durationMs);
    }
  };

  const submitResponse = async (responseInterval: TrialInterval) => {
    if (phase !== 'response' || !currentTrial) {
      return;
    }
    setPhase('saving');
    const nextResponses = [
      ...responses,
      {
        plan: currentTrial,
        responseInterval,
        correct: responseInterval === currentTrial.targetInterval
      }
    ];
    setResponses(nextResponses);

    if (trialIndex + 1 >= trials.length) {
      const result = buildAssessmentResult(startedAt.current, eyeMode, nextResponses, previousResult?.points);
      await onComplete(result);
      setPhase('complete');
      return;
    }

    setTrialIndex((current) => current + 1);
    setCurrentTrial(null);
    await wait(600);
    setPhase('ready');
  };

  const progress = `${trialIndex + (phase === 'ready' ? 0 : 1)} / ${trials.length}`;

  return (
    <section className="task-layout" aria-labelledby="assessment-heading">
      <div className="task-stage">
        <GaborCanvas ref={stageRef} calibration={calibration} />
        <div className={`phase-overlay ${phase}`}>
          {phase === 'fixation' ? <span className="fixation">+</span> : null}
          {phase === 'interval-1' ? <span className="interval-label">Interval 1</span> : null}
          {phase === 'gap' ? <span>Wait</span> : null}
          {phase === 'interval-2' ? <span className="interval-label">Interval 2</span> : null}
        </div>
      </div>

      <aside className="panel task-panel">
        <div className="section-heading">
          <Activity size={20} />
          <div>
            <h2 id="assessment-heading">Full Vision Profile</h2>
            <span>{eyeModeLabel(eyeMode)}</span>
          </div>
        </div>

        <div className="instruction-card">
          <div className="section-heading compact">
            <Target size={18} />
            <div>
              <h2>15-minute measurement</h2>
              <span>140 fixed-strength trials</span>
            </div>
          </div>
          <p>This precise check measures your vision profile before training and every 10 sessions.</p>
          <p>Choose which interval contained the faint pattern.</p>
        </div>

        <div className="task-metrics">
          <div>
            <span>Progress</span>
            <strong>{progress}</strong>
          </div>
          <div>
            <span>Current detail</span>
            <strong>
              {currentTrial
                ? `${detailLevelLabel(currentTrial.spatialFrequencyCpd)} · ${orientationLabel(currentTrial.orientationDeg)}`
                : 'Ready'}
            </strong>
          </div>
        </div>

        <div className="progress-track">
          <span style={{ width: `${Math.max(2, (trialIndex / trials.length) * 100)}%` }} />
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
          <div className="button-row">
            <button type="button" className="primary-button" onClick={() => void runTrial()} disabled={phase !== 'ready'}>
              <Play size={16} />
              {trialIndex === 0 ? 'Start Assessment' : 'Next Trial'}
            </button>
            <button type="button" className="secondary-button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        )}
      </aside>
    </section>
  );
}
