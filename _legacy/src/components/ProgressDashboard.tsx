import type { DashboardSnapshot } from '../types';
import { buildBeforeAfterCsf, improvementPercent, type CsfPoint } from '../progress/csf';
import { detailLevelLabel } from '../utils/labels';
import { useAppStore } from '../store/useAppStore';
import { SceneHeader } from './SceneHeader';

type ProgressDashboardProps = {
  dashboard: DashboardSnapshot;
};

export function ProgressDashboard({ dashboard }: ProgressDashboardProps) {
  const timePhase = useAppStore((s) => s.timePhase);
  const series = buildBeforeAfterCsf(dashboard.thresholds);
  const improvement = improvementPercent(dashboard.thresholds);
  const correctRate =
    dashboard.trials.length === 0
      ? 0
      : Math.round((dashboard.trials.filter((trial) => trial.correct).length / dashboard.trials.length) * 100);
  const streak = sessionStreak(dashboard.sessions);
  const totalSessions = dashboard.sessions.filter((s) => s.status === 'completed').length;

  return (
    <section className="progress-screen" aria-label="Your Progress">
      <SceneHeader phase={timePhase} title="Your Progress" />

      <div className="progress-hero glass-card">
        <span className="progress-hero__value">{improvement > 0 ? '+' : ''}{improvement}%</span>
        <span className="progress-hero__label">{improvement >= 0 ? 'Vision Improvement' : 'Vision Change'}</span>
      </div>

      <div className="progress-mini-stats">
        <div className="progress-mini glass-card">
          <span className="progress-mini__value">{totalSessions}</span>
          <span className="progress-mini__label">Sessions</span>
        </div>
        <div className="progress-mini glass-card">
          <span className="progress-mini__value">{correctRate}%</span>
          <span className="progress-mini__label">Accuracy</span>
        </div>
        <div className="progress-mini glass-card">
          <span className="progress-mini__value">{streak}</span>
          <span className="progress-mini__label">Streak</span>
        </div>
      </div>

      {series.length > 0 && <CsfChart series={series} />}

      <AssessmentReport dashboard={dashboard} />
    </section>
  );
}

function AssessmentReport({ dashboard }: ProgressDashboardProps) {
  const first = dashboard.assessments[0];
  const latest = dashboard.assessments.at(-1);
  if (!latest) {
    return null;
  }
  return (
    <div className="assessment-report">
      <strong>Assessment report</strong>
      <span>{latest.estimatedAcuityChange}</span>
      {first && first.id !== latest.id ? (
        latest.points.map((point) => {
          const baseline = first.points.find((candidate) => candidate.spatialFrequencyCpd === point.spatialFrequencyCpd);
          const improvement = baseline ? Math.round((1 - point.thresholdContrast / baseline.thresholdContrast) * 100) : 0;
          return (
            <div key={point.spatialFrequencyCpd}>
              <span>{detailLevelLabel(point.spatialFrequencyCpd)} detail</span>
              <strong>
                {improvement >= 0
                  ? `${improvement}% improvement`
                  : `${Math.abs(improvement)}% regression`}
              </strong>
            </div>
          );
        })
      ) : (
        <p>Baseline saved. Run another assessment after training to compare results.</p>
      )}
    </div>
  );
}

function CsfChart({ series, compact = false }: { series: { label: string; points: CsfPoint[] }[]; compact?: boolean }) {
  const allPoints = series.flatMap((item) => item.points);
  const maxSensitivity = Math.max(10, ...allPoints.map((point) => point.sensitivity));
  const frequencies = [1.5, 3, 6, 12];
  const width = 420;
  const height = 220;
  const padding = 38;

  const x = (frequency: number) => {
    const index = frequencies.indexOf(frequency);
    const normalized = index >= 0 ? index / (frequencies.length - 1) : Math.log2(frequency / 1.5) / 3;
    return padding + normalized * (width - padding * 2);
  };
  const y = (sensitivity: number) => height - padding - (sensitivity / maxSensitivity) * (height - padding * 2);

  return (
    <div className={compact ? 'chart-shell compact' : 'chart-shell'}>
      <div className="chart-legend" aria-hidden="true">
        {series.map((item, index) => (
          <span key={item.label}>
            <i className={index === 0 && series.length > 1 ? 'legend-dashed' : 'legend-solid'} />
            {item.label}
          </span>
        ))}
      </div>
      <svg className="csf-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Vision profile chart">
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} />
      {frequencies.map((frequency) => (
        <text key={frequency} x={x(frequency)} y={height - 20} textAnchor="middle">{detailLevelLabel(frequency)}</text>
      ))}
      <text x={width / 2} y={height - 4} textAnchor="middle">Detail level (coarse → fine)</text>
      <text x={12} y={height / 2} textAnchor="middle" transform={`rotate(-90 12 ${height / 2})`}>
        Sharpness score
      </text>
      {series.map((item, index) => {
        const points = item.points.map((point) => `${x(point.spatialFrequencyCpd)},${y(point.sensitivity)}`).join(' ');
        return (
          <g key={item.label} className={index === 0 && series.length > 1 ? 'baseline' : 'latest'}>
            <polyline points={points} />
            {item.points.map((point) => (
              <circle key={`${item.label}-${point.spatialFrequencyCpd}`} cx={x(point.spatialFrequencyCpd)} cy={y(point.sensitivity)} r="4" />
            ))}
          </g>
        );
      })}
      </svg>
    </div>
  );
}

function sessionStreak(sessions: DashboardSnapshot['sessions']): number {
  const completedDates = new Set(
    sessions
      .filter((session) => session.status === 'completed' && session.completedAt)
      .map((session) => localDateKey(new Date(session.completedAt as string)))
  );
  let streak = 0;
  const cursor = new Date();
  if (!completedDates.has(localDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (completedDates.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
