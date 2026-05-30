import { describe, expect, it } from 'vitest';

import { FRAGMENT_SHADER_SOURCE } from '../core/gaborRenderer';

type ReferenceParams = {
  cx: number;
  cy: number;
  orientation: number;
  phase: number;
  contrast: number;
  background: number;
  lambda: number;
  sigma: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function refSample(px: number, py: number, p: ReferenceParams) {
  const x = px - p.cx;
  const y = py - p.cy;
  const xr = x * Math.cos(p.orientation) + y * Math.sin(p.orientation);
  const yr = -x * Math.sin(p.orientation) + y * Math.cos(p.orientation);
  const envelope = Math.exp(-(xr * xr + yr * yr) / (2 * p.sigma * p.sigma));
  const carrier = Math.cos((2 * Math.PI * xr) / p.lambda + p.phase);
  const signal = envelope * carrier * p.contrast;
  const gray = clamp(p.background + signal * 0.5, 0, 1);
  return { carrier, envelope, gray };
}

function refLuminance(px: number, py: number, p: ReferenceParams): number {
  return refSample(px, py, p).gray;
}

const baseParams: ReferenceParams = {
  cx: 0,
  cy: 0,
  orientation: 0,
  phase: 0,
  contrast: 0.2,
  background: 0.4,
  lambda: 8,
  sigma: 5
};

describe('Gabor shader photometric reference', () => {
  it('has the expected center luminance and approaches background outside the envelope', () => {
    expect(refLuminance(0, 0, baseParams)).toBeCloseTo(0.5, 3);
    expect(refLuminance(10 * baseParams.sigma, 0, baseParams)).toBeCloseTo(
      baseParams.background,
      3
    );
  });

  it('places successive carrier zero-crossings lambda / 2 apart', () => {
    const firstZero = baseParams.lambda / 4;
    const secondZero = firstZero + baseParams.lambda / 2;

    expect(refSample(firstZero, 0, baseParams).carrier).toBeCloseTo(0, 3);
    expect(refSample(secondZero, 0, baseParams).carrier).toBeCloseTo(0, 3);
    expect(secondZero - firstZero).toBeCloseTo(baseParams.lambda / 2, 3);
  });

  it('keeps the carrier constant while moving along the bar axis', () => {
    const orientation = Math.PI / 4;
    const carrierDistance = 2;
    const barDistance = 7;
    const x = carrierDistance * Math.cos(orientation);
    const y = carrierDistance * Math.sin(orientation);
    const alongBarX = x - barDistance * Math.sin(orientation);
    const alongBarY = y + barDistance * Math.cos(orientation);
    const p = { ...baseParams, orientation };

    expect(refSample(alongBarX, alongBarY, p).carrier).toBeCloseTo(
      refSample(x, y, p).carrier,
      3
    );
  });

  it('scales center amplitude linearly with contrast and removes signal at zero contrast', () => {
    const lowContrast = refLuminance(0, 0, { ...baseParams, contrast: 0.1 });
    const highContrast = refLuminance(0, 0, { ...baseParams, contrast: 0.2 });
    const zeroContrast = { ...baseParams, contrast: 0 };

    expect(highContrast - baseParams.background).toBeCloseTo(
      2 * (lowContrast - baseParams.background),
      3
    );
    expect(refLuminance(0, 0, zeroContrast)).toBeCloseTo(baseParams.background, 3);
    expect(refLuminance(3, 4, zeroContrast)).toBeCloseTo(baseParams.background, 3);
  });

  it('falls to exp(-0.5) at one sigma when the carrier is one', () => {
    const p = { ...baseParams, lambda: baseParams.sigma };

    expect(refSample(p.sigma, 0, p).envelope).toBeCloseTo(Math.exp(-0.5), 3);
    expect(refSample(p.sigma, 0, p).carrier).toBeCloseTo(1, 3);
  });

  it('retains GLSL ES 3 and dichoptic channel routing', () => {
    expect(FRAGMENT_SHADER_SOURCE).toContain('#version 300 es');
    expect(FRAGMENT_SHADER_SOURCE).toContain('float gabor(');
    expect(FRAGMENT_SHADER_SOURCE).toContain('color.r = primaryGray;');
    expect(FRAGMENT_SHADER_SOURCE).toContain('color.g = primaryGray;');
    expect(FRAGMENT_SHADER_SOURCE).toContain('color.b = primaryGray;');
  });
});
