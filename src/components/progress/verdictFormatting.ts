export function formatDelta(delta: number) {
  if (Math.abs(delta) < 0.005) return 'Baseline';

  const sign = delta < 0 ? '−' : delta > 0 ? '+' : '';

  return `${sign}${Math.abs(delta).toFixed(2)}`;
}
