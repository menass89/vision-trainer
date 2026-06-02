export type Verdict = 'improving' | 'holding' | 'regressing';

export type TodayView = {
  /** log10 contrast sensitivity — the hero figure */
  contrastSensitivity: number;
  /** 0..1 — today's target completion, drives the arc fill */
  dailyProgress: number;
  streakDays: number;
  sessionDoneToday: boolean;
  /** 0=Sun ... 6=Sat */
  todayIndex: number;
  /** completion flags for this local week, Sun..Sat — drives the week dots honestly */
  weekDays: boolean[];
  /** e.g. "6 cpd · 4 min" */
  nextTargetLabel: string;
  verdict: Verdict;
};

export type SparkPoint = { day: string; value: number };
export type CsfPoint = { spatialFrequency: number; sensitivity: number };

export type ProgressView = {
  /** Cash-App oversized numeral */
  headlineAcuity: number;
  previousAcuity: number;
  verdict: Verdict;
  /** signed delta vs previous period */
  delta: number;
  sparkline: SparkPoint[];
  csf: CsfPoint[];
  csfReferences: { label: string; sensitivity: number }[];
  contributors: { label: string; sensitivity: number; norm: number }[];
};

export type SettingsState = {
  dichopticEnabled: boolean;
  monocularWeakEye: 'left' | 'right' | 'off';
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  reduceMotion: boolean;
  remindersEnabled: boolean;
  onboardingComplete: boolean;
};

export type Loadable<T> = { data: T; isLoading: boolean };

export type SettingsController = {
  state: SettingsState;
  set: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
};
