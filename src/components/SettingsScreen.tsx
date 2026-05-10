import { ChevronRight } from 'lucide-react';
import type { CalibrationProfile, GoalType, UserProfile } from '../types';
import { useAppStore } from '../store/useAppStore';
import { SceneHeader } from './SceneHeader';

type SettingsScreenProps = {
  profile: UserProfile;
  calibration: CalibrationProfile;
  onChangeGoal: (goal: GoalType) => void;
};

export function SettingsScreen({
  profile,
  calibration,
  onChangeGoal,
}: SettingsScreenProps) {
  const timePhase = useAppStore((s) => s.timePhase);
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
            onClick={() => {
              const goals: GoalType[] = ['myopia', 'presbyopia', 'sports-vision'];
              const idx = goals.indexOf(profile.diagnosisType as GoalType);
              onChangeGoal(goals[(idx + 1) % goals.length]);
            }}
          >
            {goalLabel}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

    </section>
  );
}
