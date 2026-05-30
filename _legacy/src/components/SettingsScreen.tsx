import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { CalibrationProfile, GoalType, UserProfile } from '../types';
import { useAppStore } from '../store/useAppStore';
import { SceneHeader } from './SceneHeader';

type SettingsScreenProps = {
  profile: UserProfile;
  calibration: CalibrationProfile;
  onChangeGoal: (goal: GoalType) => Promise<void>;
};

export function SettingsScreen({
  profile,
  calibration,
  onChangeGoal,
}: SettingsScreenProps) {
  const timePhase = useAppStore((s) => s.timePhase);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const goalLabel = profile.diagnosisType === 'myopia' ? 'Myopia' :
    profile.diagnosisType === 'presbyopia' ? 'Presbyopia' :
    profile.diagnosisType === 'sports-vision' ? 'Sports Vision' : 'Not set';

  return (
    <section className="settings-screen">
      <SceneHeader phase={timePhase} title="Settings" />

      <div className="settings-group glass-card">
        <div className="setting-row">
          <span className="setting-row__label">Display Calibration</span>
          <span className="setting-row__value">Auto-detected</span>
        </div>
        <div className="setting-row">
          <span className="setting-row__label">Screen Distance</span>
          <span className="setting-row__value">{calibration.viewingDistanceCm} cm</span>
        </div>
      </div>

      <div className="settings-group glass-card">
        <div className="setting-row">
          <span className="setting-row__label">Training Program</span>
          <button
            type="button"
            className="setting-row__action"
            aria-label={`Training Program: ${goalLabel}`}
            disabled={isSaving}
            onClick={async () => {
              if (isSaving) return;
              setIsSaving(true);
              setSaveError(null);
              const goals: GoalType[] = ['myopia', 'presbyopia', 'sports-vision'];
              const idx = goals.indexOf(profile.diagnosisType as GoalType);
              try {
                await onChangeGoal(goals[(idx + 1) % goals.length]);
              } catch (err) {
                console.error('Failed to change training program', err);
                setSaveError(err instanceof Error ? err.message : 'Failed to save training program');
              } finally {
                setIsSaving(false);
              }
            }}
          >
            {goalLabel}
            <ChevronRight size={16} />
          </button>
        </div>
        {saveError ? (
          <p className="setting-row__error" role="alert">{saveError}</p>
        ) : null}
      </div>

    </section>
  );
}
