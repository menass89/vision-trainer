import { BadgeCheck, BellOff, Flame, Volume2 } from 'lucide-react';
import type { DashboardSnapshot, GamificationState } from '../types';
import { levelForXp, xpForLevel } from '../store/useAppStore';

type GamificationBarProps = {
  gamification: GamificationState;
  dashboard: DashboardSnapshot;
  onMuteChange: (muted: boolean) => Promise<void>;
};

export function GamificationBar({ gamification, dashboard, onMuteChange }: GamificationBarProps) {
  const currentLevelXp = xpForLevel(gamification.level);
  const nextLevelXp = xpForLevel(gamification.level + 1);
  const progress = ((gamification.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
  const latestBadge = gamification.earnedBadges.at(-1);

  return (
    <section className="gamification-bar" aria-label="Training progress">
      <div className="level-block">
        <strong>Level {levelForXp(gamification.xp)}</strong>
        <span>{gamification.xp} XP</span>
      </div>
      <div className="xp-track" aria-label={`${Math.round(progress)}% to next level`}>
        <span style={{ width: `${Math.max(3, Math.min(100, progress))}%` }} />
      </div>
      <div className="streak-block">
        <Flame size={16} />
        <span>{sessionStreak(dashboard.sessions)} day streak</span>
      </div>
      <div className="badge-block">
        <BadgeCheck size={16} />
        <span>{latestBadge?.label ?? 'No badges yet'}</span>
      </div>
      <button
        type="button"
        className="icon-button"
        aria-label={gamification.audioMuted ? 'Unmute feedback sounds' : 'Mute feedback sounds'}
        onClick={() => void onMuteChange(!gamification.audioMuted)}
      >
        {gamification.audioMuted ? <BellOff size={16} /> : <Volume2 size={16} />}
      </button>
    </section>
  );
}

function sessionStreak(sessions: DashboardSnapshot['sessions']): number {
  const completedDates = new Set(
    sessions
      .filter((session) => session.status === 'completed' && session.completedAt)
      .map((session) => session.completedAt?.slice(0, 10))
  );
  let streak = 0;
  const cursor = new Date();
  while (completedDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
