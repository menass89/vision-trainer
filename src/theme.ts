import type { TimePhase } from './types';

export type Theme = 'dark' | 'light';

const clinicalTokens = {
  '--bg-base': 'oklch(0.15 0.008 195)',
  '--bg-surface': 'oklch(0.19 0.010 195)',
  '--bg-surface-solid': 'oklch(0.19 0.010 195)',
  '--bg-elevated': 'oklch(0.23 0.012 195)',
  '--bg-tab-bar': 'oklch(0.17 0.009 195 / 0.96)',
  '--bg-input': 'oklch(0.21 0.010 195)',
  '--bg-streak-future': 'oklch(0.23 0.012 195 / 0.45)',
  '--border-hairline': 'oklch(0.30 0.012 195 / 0.5)',
  '--border-subtle': 'oklch(0.30 0.012 195 / 0.5)',
  '--border-medium': 'oklch(0.30 0.012 195 / 0.7)',
  '--border-strong': 'oklch(0.40 0.014 195 / 0.75)',
  '--border-streak-future': 'oklch(0.30 0.012 195 / 0.5)',
  '--text-primary': 'oklch(0.97 0.004 195)',
  '--text-secondary': 'oklch(0.72 0.010 195)',
  '--text-muted': 'oklch(0.52 0.010 195)',
  '--text-label': 'oklch(0.52 0.010 195)',
  '--signal': 'oklch(0.84 0.15 178)',
  '--signal-dim': 'oklch(0.70 0.13 178)',
  '--zone-amber': 'oklch(0.83 0.15 85)',
  '--zone-coral': 'oklch(0.70 0.18 25)',
  '--zone-violet': 'oklch(0.65 0.20 300)',
  '--accent-primary': 'oklch(0.84 0.15 178)',
  '--accent-primary-dim': 'oklch(0.70 0.13 178)',
  '--accent-secondary': 'oklch(0.84 0.15 178)',
  '--accent-secondary-dim': 'oklch(0.70 0.13 178)',
  '--accent-warm': 'oklch(0.83 0.15 85)',
  '--accent-danger': 'oklch(0.70 0.18 25)',
  '--gradient-signal': 'linear-gradient(135deg, var(--signal-dim), var(--signal))',
  '--gradient-primary': 'linear-gradient(135deg, var(--signal-dim), var(--signal))',
  '--gradient-secondary': 'linear-gradient(135deg, var(--signal-dim), var(--signal))',
  '--gradient-bg': 'var(--bg-base)',
  '--shadow-card': '0 2px 24px rgba(0,0,0,0.45), 0 0 0 1px oklch(0.30 0.012 195 / 0.5)',
  '--glow-signal': '0 0 40px -8px oklch(0.84 0.15 178 / 0.45)',
  '--shadow-glow': '0 0 40px -8px oklch(0.84 0.15 178 / 0.45)',
  '--shadow-streak-done': '0 0 18px -5px oklch(0.84 0.15 178 / 0.7)',
  '--shadow-streak-today': '0 0 18px -5px oklch(0.84 0.15 178 / 0.55)',
  '--toggle-on': 'var(--signal)',
  '--toggle-off': 'oklch(0.30 0.012 195)',
  '--glass-blur': 'none',
  '--sky-top': 'oklch(0.19 0.010 195)',
  '--sky-bottom': 'oklch(0.15 0.008 195)',
  '--sclera': 'oklch(0.72 0.010 195)',
  '--scene-body': 'oklch(0.15 0.008 195)',
} as const;

export function getTimePhase(): TimePhase {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'dawn';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'night';
}

export function phaseToTheme(_phase: TimePhase): Theme {
  return 'dark';
}

export function applyPhase(_phase: TimePhase): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(clinicalTokens)) {
    root.style.setProperty(key, value);
  }
  root.setAttribute('data-theme', 'dark');
  root.removeAttribute('data-phase');
}

export const darkTokens = clinicalTokens;
export const lightTokens = clinicalTokens;

export function applyTheme(_theme: Theme): void {
  applyPhase(getTimePhase());
}
