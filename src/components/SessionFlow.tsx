import { Activity, PlayCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { AssessmentResult, EyeMode, GamificationAward, ThresholdEstimate, TrialRecord } from '../types';
import { planSession, type PlannedBlock } from '../session/sessionPlanner';
import { useAppStore } from '../store/useAppStore';
import { AnimatedEye } from './AnimatedEye';
import { eyeModeLabel, oppositeEyeLabel } from '../utils/labels';
import { Assessment } from './Assessment';
import { ContrastTask } from './ContrastTask';

export function SessionFlow() {
  const calibration = useAppStore((state) => state.calibration);
  const profile = useAppStore((state) => state.profile);
  const gamification = useAppStore((state) => state.gamification);
  const activeSession = useAppStore((state) => state.activeSession);
  const dashboard = useAppStore((state) => state.dashboard);
  const startSession = useAppStore((state) => state.startSession);
  const completeSession = useAppStore((state) => state.completeSession);
  const recordTrial = useAppStore((state) => state.recordTrial);
  const recordThreshold = useAppStore((state) => state.recordThreshold);
  const recordAssessment = useAppStore((state) => state.recordAssessment);
  const [blocks, setBlocks] = useState<PlannedBlock[]>([]);
  const [selectedEyeMode, setSelectedEyeMode] = useState<EyeMode>(
    profile.monocularMode ? profile.monocularEye : 'both'
  );
  const [assessmentActive, setAssessmentActive] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  const timePhase = useAppStore((state) => state.timePhase);

  const completedSessions = useMemo(
    () => dashboard.sessions.filter((session) => session.status === 'completed').length,
    [dashboard.sessions]
  );

  const start = async () => {
    const goalType = profile.diagnosisType === 'unspecified' ? undefined : profile.diagnosisType;
    const plannedBlocks = planSession(completedSessions, dashboard.thresholds, goalType);
    setBlocks(plannedBlocks);
    try {
      await startSession(plannedBlocks, selectedEyeMode, 'guided');
      setCompletionMessage(null);
    } catch {
      setBlocks([]);
      setCompletionMessage('Unable to start the session. Please try again.');
    }
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
    return (
      <section className="session-ready" aria-labelledby="session-heading">
        <div className="session-ready__body">
          <AnimatedEye phase={timePhase} />
          <h2 id="session-heading" className="session-ready__heading">Ready to Train</h2>
          <p className="session-ready__meta">Session {completedSessions + 1} · ~25 min</p>

          <div className="eye-selector" role="group" aria-label="Eye mode">
            {(['both', 'left', 'right'] as EyeMode[]).map((eyeMode) => (
              <button
                key={eyeMode}
                type="button"
                className={selectedEyeMode === eyeMode ? 'selected' : ''}
                onClick={() => setSelectedEyeMode(eyeMode)}
                aria-pressed={selectedEyeMode === eyeMode}
              >
                {eyeModeLabel(eyeMode)}
              </button>
            ))}
          </div>

          {selectedEyeMode !== 'both' && (
            <p className="session-note">
              Cover your {oppositeEyeLabel(selectedEyeMode)} eye, then press Start.
            </p>
          )}

          {completionMessage && <p className="completion-message">{completionMessage}</p>}

          <button type="button" className="start-btn wide" onClick={() => void start()}>
            <PlayCircle size={20} />
            Begin Session
          </button>

          <button type="button" className="session-ready__assess" onClick={() => setAssessmentActive(true)}>
            <Activity size={16} />
            Run Full Assessment
          </button>
        </div>
      </section>
    );
  }

  return (
    <ContrastTask
      session={activeSession}
      blocks={blocks}
      calibration={calibration}
      audioMuted={gamification.audioMuted}
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
