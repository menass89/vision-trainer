# UI Overhaul — Balance-Inspired Glassmorphism

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the developer-facing Vision Trainer UI into a polished, publication-ready app with tab navigation, glassmorphism design, light/dark themes, and new screens (Home, Science, Settings).

**Architecture:** Replace the current two-column workspace with a tab-based SPA. Add `currentTab` and `theme` to Zustand store. Replace all 838 lines of hardcoded CSS with CSS custom properties for theming. New components: TabBar, HomeScreen, ScienceTab, SettingsScreen. Existing components (SessionFlow, ProgressDashboard, CalibrationPanel) are wrapped into tabs, not rewritten.

**Tech Stack:** React 19, TypeScript, Zustand 5, CSS custom properties, DM Serif Display + Inter fonts, Lucide icons.

---

### Task 1: CSS Custom Properties & Theme System

**Files:**
- Rewrite: `src/styles.css` (lines 1-11 — :root block)
- Create: `src/theme.ts`

- [ ] **Step 1: Create theme token file**

Create `src/theme.ts`:

```typescript
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
```

- [ ] **Step 2: Replace :root in styles.css**

Replace lines 1-11 of `src/styles.css` with:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');

:root {
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

[data-theme="dark"] { color-scheme: dark; }
[data-theme="light"] { color-scheme: light; }

* { box-sizing: border-box; }

body {
  margin: 0;
  min-height: 100vh;
  background: var(--gradient-bg);
  color: var(--text-primary);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: PASS (theme.ts is standalone, no imports needed yet)

---

### Task 2: Add theme + currentTab + monocular to Zustand store

**Files:**
- Modify: `src/types.ts`
- Modify: `src/store/useAppStore.ts`

- [ ] **Step 1: Add types**

Add to `src/types.ts` after `export type GoalType`:

```typescript
export type TabId = 'home' | 'train' | 'progress' | 'science' | 'settings';
```

Add to `UserProfile`:

```typescript
export type UserProfile = {
  id: string;
  createdAt: string;
  displayName: string;
  diagnosisType: GoalType | 'unspecified';
  targetCadencePerWeek: number;
  theme: 'dark' | 'light';
  monocularMode: boolean;
  monocularEye: 'left' | 'right';
};
```

- [ ] **Step 2: Add store actions**

Add to `AppState` type in `useAppStore.ts`:

```typescript
currentTab: TabId;
setCurrentTab: (tab: TabId) => void;
setTheme: (theme: 'dark' | 'light') => Promise<void>;
setMonocularMode: (enabled: boolean, eye?: 'left' | 'right') => Promise<void>;
```

Add default state:

```typescript
currentTab: 'home' as TabId,
```

Add `import { applyTheme } from '../theme';` and `import type { TabId } from '../types';` at top.

Add default profile fields:

```typescript
const defaultProfile: UserProfile = {
  id: 'local-user',
  createdAt: new Date().toISOString(),
  displayName: 'Local trainee',
  diagnosisType: 'unspecified',
  targetCadencePerWeek: 3,
  theme: 'dark',
  monocularMode: false,
  monocularEye: 'right',
};
```

Add implementations:

```typescript
setCurrentTab: (tab) => {
  set({ currentTab: tab });
},

setTheme: async (theme) => {
  applyTheme(theme);
  const profile = { ...get().profile, theme };
  await saveProfile(profile);
  set({ profile });
},

setMonocularMode: async (enabled, eye) => {
  const profile = {
    ...get().profile,
    monocularMode: enabled,
    ...(eye ? { monocularEye: eye } : {}),
  };
  await saveProfile(profile);
  set({ profile });
},
```

In `initialize`, after setting state, call:

```typescript
applyTheme(profile.theme ?? 'dark');
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 3: TabBar Component

**Files:**
- Create: `src/components/TabBar.tsx`

- [ ] **Step 1: Create TabBar**

```typescript
import { Home, Target, TrendingUp, Beaker, Settings } from 'lucide-react';
import type { TabId } from '../types';

type TabBarProps = {
  currentTab: TabId;
  onTabChange: (tab: TabId) => void;
};

const TABS: Array<{ id: TabId; icon: typeof Home; label: string }> = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'train', icon: Target, label: 'Train' },
  { id: 'progress', icon: TrendingUp, label: 'Progress' },
  { id: 'science', icon: Beaker, label: 'Science' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export function TabBar({ currentTab, onTabChange }: TabBarProps) {
  return (
    <nav className="tab-bar" aria-label="Main navigation">
      {TABS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          className={`tab ${currentTab === id ? 'tab--active' : ''}`}
          onClick={() => onTabChange(id)}
          aria-current={currentTab === id ? 'page' : undefined}
        >
          <Icon size={18} className="tab__icon" />
          <span className="tab__label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 4: HomeScreen Component

**Files:**
- Create: `src/components/HomeScreen.tsx`

- [ ] **Step 1: Create HomeScreen**

```typescript
import { PlayCircle } from 'lucide-react';
import { useMemo } from 'react';
import type { DashboardSnapshot, GamificationState, UserProfile } from '../types';
import { improvementPercent } from '../progress/csf';

type HomeScreenProps = {
  profile: UserProfile;
  dashboard: DashboardSnapshot;
  gamification: GamificationState;
  onStartSession: () => void;
};

export function HomeScreen({ profile, dashboard, gamification, onStartSession }: HomeScreenProps) {
  const completedSessions = useMemo(
    () => dashboard.sessions.filter((s) => s.status === 'completed').length,
    [dashboard.sessions]
  );

  const streak = useMemo(() => sessionStreak(dashboard.sessions), [dashboard.sessions]);

  const improvement = useMemo(
    () => improvementPercent(dashboard.thresholds),
    [dashboard.thresholds]
  );

  const weekDays = useMemo(() => buildWeekDays(dashboard.sessions), [dashboard.sessions]);

  const goalLabel = profile.diagnosisType === 'myopia' ? 'Myopia' :
    profile.diagnosisType === 'presbyopia' ? 'Presbyopia' : 'Sports Vision';

  const greeting = getGreeting();

  return (
    <section className="home-screen">
      <h2 className="home-greeting">{greeting}, {profile.displayName}</h2>
      <p className="home-subtitle">Day {completedSessions + 1} · {goalLabel} Program</p>

      <div className="streak-bar" aria-label="Weekly streak">
        {weekDays.map((day) => (
          <div key={day.label} className="streak-day">
            <span className="streak-day__label">{day.label}</span>
            <div className={`streak-dot streak-dot--${day.status}`}>
              {day.status === 'done' ? '✓' : day.status === 'today' ? '→' : ''}
            </div>
          </div>
        ))}
      </div>

      <div className="stat-row">
        <div className="stat-card glass-card">
          <span className="stat-value stat-value--primary">{completedSessions}</span>
          <span className="stat-label">Sessions</span>
        </div>
        <div className="stat-card glass-card">
          <span className="stat-value stat-value--success">+{improvement}%</span>
          <span className="stat-label">CS Gain</span>
        </div>
        <div className="stat-card glass-card">
          <span className="stat-value stat-value--warm">{streak}</span>
          <span className="stat-label">Streak</span>
        </div>
      </div>

      <div className="session-card glass-card">
        <span className="session-card__label">Today's Session</span>
        <h3 className="session-card__title">Session {String.fromCharCode(65 + (completedSessions % 4))}</h3>
        <p className="session-card__meta">~25 min</p>
        <button type="button" className="start-btn" onClick={onStartSession}>
          <PlayCircle size={18} />
          Start Training
        </button>
      </div>

      <div className="trend-mini glass-card">
        <div className="trend-mini__text">
          <strong>XP Progress</strong>
          <span>Level {gamification.level} · {gamification.xp} XP</span>
        </div>
        <div className="trend-spark" aria-hidden="true">
          {[0.2, 0.3, 0.3, 0.5, 0.5, 0.7, 1].map((opacity, i) => (
            <div key={i} className="trend-bar" style={{ height: `${6 + i * 2.5}px`, opacity }} />
          ))}
        </div>
      </div>
    </section>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function sessionStreak(sessions: DashboardSnapshot['sessions']): number {
  const completedDates = new Set(
    sessions
      .filter((s) => s.status === 'completed' && s.completedAt)
      .map((s) => s.completedAt?.slice(0, 10))
  );
  let streak = 0;
  const cursor = new Date();
  while (completedDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

type DayStatus = 'done' | 'today' | 'future';
type WeekDay = { label: string; status: DayStatus };

function buildWeekDays(sessions: DashboardSnapshot['sessions']): WeekDay[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

  const completedDates = new Set(
    sessions
      .filter((s) => s.status === 'completed' && s.completedAt)
      .map((s) => s.completedAt?.slice(0, 10))
  );

  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return labels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const todayStr = today.toISOString().slice(0, 10);
    const status: DayStatus = dateStr === todayStr ? 'today' : completedDates.has(dateStr) ? 'done' : 'future';
    return { label, status };
  });
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 5: ScienceTab Component

**Files:**
- Create: `src/components/ScienceTab.tsx`

- [ ] **Step 1: Create ScienceTab**

```typescript
import { ExternalLink } from 'lucide-react';

const SECTIONS = [
  {
    title: 'Perceptual Learning',
    body: 'Your brain can learn to see better. Neurons in your primary visual cortex (V1) become more sensitive to contrast through repeated practice with Gabor patterns — the same oriented stripe signals your eyes naturally detect. This is called perceptual learning, and it works even in adults.',
  },
  {
    title: 'Lateral Masking',
    body: 'When flanking patterns are placed near a target, they can either suppress or enhance your ability to detect it. Training with these flankers teaches your brain to reduce neural noise and amplify the signal — like tuning a radio to get clearer reception on the same frequency.',
  },
  {
    title: 'The Adaptive Staircase',
    body: 'Each trial adjusts difficulty based on your previous answers using a Bayesian algorithm called QUEST. If you get it right, the next one is harder. If you miss it, it gets easier. This keeps you training at exactly the right challenge level — your personal threshold.',
  },
  {
    title: 'What Improves',
    body: 'Published studies show improvements in contrast sensitivity (ability to detect faint patterns), visual acuity (sharpness measured in Snellen lines), and processing speed. These gains transfer to real-world tasks like reading and driving.',
  },
];

const STUDIES = [
  {
    authors: 'Polat U, Ma-Naim T, Belkin M, Sagi D',
    year: 2004,
    title: 'Improving vision in adult amblyopia by perceptual learning',
    journal: 'PNAS 101(17):6692-6697',
    url: 'https://doi.org/10.1073/pnas.0401200101',
  },
  {
    authors: 'Polat U, Ma-Naim T, Spierer A',
    year: 2009,
    title: 'Treatment of presbyopia with perceptual learning',
    journal: 'PNAS (FDA Phase II)',
    url: 'https://doi.org/10.1073/pnas.0908200106',
  },
  {
    authors: 'Polat U',
    year: 2009,
    title: 'Making perceptual learning practical to improve visual functions',
    journal: 'Vision Research 49(21):2566-2573',
    url: 'https://doi.org/10.1016/j.visres.2009.06.005',
  },
  {
    authors: 'Lev M, Polat U',
    year: 2015,
    title: 'Space and time in masking and crowding',
    journal: 'Journal of Vision 15(13):10',
    url: 'https://doi.org/10.1167/15.13.10',
  },
];

export function ScienceTab() {
  return (
    <section className="science-tab">
      <h2 className="science-tab__heading">How Vision Training Works</h2>
      <p className="science-tab__intro">
        This app is based on published neuroscience research. Here is how it works, in plain language.
      </p>

      <div className="science-cards">
        {SECTIONS.map((section) => (
          <article key={section.title} className="science-card glass-card">
            <h3 className="science-card__title">{section.title}</h3>
            <p className="science-card__body">{section.body}</p>
          </article>
        ))}
      </div>

      <h3 className="science-tab__subheading">Published Studies</h3>
      <div className="science-cards">
        {STUDIES.map((study) => (
          <article key={study.url} className="science-card glass-card">
            <h4 className="science-card__title">{study.title}</h4>
            <p className="science-card__body">
              {study.authors} ({study.year}). <em>{study.journal}</em>
            </p>
            <a
              href={study.url}
              target="_blank"
              rel="noopener noreferrer"
              className="science-card__link"
            >
              <ExternalLink size={14} />
              Read paper
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 6: SettingsScreen Component

**Files:**
- Create: `src/components/SettingsScreen.tsx`

- [ ] **Step 1: Create SettingsScreen**

```typescript
import { ChevronRight } from 'lucide-react';
import type { CalibrationProfile, GoalType, UserProfile } from '../types';
import type { Theme } from '../theme';

type SettingsScreenProps = {
  profile: UserProfile;
  calibration: CalibrationProfile;
  onUpdateCalibration: (cal: CalibrationProfile) => Promise<void>;
  onChangeTheme: (theme: Theme) => Promise<void>;
  onChangeGoal: (goal: GoalType) => void;
  onResetProgress: () => void;
};

export function SettingsScreen({
  profile,
  calibration,
  onChangeTheme,
  onChangeGoal,
  onResetProgress,
}: SettingsScreenProps) {
  const goalLabel = profile.diagnosisType === 'myopia' ? 'Myopia' :
    profile.diagnosisType === 'presbyopia' ? 'Presbyopia' :
    profile.diagnosisType === 'sports-vision' ? 'Sports Vision' : 'Not set';

  return (
    <section className="settings-screen">
      <h2 className="settings-screen__heading">Settings</h2>

      <div className="settings-group glass-card">
        <div className="setting-row">
          <span className="setting-row__label">Display Calibration</span>
          <span className="setting-row__value setting-row__value--success">
            Calibrated ✓
          </span>
        </div>
        <div className="setting-row">
          <span className="setting-row__label">Screen Distance</span>
          <span className="setting-row__value">{calibration.viewingDistanceCm} cm</span>
        </div>
      </div>

      <div className="settings-group glass-card">
        <div className="setting-row">
          <span className="setting-row__label">Appearance</span>
          <button
            type="button"
            className="setting-row__action"
            onClick={() => onChangeTheme(profile.theme === 'dark' ? 'light' : 'dark')}
          >
            {profile.theme === 'dark' ? 'Dark' : 'Light'}
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="setting-row">
          <span className="setting-row__label">Sound Effects</span>
          <div className="toggle toggle--on" aria-label="Sound effects enabled" />
        </div>
      </div>

      <div className="settings-group glass-card">
        <div className="setting-row">
          <span className="setting-row__label">Training Program</span>
          <button
            type="button"
            className="setting-row__action"
            onClick={() => {
              const goals: GoalType[] = ['myopia', 'presbyopia', 'sports-vision'];
              const idx = goals.indexOf(profile.diagnosisType as GoalType);
              onChangeGoal(goals[(idx + 1) % goals.length]);
            }}
          >
            {goalLabel}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="settings-group glass-card">
        <div className="setting-row">
          <span className="setting-row__label">Reset Progress</span>
          <button
            type="button"
            className="setting-row__action setting-row__action--danger"
            onClick={onResetProgress}
          >
            Reset
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 7: GoalSelection — Add Monocular Toggle

**Files:**
- Modify: `src/components/GoalSelection.tsx`

- [ ] **Step 1: Rewrite GoalSelection with monocular toggle**

Replace entire `src/components/GoalSelection.tsx`:

```typescript
import { Eye, Glasses, Zap } from 'lucide-react';
import { useState } from 'react';
import type { GoalType } from '../types';

type GoalSelectionProps = {
  onSelect: (goal: GoalType, monocular: boolean, eye: 'left' | 'right') => void;
};

const GOALS: Array<{ type: GoalType; icon: typeof Eye; label: string; description: string }> = [
  {
    type: 'myopia',
    icon: Eye,
    label: 'Myopia',
    description: 'Sharpen distance vision through contrast training',
  },
  {
    type: 'presbyopia',
    icon: Glasses,
    label: 'Presbyopia',
    description: 'Enhance near-focus clarity for reading',
  },
  {
    type: 'sports-vision',
    icon: Zap,
    label: 'Sports Vision',
    description: 'Faster visual processing & reaction time',
  },
];

export function GoalSelection({ onSelect }: GoalSelectionProps) {
  const [monocular, setMonocular] = useState(false);
  const [monocularEye, setMonocularEye] = useState<'left' | 'right'>('right');

  return (
    <section className="goal-selection" aria-labelledby="goal-heading">
      <h2 id="goal-heading" className="goal-selection__heading">Welcome to Vision Trainer</h2>
      <p className="goal-selection__subtitle">What would you like to improve?</p>

      <div className="goal-cards">
        {GOALS.map(({ type, icon: Icon, label, description }) => (
          <button
            key={type}
            type="button"
            className="goal-card glass-card"
            onClick={() => onSelect(type, monocular, monocularEye)}
          >
            <Icon size={28} />
            <h3>{label}</h3>
            <p>{description}</p>
          </button>
        ))}
      </div>

      <div className="mono-toggle glass-card">
        <div className="mono-toggle__text">
          <span className="mono-toggle__label">Monocular Training</span>
          <span className="mono-toggle__sub">Train each eye separately</span>
        </div>
        <button
          type="button"
          className={`toggle ${monocular ? 'toggle--on' : 'toggle--off'}`}
          onClick={() => setMonocular(!monocular)}
          aria-pressed={monocular}
        />
      </div>

      {monocular && (
        <div className="eye-picker glass-card">
          <span className="eye-picker__label">Which eye is weaker?</span>
          <div className="eye-picker__buttons">
            <button
              type="button"
              className={`eye-picker__btn ${monocularEye === 'left' ? 'eye-picker__btn--active' : ''}`}
              onClick={() => setMonocularEye('left')}
            >
              Left Eye
            </button>
            <button
              type="button"
              className={`eye-picker__btn ${monocularEye === 'right' ? 'eye-picker__btn--active' : ''}`}
              onClick={() => setMonocularEye('right')}
            >
              Right Eye
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 8: Rewrite App.tsx — Tab-Based Shell

**Files:**
- Rewrite: `src/App.tsx`

- [ ] **Step 1: Replace App.tsx**

```typescript
import { useEffect } from 'react';
import { Brain } from 'lucide-react';
import { GoalSelection } from './components/GoalSelection';
import { HomeScreen } from './components/HomeScreen';
import { TabBar } from './components/TabBar';
import { SessionFlow } from './components/SessionFlow';
import { ProgressDashboard } from './components/ProgressDashboard';
import { ScienceTab } from './components/ScienceTab';
import { SettingsScreen } from './components/SettingsScreen';
import { useAppStore } from './store/useAppStore';
import type { GoalType } from './types';
import './styles.css';

export default function App() {
  const ready = useAppStore((s) => s.ready);
  const profile = useAppStore((s) => s.profile);
  const calibration = useAppStore((s) => s.calibration);
  const dashboard = useAppStore((s) => s.dashboard);
  const gamification = useAppStore((s) => s.gamification);
  const currentTab = useAppStore((s) => s.currentTab);
  const initialize = useAppStore((s) => s.initialize);
  const setCurrentTab = useAppStore((s) => s.setCurrentTab);
  const setGoalType = useAppStore((s) => s.setGoalType);
  const setTheme = useAppStore((s) => s.setTheme);
  const setMonocularMode = useAppStore((s) => s.setMonocularMode);
  const updateCalibration = useAppStore((s) => s.updateCalibration);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (!ready) {
    return (
      <main className="loading-screen">
        <Brain size={32} />
        <span>Loading</span>
      </main>
    );
  }

  if (profile.diagnosisType === 'unspecified') {
    return (
      <main className="app-shell">
        <GoalSelection
          onSelect={(goal: GoalType, monocular: boolean, eye: 'left' | 'right') => {
            void setGoalType(goal);
            void setMonocularMode(monocular, eye);
          }}
        />
      </main>
    );
  }

  const renderTab = () => {
    switch (currentTab) {
      case 'home':
        return (
          <HomeScreen
            profile={profile}
            dashboard={dashboard}
            gamification={gamification}
            onStartSession={() => setCurrentTab('train')}
          />
        );
      case 'train':
        return <SessionFlow />;
      case 'progress':
        return <ProgressDashboard dashboard={dashboard} />;
      case 'science':
        return <ScienceTab />;
      case 'settings':
        return (
          <SettingsScreen
            profile={profile}
            calibration={calibration}
            onUpdateCalibration={updateCalibration}
            onChangeTheme={(theme) => setTheme(theme)}
            onChangeGoal={(goal) => void setGoalType(goal)}
            onResetProgress={() => {}}
          />
        );
    }
  };

  return (
    <main className="app-shell">
      <TabBar currentTab={currentTab} onTabChange={setCurrentTab} />
      <section className="tab-content">
        {renderTab()}
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: PASS (or minor type issues to fix)

---

### Task 9: Delete ModuleStatus + GamificationBar from layout

**Files:**
- Delete content of: `src/components/ModuleStatus.tsx` (replace with empty export)
- Note: GamificationBar is no longer imported in App.tsx so it's dead code but harmless

- [ ] **Step 1: Gut ModuleStatus**

Replace `src/components/ModuleStatus.tsx` with:

```typescript
export function ModuleStatus() {
  return null;
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 10: Rewrite styles.css — Glassmorphism Design System

**Files:**
- Rewrite: `src/styles.css`

This is the largest task. Replace the ENTIRE `src/styles.css` file. The new CSS uses `var()` tokens from theme.ts applied to `:root`, plus glassmorphism (`backdrop-filter`, translucent backgrounds, subtle borders).

- [ ] **Step 1: Write complete new styles.css**

The new file should contain approximately 650 lines covering:

1. **Base reset & body** — `background: var(--gradient-bg)`, `color: var(--text-primary)`, `min-width: 0` (remove 980px min)
2. **Loading screen** — centered, uses theme vars
3. **App shell** — `display: flex; flex-direction: column; min-height: 100vh;`
4. **Tab bar** — `display: flex`, `background: var(--bg-tab-bar)`, `backdrop-filter: var(--glass-blur)`, `border-bottom: 1px solid var(--border-subtle)`, sticky top
5. **Tab** — `flex: 1`, icon + label stacked, `color: var(--text-muted)`, active state: `color: var(--accent-primary)`, `border-bottom: 2px solid var(--accent-primary)`
6. **Tab content** — `flex: 1`, `overflow-y: auto`, `padding: 1.5rem`, `max-width: 720px`, `margin: 0 auto`
7. **Glass card** — `background: var(--bg-surface)`, `backdrop-filter: var(--glass-blur)`, `border: 1px solid var(--border-subtle)`, `border-radius: 16px`, `box-shadow: var(--shadow-card)`
8. **Home screen** — greeting (DM Serif Display), streak bar, stat row (3-col grid), session card, trend mini
9. **Streak dots** — `.streak-dot--done`: `background: var(--gradient-primary)`, `.streak-dot--today`: `background: var(--gradient-secondary)`, `.streak-dot--future`: `background: var(--bg-streak-future)`
10. **Stat values** — `.stat-value--primary`: `color: var(--accent-primary)`, `--success`: `var(--accent-secondary)`, `--warm`: `var(--accent-warm)`
11. **Start button** — `background: var(--gradient-primary)`, `color: #fff`, `box-shadow: var(--shadow-glow)`, `border-radius: 12px`
12. **Goal selection** — centered, max-width 520px, cards in 2-col grid with full-width third
13. **Mono toggle** — flex row, toggle switch styled
14. **Science tab** — heading, cards, study links with `color: var(--accent-secondary)`
15. **Settings** — grouped rows with borders, chevrons, toggle switches, danger color
16. **Toggle switch** — 34×19px, `border-radius: 10px`, pseudo-element ball, `--on` uses `var(--toggle-on)`, `--off` uses `var(--toggle-off)`
17. **Progress dashboard** — keep existing chart/threshold styles but migrate colors to vars
18. **Session flow / task** — keep existing task-stage, stimulus, response-grid styles but migrate to vars
19. **Calibration panel** — keep but migrate
20. **Responsive** — remove 980px min-width, add mobile-first breakpoint at 640px

CRITICAL: Preserve all `.task-stage`, `.stimulus-frame`, `.stimulus-canvas`, `.phase-overlay`, `.fixation`, `.interval-label`, `.inline-feedback`, `.feedback-dot`, `.response-grid`, `.choice-button`, `.choice-key`, `.instruction-card`, `.task-metrics`, `.task-panel`, `.task-layout`, `.task-footnote` classes — these are used by ContrastTask and must keep working. Migrate their hardcoded colors to `var()` tokens.

CRITICAL: Preserve all `.csf-chart`, `.chart-legend`, `.threshold-list`, `.assessment-report`, `.eye-chart`, `.dashboard-stats`, `.dashboard-panel` classes — used by ProgressDashboard. Migrate colors to `var()`.

CRITICAL: Preserve all `.calibration-panel`, `.calibration-grid`, `.calibration-summary` classes — used by CalibrationPanel. Migrate colors.

- [ ] **Step 2: Write the styles**

Due to the size of this file (~650 lines), the engineer should:
1. Start with the new base/reset/body/tab-bar/glass-card/toggle sections (new UI)
2. Keep all task-stage/stimulus/response/choice/chart/calibration blocks from the old CSS but replace every hardcoded color with the nearest `var()` token:
   - `#101820` → `var(--bg-base)`
   - `#17232b`, `#132027`, `#1d2d36` → `var(--bg-surface-solid)`
   - `#142129` → `var(--bg-tab-bar)` (or `var(--bg-surface-solid)`)
   - `#26333a`, `#344850`, `#33454d`, `#35505a`, `#3d5661` → `var(--border-medium)`
   - `#eef4f5`, `#eaf1f2`, `#f8fbfc` → `var(--text-primary)`
   - `#9fb3ba`, `#cfe0e4`, `#849ba3`, `#91a5ad` → `var(--text-secondary)`
   - `#28c7a0` → `var(--accent-secondary)`
   - `#f3c969` → `var(--accent-warm)`
   - `#ff6b6b`, `#ff4d5d` → `var(--accent-danger)`
   - `#273941` → `var(--bg-input)`
   - `#07100e` (button text on accent) → keep as-is (dark text on bright bg)
   - `#455d66` (chart grid) → `var(--border-medium)`

3. Remove the old `.workspace`, `.primary-column`, `.side-column` layout (replaced by tab system)
4. Remove `.app-header`, `.brand-lockup`, `.offline-pill`, `.gamification-bar`, `.level-block`, `.xp-track`, `.streak-block`, `.badge-block`, `.icon-button`, `.module-grid`, `.module-item`, `.module-panel` (all dead after refactor)
5. Remove old `.goal-selection`, `.goal-subtitle`, `.goal-cards`, `.goal-card` classes (replaced by new ones)

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: Build succeeds

---

### Task 11: Update index.html + PWA manifest

**Files:**
- Modify: `index.html`
- Modify: `vite.config.ts` (PWA theme_color)

- [ ] **Step 1: Update index.html**

Change the `<meta name="theme-color">` to `#0c0c1d`.

- [ ] **Step 2: Update vite.config.ts**

Change `theme_color` in VitePWA manifest from `#101820` to `#0c0c1d`.

- [ ] **Step 3: Final build**

Run: `npm run build`
Expected: PASS, production build in `dist/`

---

### Task 12: Manual Verification

- [ ] Open in browser (`npm run dev`)
- [ ] Verify: Goal Selection screen shows with monocular toggle
- [ ] Verify: After selecting goal, Home tab appears with streak, stats, session card
- [ ] Verify: Tab bar switches between Home / Train / Progress / Science / Settings
- [ ] Verify: Train tab shows SessionFlow (eye selector + start button)
- [ ] Verify: Science tab shows study cards with links
- [ ] Verify: Settings tab shows calibration, appearance toggle, program, reset
- [ ] Verify: Theme toggle switches light/dark
- [ ] Verify: All glassmorphism effects visible (blur, translucent cards, subtle borders)
- [ ] Verify: Starting a training session works end-to-end
