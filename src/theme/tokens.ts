/**
 * Design-token sources: Linear ladder, Ultrahuman near-black, Claude warm ground,
 * Robinhood/Monzo one-accent restraint, and WHOOP verdict bands.
 */
import { StyleSheet } from 'react-native';

export const surface = {
  base: '#080A0D',
  raised: '#0E1316',
  card: '#12181C',
  cardPressed: '#161D21',
  overlay: '#141F22',
  warm: '#0C1417',
  hairline: '#1E2A2D',
  hairlineStrong: '#28363A'
} as const;

export const text = {
  primary: '#EFF3F4',
  secondary: '#A7B2B4',
  // muted: cool cyan-grey (moonlight, not firelight). ≈4.87:1 on surface.base #080A0D — clears WCAG AA 4.5:1.
  muted: '#6E827F',
  inverse: '#08161A'
} as const;

// SIGNATURE ACCENT - single living hue, run as a luminance LADDER, never one flat value.
// Assign by ROLE: core = the one live element on a screen; default = primary CTA;
// soft = decorative/structural cyan (gratings, arcs); muted = dim rims; glow = passive/idle states.
export const ACCENT_CORE = '#5BE9EC' as const;
export const ACCENT = '#33D2D6' as const;
export const ACCENT_SOFT = '#1E8C8F' as const;
export const ACCENT_GLOW = 'rgba(51,210,214,0.30)' as const;
export const ACCENT_MUTED = '#2B6166' as const;
// near-white hot core for believable light emission (3-stop glow temperature).
export const ACCENT_HOT = '#CFFAFB' as const;

export const accent = {
  core: ACCENT_CORE,
  default: ACCENT,
  soft: ACCENT_SOFT,
  glow: ACCENT_GLOW,
  muted: ACCENT_MUTED,
  hot: ACCENT_HOT,
  idle: ACCENT_GLOW,
  amber: '#6FE3E6',
  ember: '#26C3C8'
} as const;

export const verdict = {
  improving: '#5FD0B0',
  holding: '#8A9099',
  regressing: '#E0607A'
} as const;

export const data = {
  track: '#16201F',
  canvas: '#080C0E',
  heroGlow: 'rgba(51,200,214,0.10)',
  heroGlowStrong: 'rgba(51,200,214,0.16)'
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
    letterSpacing: 1.2
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
    response: { stiffness: 240, damping: 22, mass: 1 },
    toggle: { stiffness: 200, damping: 15, mass: 1 }
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
