export type Theme = 'dark' | 'light';

export const darkTokens = {
  '--bg-base': '#0c0c1d',
  '--bg-surface': 'rgba(25, 23, 50, 0.5)',
  '--bg-surface-solid': '#191732',
  '--bg-elevated': 'rgba(25, 23, 50, 0.45)',
  '--bg-tab-bar': 'rgba(13, 13, 26, 0.6)',
  '--bg-input': '#1a1a35',
  '--bg-streak-future': 'rgba(30, 28, 55, 0.6)',
  '--border-subtle': 'rgba(120, 100, 200, 0.08)',
  '--border-medium': 'rgba(120, 100, 200, 0.1)',
  '--border-strong': 'rgba(120, 100, 200, 0.12)',
  '--border-streak-future': 'rgba(120, 100, 200, 0.08)',
  '--text-primary': '#f2f0f8',
  '--text-secondary': '#5e5d78',
  '--text-muted': '#3d3d5c',
  '--text-label': '#4e4d68',
  '--accent-primary': '#a78bfa',
  '--accent-primary-dim': '#7c6fe3',
  '--accent-secondary': '#5eead4',
  '--accent-secondary-dim': '#38c9a8',
  '--accent-warm': '#f4a261',
  '--accent-danger': '#f07070',
  '--gradient-primary': 'linear-gradient(135deg, #7c6fe3, #a78bfa)',
  '--gradient-secondary': 'linear-gradient(135deg, #38c9a8, #5eead4)',
  '--gradient-bg': 'linear-gradient(165deg, #0d0d1a 0%, #12112a 40%, #0e1420 100%)',
  '--shadow-glow': '0 4px 20px rgba(124, 111, 227, 0.35)',
  '--shadow-card': '0 4px 16px rgba(0,0,0,0.25)',
  '--shadow-streak-done': '0 2px 10px rgba(167, 139, 250, 0.35)',
  '--shadow-streak-today': '0 2px 10px rgba(94, 234, 212, 0.35)',
  '--glass-blur': 'blur(16px)',
  '--toggle-on': 'linear-gradient(135deg, #7c6fe3, #a78bfa)',
  '--toggle-off': 'rgba(40, 38, 65, 0.8)',
} as const;

export const lightTokens = {
  '--bg-base': '#f9f8fe',
  '--bg-surface': 'rgba(255, 255, 255, 0.55)',
  '--bg-surface-solid': '#ffffff',
  '--bg-elevated': 'rgba(255, 255, 255, 0.55)',
  '--bg-tab-bar': 'rgba(255, 255, 255, 0.65)',
  '--bg-input': '#f0edf8',
  '--bg-streak-future': 'rgba(255, 255, 255, 0.5)',
  '--border-subtle': 'rgba(109, 92, 189, 0.08)',
  '--border-medium': 'rgba(109, 92, 189, 0.1)',
  '--border-strong': 'rgba(109, 92, 189, 0.12)',
  '--border-streak-future': 'rgba(109, 92, 189, 0.1)',
  '--text-primary': '#1a1828',
  '--text-secondary': '#8a87a0',
  '--text-muted': '#b0adc0',
  '--text-label': '#8a87a0',
  '--accent-primary': '#6d5cbd',
  '--accent-primary-dim': '#8b7ad8',
  '--accent-secondary': '#1a9a80',
  '--accent-secondary-dim': '#30b89e',
  '--accent-warm': '#c87a30',
  '--accent-danger': '#d04040',
  '--gradient-primary': 'linear-gradient(135deg, #6d5cbd, #8b7ad8)',
  '--gradient-secondary': 'linear-gradient(135deg, #1a9a80, #30b89e)',
  '--gradient-bg': 'linear-gradient(165deg, #f9f8fe 0%, #f0edf8 40%, #f5f3fa 100%)',
  '--shadow-glow': '0 4px 20px rgba(109, 92, 189, 0.25)',
  '--shadow-card': '0 4px 16px rgba(109, 92, 189, 0.06)',
  '--shadow-streak-done': '0 2px 8px rgba(109, 92, 189, 0.3)',
  '--shadow-streak-today': '0 2px 8px rgba(26, 154, 128, 0.3)',
  '--glass-blur': 'blur(16px)',
  '--toggle-on': 'linear-gradient(135deg, #6d5cbd, #8b7ad8)',
  '--toggle-off': '#d0cddc',
} as const;

export function applyTheme(theme: Theme): void {
  const tokens = theme === 'dark' ? darkTokens : lightTokens;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value);
  }
  root.setAttribute('data-theme', theme);
}
