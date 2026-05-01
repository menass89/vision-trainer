import { Activity, Glasses, PlayCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { AssessmentResult, EyeMode, GamificationAward, ThresholdEstimate, TrialRecord } from '../types';
import { planDichopticSession, planSession, type PlannedBlock } from '../session/sessionPlanner';
import { useAppStore } from '../store/useAppStore';
import { eyeModeLabel, oppositeEyeLabel } from '../utils/labels';
import { Assessment } from './Assessment';
import { ContrastTask } from './ContrastTask';
import { DichopticSetup } from './DichopticSetup';

export function SessionFlow() {
  const calibration = useAppStore((state) => state.calibration);
  const gamification = useAppStore((state) => state.gamification);
  const dichopticSettings = useAppStore((state) => state.dichopticSettings);
  const activeSession = useAppStore((state) => state.activeSession);
  const dashboard = useAppStore((state) => state.dashboard);
  const startSession = useAppStore((state) => state.startSession);
  const completeSession = useAppStore((state) => state.completeSession);
  const recordTrial = useAppStore((state) => state.recordTrial);
  const recordThreshold = useAppStore((state) => state.recordThreshold);
  const recordAssessment = useAppStore((state) => state.recordAssessment);
  const updateDichopticSettings = useAppStore((state) => state.updateDichopticSettings);
  const [blocks, setBlocks] = useState<PlannedBlock[]>([]);
  const [selectedEyeMode, setSelectedEyeMode] = useState<EyeMode>('both');
  const [assessmentActive, setAssessmentActive] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  const completedSessions = useMemo(
    () => dashboard.sessions.filter((session) => session.status === 'completed').length,
    [dashboard.sessions]
  );

  const start = async () => {
    const plannedBlocks = planSession(completedSessions, dashboard.thresholds);
    await startSession([...new Set(plannedBlocks.map((block) => block.paradigm))], selectedEyeMode, 'guided');
    setBlocks(plannedBlocks);
    setCompletionMessage(null);
  };

  const startDichoptic = async () => {
    const ratio = contrastRatioForDichopticSession(completedSessions);
    const settings = {
      ...dichopticSettings,
      dominantContrast: ratio.dominant,
      nonDominantContrast: ratio.nonDominant,
      setupCompleted: true,
      updatedAt: new Date().toISOString()
    };
    await updateDichopticSettings(settings);
    const plannedBlocks = planDichopticSession(completedSessions);
    await startSession([...new Set(plannedBlocks.map((block) => block.paradigm))], 'both', 'dichoptic');
    setBlocks(plannedBlocks);
    setCompletionMessage(null);
  };

  const onTrial = async (trial: TrialRecord): Promise<GamificationAward> => {
    return recordTrial(trial);
  };

  const onThreshold = async (threshold: ThresholdEstimate) => {
    await recordThreshold(threshold);
  };

  const onComplete = async () => {
    await completeSession();
    setBlocks([]);
    setCompletionMessage(`Great work! Next session recommended: ${nextRecommendedDate()}`);
  };

  const onAssessmentComplete = async (result: AssessmentResult) => {
    await recordAssessment(result);
    setAssessmentActive(false);
  };

  if (!activeSession && assessmentActive) {
    return (
      <Assessment
        calibration={calibration}
        eyeMode={selectedEyeMode}
        previousResult={dashboard.assessments.at(-1)}
        onComplete={onAssessmentComplete}
        onCancel={() => setAssessmentActive(false)}
      />
    );
  }

  if (!activeSession) {
    const dichopticUnlocked = completedSessions >= 5;
    return (
      <section className="panel session-panel" aria-labelledby="session-heading">
        <div className="section-heading">
          <Activity size={20} />
          <div>
            <h2 id="session-heading">Session Flow Manager</h2>
            <span>Warm-up, training, assessment</span>
          </div>
        </div>
        <div className="eye-selector" aria-label="Eye mode">
          {(['both', 'left', 'right'] as EyeMode[]).map((eyeMode) => (
            <button
              key={eyeMode}
              type="button"
              className={selectedEyeMode === eyeMode ? 'selected' : ''}
              onClick={() => setSelectedEyeMode(eyeMode)}
            >
              {eyeModeLabel(eyeMode)}
            </button>
          ))}
        </div>
        {selectedEyeMode !== 'both' ? (
          <p className="session-note">
            Cover your {oppositeEyeLabel(selectedEyeMode)} eye with your hand or an eye patch, then press Start.
          </p>
        ) : null}
        <div className="session-summary">
          <div>
            <span>Completed sessions</span>
            <strong>{completedSessions}</strong>
          </div>
          <div>
            <span>Stored trials</span>
            <strong>{dashboard.trials.length}</strong>
          </div>
          <div>
            <span>Measurements taken</span>
            <strong>{dashboard.thresholds.length}</strong>
          </div>
        </div>
        {completionMessage ? <p className="completion-message">{completionMessage}</p> : null}
        <button type="button" className="primary-button wide" onClick={() => void start()}>
          <PlayCircle size={18} />
          Start Guided Session
        </button>
        <div className="button-row session-actions">
          <button type="button" className="secondary-button" onClick={() => setAssessmentActive(true)}>
            <Activity size={16} />
            Run Full Assessment
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void startDichoptic()}
            disabled={!dichopticUnlocked || !dichopticSettings.setupCompleted}
            title={!dichopticUnlocked ? 'Unlocks after 5 completed sessions' : undefined}
          >
            <Glasses size={16} />
            Dichoptic Training
          </button>
        </div>
        <p className="session-note">
          This 15-minute test measures your vision profile precisely. Run it before starting training and every 10 sessions to track improvement.
        </p>
        {dichopticUnlocked ? (
          <DichopticSetup settings={dichopticSettings} onChange={updateDichopticSettings} />
        ) : (
          <p className="session-note">Dichoptic training unlocks after 5 completed sessions.</p>
        )}
      </section>
    );
  }

  return (
    <ContrastTask
      session={activeSession}
      blocks={blocks}
      calibration={calibration}
      audioMuted={gamification.audioMuted}
      dichopticSettings={dichopticSettings}
      onTrial={onTrial}
      onThreshold={onThreshold}
      onComplete={onComplete}
    />
  );
}

function nextRecommendedDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
}

function contrastRatioForDichopticSession(completedSessions: number): { dominant: number; nonDominant: number } {
  const step = Math.max(0, completedSessions - 5);
  const dominant = Math.max(0.5, 0.8 - step * 0.05);
  return { dominant, nonDominant: 1 - dominant };
}
