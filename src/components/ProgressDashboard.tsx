import { Download, LineChart } from 'lucide-react';
import type { DashboardSnapshot, EyeMode } from '../types';
import { exportJson } from '../data/db';
import { buildBeforeAfterCsf, buildLatestCsf, improvementPercent, type CsfPoint } from '../progress/csf';
import { detailLevelLabel, eyeModeLabel } from '../utils/labels';

type ProgressDashboardProps = {
  dashboard: DashboardSnapshot;
};

export function ProgressDashboard({ dashboard }: ProgressDashboardProps) {
  const latest = buildLatestCsf(dashboard.thresholds);
  const series = buildBeforeAfterCsf(dashboard.thresholds);
  const perEyeSeries = buildPerEyeSeries(dashboard);
  const improvement = improvementPercent(dashboard.thresholds);
  const correctRate =
    dashboard.trials.length === 0
      ? 0
      : Math.round((dashboard.trials.filter((trial) => trial.correct).length / dashboard.trials.length) * 100);

  const download = async () => {
    const json = await exportJson();
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `vision-trainer-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="panel dashboard-panel" aria-labelledby="dashboard-heading">
      <div className="section-heading">
        <LineChart size={20} />
        <div>
          <h2 id="dashboard-heading">Progress Dashboard</h2>
          <span>Vision profile, detection levels, adherence</span>
        </div>
      </div>

      <div className="dashboard-stats">
        <div>
          <span>Vision improvement</span>
          <strong>{improvement}%</strong>
        </div>
        <div>
          <span>Accuracy</span>
          <strong>{correctRate}%</strong>
        </div>
        <div>
          <span>Streak</span>
          <strong>{sessionStreak(dashboard.sessions)}</strong>
        </div>
      </div>

      <CsfChart series={series} />

      {perEyeSeries.length > 1 ? (
        <div className="eye-chart-grid">
          {perEyeSeries.map((item) => (
            <div key={item.eyeMode} className="eye-chart">
              <strong>{eyeModeLabel(item.eyeMode)}</strong>
              <CsfChart series={item.series} compact />
            </div>
          ))}
        </div>
      ) : null}

      <div className="threshold-list">
        {latest.length === 0 ? (
          <p>No detection level measurements yet. Complete a block to draw the first vision profile.</p>
        ) : (
          latest.map((point) => (
            <div key={point.spatialFrequencyCpd}>
              <span>{detailLevelLabel(point.spatialFrequencyCpd)} detail</span>
              <strong>{point.sensitivity.toFixed(1)} sharpness score</strong>
              <span>{(point.thresholdContrast * 100).toFixed(2)}% detection level</span>
            </div>
          ))
        )}
      </div>

      <AssessmentReport dashboard={dashboard} />

      <button type="button" className="secondary-button" onClick={() => void download()}>
        <Download size={16} />
        Export JSON
      </button>
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
              <strong>{improvement}% improvement</strong>
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

function buildPerEyeSeries(dashboard: DashboardSnapshot): Array<{ eyeMode: EyeMode; series: { label: string; points: CsfPoint[] }[] }> {
  const sessionEyeMode = new Map(dashboard.sessions.map((session) => [session.id, session.eyeMode ?? 'both']));
  const modes: EyeMode[] = ['both', 'left', 'right'];
  return modes.flatMap((eyeMode) => {
    const thresholds = dashboard.thresholds.filter((threshold) => (sessionEyeMode.get(threshold.sessionId) ?? 'both') === eyeMode);
    if (thresholds.length === 0) {
      return [];
    }
    return [{ eyeMode, series: buildBeforeAfterCsf(thresholds) }];
  });
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
