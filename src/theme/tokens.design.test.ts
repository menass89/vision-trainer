import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  StyleSheet: { hairlineWidth: 1 }
}));

import { ACCENT, ACCENT_GLOW, ACCENT_MUTED, surface, text, tokens, type } from './tokens';

const PURE_BLACK_OR_WHITE = new Set(['#000', '#000000', '#fff', '#ffffff', 'black', 'white']);

function walkValues(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value.flatMap(walkValues);
  }

  if (typeof value === 'object' && value !== null) {
    return Object.values(value).flatMap(walkValues);
  }

  return [value];
}

function hexChannels(hex: string): [number, number, number] {
  expect(hex).toMatch(/^#[0-9a-f]{6}$/i);

  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16)
  ];
}

function hexLuminance(hex: string): number {
  const channels = hexChannels(hex).map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function hexChroma(hex: string): number {
  const channels = hexChannels(hex);
  return Math.max(...channels) - Math.min(...channels);
}

describe('design tokens', () => {
  it('never uses pure black or pure white', () => {
    const values = walkValues({ tokens, ACCENT, ACCENT_GLOW, ACCENT_MUTED });

    for (const value of values) {
      if (typeof value === 'string') {
        expect(PURE_BLACK_OR_WHITE.has(value.toLowerCase())).toBe(false);
      }
    }
  });

  it('uses a strictly increasing near-black surface luminance ladder', () => {
    expect(hexLuminance(surface.base)).toBeLessThan(hexLuminance(surface.raised));
    expect(hexLuminance(surface.raised)).toBeLessThan(hexLuminance(surface.overlay));
  });

  it('reserves saturated chrome color for the single accent hue', () => {
    expect(ACCENT).toMatch(/^#[0-9a-f]{6}$/i);

    for (const hex of [...Object.values(surface), ...Object.values(text)]) {
      expect(hexChroma(hex)).toBeLessThanOrEqual(24);
    }

    expect(hexChroma(ACCENT)).toBeGreaterThan(40);
  });

  it('provides a sane Inter type scale', () => {
    expect(type.display.fontSize).toBeGreaterThan(type.title.fontSize);
    expect(type.title.fontSize).toBeGreaterThan(type.body.fontSize);

    for (const preset of Object.values(type)) {
      expect(preset.fontFamily.startsWith('Inter-')).toBe(true);
    }
  });
});
