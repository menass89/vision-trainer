/**
 * Design-token sources: Linear ladder, Ultrahuman near-black, Claude warm ground,
 * Robinhood/Monzo one-accent restraint, and WHOOP verdict bands.
 */
import { StyleSheet } from 'react-native';

export const surface = {
  base: '#0A0B0D',
  raised: '#121316',
  overlay: '#1A1C20',
  warm: '#1A1714',
  hairline: '#262A30',
  hairlineStrong: '#31353D'
} as const;

export const text = {
  primary: '#E8E8E6',
  secondary: '#9BA1A6',
  muted: '#6B7280',
  inverse: '#0A0B0D'
} as const;

// SIGNATURE ACCENT - the only saturated chrome color, reserved for the single
// live/active element (start affordance, active trial, today's figure, active toggle).
// Low-to-mid luminance + slightly desaturated so it never out-glows a low-contrast patch.
export const ACCENT = '#D9885F' as const;
export const ACCENT_GLOW = 'rgba(217,136,95,0.22)' as const;
export const ACCENT_MUTED = '#6E4A3C' as const;

export const accent = {
  default: ACCENT,
  glow: ACCENT_GLOW,
  muted: ACCENT_MUTED
} as const;

export const verdict = {
  improving: '#E0A45E',
  holding: '#8A9099',
  regressing: '#B5746E'
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 14,
  pill: 999
} as const;

export const hairline = {
  width: StyleSheet.hairlineWidth,
  px1: 1
} as const;

export const fontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold'
} as const;

export const type = {
  display: {
    fontFamily: fontFamily.semibold,
    fontSize: 88,
    lineHeight: 88,
    letterSpacing: -2
  },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4
  },
  heading: {
    fontFamily: fontFamily.medium,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 24,
    letterSpacing: 0
  },
  caption: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2
  },
  micro: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6
  }
} as const;

export const tabularFigures = {
  fontVariant: ['tabular-nums'] as const
} as const;

export const motion = {
  spring: {
    input: { stiffness: 240, damping: 18, mass: 1 },
    press: { stiffness: 300, damping: 20, mass: 1 },
    reward: { stiffness: 180, damping: 12, mass: 1 }
  },
  ambientMs: 20000,
  pressScale: 0.96,
  haptics: {
    tick: 'light',
    select: 'selection',
    success: 'success',
    warning: 'warning'
  }
} as const;

export const tokens = {
  surface,
  text,
  accent,
  verdict,
  space,
  radius,
  hairline,
  fontFamily,
  type,
  tabularFigures,
  motion
} as const;
