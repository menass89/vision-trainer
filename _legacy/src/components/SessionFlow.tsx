import { Activity, PlayCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { AssessmentResult, EyeMode, GamificationAward, ThresholdEstimate, TrialRecord } from '../types';
import { planSession } from '../session/sessionPlanner';
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
  const [selectedEyeMode, setSelectedEyeMode] = useState<EyeMode>(
    profile.monocularMode ? profile.monocularEye : 'both'
  );
  const [assessmentActive, setAssessmentActive] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const timePhase = useAppStore((state) => state.timePhase);

  const completedSessions = useMemo(
    () => dashboard.sessions.filter((session) => session.status === 'completed').length,
    [dashboard.sessions]
  );

  const start = async () => {
    if (isStarting) return;
    setIsStarting(true);
    const goalType = profile.diagnosisType === 'unspecified' ? undefined : profile.diagnosisType;
    const plannedBlocks = planSession(completedSessions, dashboard.thresholds, goalType);
    try {
      await startSession(plannedBlocks, selectedEyeMode, 'guided');
      setCompletionMessage(null);
    } catch {
      setCompletionMessage('Unable to start the session. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  const onTrial = async (trial: TrialRecord): Promise<GamificationAward> => {
    return recordTrial(trial);
  };

  const onThreshold = async (threshold: ThresholdEstimate) => {
    await recordThreshold(threshold);
  };

  const onComplete = async () => {
    try {
      await completeSession();
      setCompletionMessage(`Great work! Next session recommended: ${nextRecommendedDate()}`);
    } catch {
      setCompletionMessage('Unable to save the session. Your progress may not be persisted.');
    }
  };

  const onAssessmentComplete = async (result: AssessmentResult) => {
    try {
      await recordAssessment(result);
      setAssessmentActive(false);
    } catch {
      setAssessmentActive(false);
      setCompletionMessage('Unable to save the assessment. Please try again.');
    }
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
                disabled={isStarting}
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

          <button type="button" className="start-btn wide" disabled={isStarting} onClick={() => void start()}>
            <PlayCircle size={20} />
            Begin Session
          </button>

          <button
            type="button"
            className="session-ready__assess"
            disabled={isStarting}
            onClick={() => setAssessmentActive(true)}
          >
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
      blocks={activeSession.plannedBlocks}
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
