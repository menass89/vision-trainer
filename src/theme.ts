import type { TimePhase } from './types';

export type Theme = 'dark' | 'light';

const shared = {
  '--border-subtle': 'transparent',
  '--glass-blur': 'blur(8px)',
};

const dawnTokens = {
  ...shared,
  '--bg-base': '#faf5f0',
  '--bg-surface': 'rgba(255, 255, 255, 0.9)',
  '--bg-surface-solid': '#ffffff',
  '--bg-elevated': 'rgba(255, 255, 255, 0.92)',
  '--bg-tab-bar': 'rgba(250, 245, 240, 0.82)',
  '--bg-input': '#f0edf8',
  '--bg-streak-future': 'rgba(255, 255, 255, 0.5)',
  '--border-medium': 'rgba(109, 92, 189, 0.05)',
  '--border-strong': 'rgba(109, 92, 189, 0.08)',
  '--border-streak-future': 'rgba(109, 92, 189, 0.06)',
  '--text-primary': '#1a1828',
  '--text-secondary': '#8a87a0',
  '--text-muted': '#b0adc0',
  '--text-label': '#8a87a0',
  '--accent-primary': '#6558b0',
  '--accent-primary-dim': '#8070c8',
  '--accent-secondary': '#1a9078',
  '--accent-secondary-dim': '#2eaa90',
  '--accent-warm': '#c07530',
  '--accent-danger': '#c83838',
  '--gradient-primary': 'linear-gradient(135deg, #6558b0, #8070c8)',
  '--gradient-secondary': 'linear-gradient(135deg, #1a9078, #2eaa90)',
  '--gradient-bg': 'linear-gradient(165deg, #faf5f0 0%, #f5f0e8 40%, #faf5f0 100%)',
  '--shadow-glow': '0 4px 24px rgba(101, 88, 176, 0.2)',
  '--shadow-card': '0 2px 20px rgba(109, 92, 189, 0.08), 0 0 0 0.5px rgba(109, 92, 189, 0.04)',
  '--shadow-streak-done': '0 2px 10px rgba(101, 88, 176, 0.25)',
  '--shadow-streak-today': '0 2px 10px rgba(26, 144, 120, 0.25)',
  '--toggle-on': 'linear-gradient(135deg, #6558b0, #8070c8)',
  '--toggle-off': '#d0cddc',
  '--sky-top': '#e8ddf0',
  '--sky-bottom': '#e8a860',
  '--sclera': '#f0ecf4',
  '--scene-body': '#faf5f0',
} as const;

const afternoonTokens = {
  ...shared,
  '--bg-base': '#f5f2f8',
  '--bg-surface': 'rgba(255, 255, 255, 0.9)',
  '--bg-surface-solid': '#ffffff',
  '--bg-elevated': 'rgba(255, 255, 255, 0.92)',
  '--bg-tab-bar': 'rgba(245, 242, 248, 0.82)',
  '--bg-input': '#edeaf5',
  '--bg-streak-future': 'rgba(255, 255, 255, 0.5)',
  '--border-medium': 'rgba(109, 92, 189, 0.05)',
  '--border-strong': 'rgba(109, 92, 189, 0.08)',
  '--border-streak-future': 'rgba(109, 92, 189, 0.06)',
  '--text-primary': '#1a1828',
  '--text-secondary': '#8a87a0',
  '--text-muted': '#b0adc0',
  '--text-label': '#8a87a0',
  '--accent-primary': '#6558b0',
  '--accent-primary-dim': '#8070c8',
  '--accent-secondary': '#1a9078',
  '--accent-secondary-dim': '#2eaa90',
  '--accent-warm': '#c07530',
  '--accent-danger': '#c83838',
  '--gradient-primary': 'linear-gradient(135deg, #6558b0, #8070c8)',
  '--gradient-secondary': 'linear-gradient(135deg, #1a9078, #2eaa90)',
  '--gradient-bg': 'linear-gradient(165deg, #f5f2f8 0%, #edeaf5 40%, #f5f2f8 100%)',
  '--shadow-glow': '0 4px 24px rgba(101, 88, 176, 0.2)',
  '--shadow-card': '0 2px 20px rgba(109, 92, 189, 0.08), 0 0 0 0.5px rgba(109, 92, 189, 0.04)',
  '--shadow-streak-done': '0 2px 10px rgba(101, 88, 176, 0.25)',
  '--shadow-streak-today': '0 2px 10px rgba(26, 144, 120, 0.25)',
  '--toggle-on': 'linear-gradient(135deg, #6558b0, #8070c8)',
  '--toggle-off': '#d0cddc',
  '--sky-top': '#a8d8f0',
  '--sky-bottom': '#f0d888',
  '--sclera': '#f0ecf4',
  '--scene-body': '#f5f2f8',
} as const;

const nightTokens = {
  ...shared,
  '--bg-base': '#0b0b1e',
  '--bg-surface': 'rgba(22, 20, 45, 0.88)',
  '--bg-surface-solid': '#16142d',
  '--bg-elevated': 'rgba(28, 26, 52, 0.92)',
  '--bg-tab-bar': 'rgba(10, 10, 20, 0.82)',
  '--bg-input': '#1a1a35',
  '--bg-streak-future': 'rgba(28, 26, 52, 0.6)',
  '--border-medium': 'rgba(120, 100, 200, 0.04)',
  '--border-strong': 'rgba(120, 100, 200, 0.08)',
  '--border-streak-future': 'rgba(120, 100, 200, 0.04)',
  '--text-primary': '#f2f0f8',
  '--text-secondary': '#6b6a85',
  '--text-muted': '#3d3d5c',
  '--text-label': '#4e4d68',
  '--accent-primary': '#9b85e8',
  '--accent-primary-dim': '#7468c7',
  '--accent-secondary': '#5dd4c0',
  '--accent-secondary-dim': '#3db89e',
  '--accent-warm': '#e8a06a',
  '--accent-danger': '#e86868',
  '--gradient-primary': 'linear-gradient(135deg, #7468c7, #9b85e8)',
  '--gradient-secondary': 'linear-gradient(135deg, #3db89e, #5dd4c0)',
  '--gradient-bg': 'linear-gradient(165deg, #0a0a1a 0%, #11102a 40%, #0d1320 100%)',
  '--shadow-glow': '0 4px 24px rgba(116, 104, 199, 0.3)',
  '--shadow-card': '0 2px 24px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(120, 100, 200, 0.06)',
  '--shadow-streak-done': '0 2px 12px rgba(155, 133, 232, 0.3)',
  '--shadow-streak-today': '0 2px 12px rgba(93, 212, 192, 0.3)',
  '--toggle-on': 'linear-gradient(135deg, #7468c7, #9b85e8)',
  '--toggle-off': 'rgba(40, 38, 65, 0.8)',
  '--sky-top': '#0d1025',
  '--sky-bottom': '#2a1878',
  '--sclera': '#4a4268',
  '--scene-body': '#0b0b1e',
} as const;

const phaseTokens = {
  dawn: dawnTokens,
  afternoon: afternoonTokens,
  night: nightTokens,
} as const;

export function getTimePhase(): TimePhase {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'dawn';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'night';
}

export function phaseToTheme(phase: TimePhase): Theme {
  return phase === 'night' ? 'dark' : 'light';
}

export function applyPhase(phase: TimePhase): void {
  const tokens = phaseTokens[phase];
  const root = document.documentElement;
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value);
  }
  root.setAttribute('data-theme', phaseToTheme(phase));
  root.setAttribute('data-phase', phase);
}

// Keep for backward compat during migration
export const darkTokens = nightTokens;
export const lightTokens = dawnTokens;
export function applyTheme(theme: Theme): void {
  applyPhase(theme === 'dark' ? 'night' : 'dawn');
}
