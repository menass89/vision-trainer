import { PlayCircle } from 'lucide-react';
import { useMemo } from 'react';
import type { DashboardSnapshot, GamificationState, UserProfile } from '../types';
import { improvementPercent } from '../progress/csf';

type HomeScreenProps = {
  profile: UserProfile;
  dashboard: DashboardSnapshot;
  gamification: GamificationState;
  onStartSession: () => void;
};

export function HomeScreen({ profile, dashboard, gamification, onStartSession }: HomeScreenProps) {
  const completedSessions = useMemo(
    () => dashboard.sessions.filter((s) => s.status === 'completed').length,
    [dashboard.sessions]
  );

  const streak = useMemo(() => sessionStreak(dashboard.sessions), [dashboard.sessions]);

  const improvement = useMemo(
    () => improvementPercent(dashboard.thresholds),
    [dashboard.thresholds]
  );

  const weekDays = useMemo(() => buildWeekDays(dashboard.sessions), [dashboard.sessions]);

  const goalLabel = profile.diagnosisType === 'myopia' ? 'Myopia' :
    profile.diagnosisType === 'presbyopia' ? 'Presbyopia' : 'Sports Vision';

  const greeting = getGreeting();

  return (
    <section className="home-screen">
      <h2 className="home-greeting">{greeting}, {profile.displayName}</h2>
      <p className="home-subtitle">Day {completedSessions + 1} · {goalLabel} Program</p>

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

      <div className="stat-row">
        <div className="stat-card glass-card">
          <span className="stat-value stat-value--primary">{completedSessions}</span>
          <span className="stat-label">Sessions</span>
        </div>
        <div className="stat-card glass-card">
          <span className="stat-value stat-value--success">+{improvement}%</span>
          <span className="stat-label">CS Gain</span>
        </div>
        <div className="stat-card glass-card">
          <span className="stat-value stat-value--warm">{streak}</span>
          <span className="stat-label">Streak</span>
        </div>
      </div>

      <div className="session-card glass-card">
        <span className="session-card__label">Today's Session</span>
        <h3 className="session-card__title">Session {String.fromCharCode(65 + (completedSessions % 4))}</h3>
        <p className="session-card__meta">~25 min</p>
        <button type="button" className="start-btn" onClick={onStartSession}>
          <PlayCircle size={18} />
          Start Training
        </button>
      </div>

      <div className="trend-mini glass-card">
        <div className="trend-mini__text">
          <strong>XP Progress</strong>
          <span>Level {gamification.level} · {gamification.xp} XP</span>
        </div>
        <div className="trend-spark" aria-hidden="true">
          {[0.2, 0.3, 0.3, 0.5, 0.5, 0.7, 1].map((opacity, i) => (
            <div key={i} className="trend-bar" style={{ height: `${6 + i * 2.5}px`, opacity }} />
          ))}
        </div>
      </div>
    </section>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function sessionStreak(sessions: DashboardSnapshot['sessions']): number {
  const completedDates = new Set(
    sessions
      .filter((s) => s.status === 'completed' && s.completedAt)
      .map((s) => s.completedAt?.slice(0, 10))
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
    sessions
      .filter((s) => s.status === 'completed' && s.completedAt)
      .map((s) => s.completedAt?.slice(0, 10))
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
