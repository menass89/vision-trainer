import { PlayCircle } from 'lucide-react';
import { useMemo } from 'react';
import type { DashboardSnapshot, GamificationState, TimePhase, UserProfile } from '../types';
import { improvementPercent } from '../progress/csf';
import { SkyScene } from './SkyScene';

type HomeScreenProps = {
  profile: UserProfile;
  dashboard: DashboardSnapshot;
  gamification: GamificationState;
  timePhase: TimePhase;
  onStartSession: () => void;
};

export function HomeScreen({ profile, dashboard, gamification, timePhase, onStartSession }: HomeScreenProps) {
  const completedSessions = useMemo(
    () => dashboard.sessions.filter((s) => s.status === 'completed').length,
    [dashboard.sessions]
  );

  const streak = useMemo(() => sessionStreak(dashboard.sessions), [dashboard.sessions]);
  const improvement = useMemo(() => improvementPercent(dashboard.thresholds), [dashboard.thresholds]);
  const weekDays = useMemo(() => buildWeekDays(dashboard.sessions), [dashboard.sessions]);

  const greeting = getGreeting(timePhase);

  return (
    <section className="home-immersive">
      <SkyScene phase={timePhase} className="home-immersive__sky" />
      <div className="home-immersive__content">
        <h2 className="home-immersive__greeting">{greeting}, {profile.displayName}</h2>
        <p className="home-immersive__subtitle">Day {completedSessions + 1}</p>

        <div className="streak-bar" aria-label="Weekly streak">
          {weekDays.map((day) => (
            <div key={day.label} className="streak-day">
              <span className="streak-day__label">{day.label}</span>
              <div className={`streak-dot streak-dot--${day.status}`}>
                {day.status === 'done' ? '✓' : day.status === 'today' ? '→' : ''}
              </div>
            </div>
          ))}
        </div>

        <div className="home-session-card glass-card">
          <span className="home-session-card__meta">Session {completedSessions + 1} · ~25 min</span>
          <button type="button" className="start-btn wide" onClick={onStartSession}>
            <PlayCircle size={18} />
            Start Training
          </button>
        </div>

        <div className="home-stats">
          <div className="home-stat">
            <span className="home-stat__value">{streak}</span>
            <span className="home-stat__label">Streak</span>
          </div>
          <div className="home-stat">
            <span className="home-stat__value">+{improvement}%</span>
            <span className="home-stat__label">CS Gain</span>
          </div>
          <div className="home-stat">
            <span className="home-stat__value">Lv {gamification.level}</span>
            <span className="home-stat__label">{gamification.xp} XP</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function getGreeting(phase: TimePhase): string {
  switch (phase) {
    case 'dawn': return 'Good morning';
    case 'afternoon': return 'Good afternoon';
    case 'night': return 'Good evening';
  }
}

function sessionStreak(sessions: DashboardSnapshot['sessions']): number {
  const completedDates = new Set(
    sessions.filter((s) => s.status === 'completed' && s.completedAt).map((s) => s.completedAt?.slice(0, 10))
  );
  let streak = 0;
  const cursor = new Date();
  while (completedDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

type DayStatus = 'done' | 'today' | 'future';
type WeekDay = { label: string; status: DayStatus };

function buildWeekDays(sessions: DashboardSnapshot['sessions']): WeekDay[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const completedDates = new Set(
    sessions.filter((s) => s.status === 'completed' && s.completedAt).map((s) => s.completedAt?.slice(0, 10))
  );
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return labels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const todayStr = today.toISOString().slice(0, 10);
    const status: DayStatus = dateStr === todayStr ? 'today' : completedDates.has(dateStr) ? 'done' : 'future';
    return { label, status };
  });
}
