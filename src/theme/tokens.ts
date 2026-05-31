/**
 * Design-token sources: Linear ladder, Ultrahuman near-black, Claude warm ground,
 * Robinhood/Monzo one-accent restraint, and WHOOP verdict bands.
 */
import { StyleSheet } from 'react-native';

export const surface = {
  base: '#0A0B0D',
  raised: '#15110E',
  overlay: '#1F1813',
  warm: '#1A1210',
  hairline: '#2A241F',
  hairlineStrong: '#352D26'
} as const;

export const text = {
  primary: '#F4F0EC',
  secondary: '#B3AAA3',
  muted: '#6F665F',
  inverse: '#1A1410'
} as const;

// SIGNATURE ACCENT - single living/active hue (warm ember).
// Gradient stops live in accent.
export const ACCENT = '#FF8A45' as const;
export const ACCENT_GLOW = 'rgba(255,138,69,0.30)' as const;
export const ACCENT_MUTED = '#7A4A2C' as const;

export const accent = {
  default: ACCENT,
  glow: ACCENT_GLOW,
  muted: ACCENT_MUTED,
  amber: '#FFB86B',
  ember: '#FF7A3D'
} as const;

export const verdict = {
  improving: '#A9C46C',
  holding: '#8A9099',
  regressing: '#E07A5F'
} as const;

export const data = {
  coral: '#E07A5F',
  amber: '#E8A05A',
  green: '#A9C46C',
  norm: '#8A6A4A',
  track: '#241A14',
  canvas: '#0E0A08',
  heroGlow: 'rgba(200,120,60,0.10)'
} as const;

export const material = {
  blurIntensity: 40,
  blurTint: 'dark',
  radius: 22,
  hairlineOnGlass: 'rgba(255,255,255,0.12)'
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
  hero: {
    fontFamily: fontFamily.bold,
    fontSize: 47,
    lineHeight: 47,
    letterSpacing: -1.6
  },
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
    liquid: { stiffness: 220, damping: 28, mass: 1 },
    reward: { stiffness: 200, damping: 12, mass: 1 },
    snap: { stiffness: 180, damping: 22, mass: 1 },
    response: { stiffness: 240, damping: 22, mass: 1 }
  },
  timing: {
    entranceMs: 280,
    staggerMs: 32,
    drawOnMs: 900,
    countUpProgressMs: 1000,
    countUpRewardMs: 200,
    shimmerMs: 1200,
    breatheMs: 4000,
    rangeFadeMs: 150,
    rangeDrawMs: 600,
    responseDwellMs: 380
  },
  ambientMs: 20000,
  pressScale: 0.96,
  haptics: {
    tick: 'light',
    select: 'selection',
    correct: 'medium',
    wrong: 'warning',
    milestone: 'success',
    numberSettle: 'medium',
    rewardChord: 'success-light-light',
    success: 'success',
    warning: 'warning'
  }
} as const;

export const tokens = {
  surface,
  text,
  accent,
  verdict,
  data,
  material,
  space,
  radius,
  hairline,
  fontFamily,
  type,
  tabularFigures,
  motion
} as const;
