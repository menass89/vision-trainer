import { describe, expect, it } from 'vitest';

import { formatDelta } from './verdictFormatting';

describe('formatDelta', () => {
  it('labels flat progress as a baseline instead of 0.00', () => {
    expect(formatDelta(0)).toBe('Baseline');
    expect(formatDelta(-0)).toBe('Baseline');
    expect(formatDelta(0.004)).toBe('Baseline');
  });

  it('formats meaningful movement with direction', () => {
    expect(formatDelta(0.02)).toBe('+0.02');
    expect(formatDelta(-0.02)).toBe('−0.02');
  });
});
