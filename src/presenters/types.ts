export type Verdict = 'improving' | 'holding' | 'regressing';

export type TodayView = {
  /** log10 contrast sensitivity — the hero figure */
  contrastSensitivity: number;
  /** 0..1 — today's target completion, drives the arc fill */
  dailyProgress: number;
  streakDays: number;
  sessionDoneToday: boolean;
  /** e.g. "6 cpd · 4 min" */
  nextTargetLabel: string;
  verdict: Verdict;
};

export type SparkPoint = { day: string; value: number };
export type CsfPoint = { spatialFrequency: number; sensitivity: number };

export type ProgressView = {
  /** Cash-App oversized numeral */
  headlineAcuity: number;
  verdict: Verdict;
  /** signed delta vs previous period */
  delta: number;
  sparkline: SparkPoint[];
  csf: CsfPoint[];
};

export type SettingsState = {
  dichopticEnabled: boolean;
  monocularWeakEye: 'left' | 'right' | 'off';
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  reduceMotion: boolean;
};

export type Loadable<T> = { data: T; isLoading: boolean };

export type SettingsController = {
  state: SettingsState;
  set: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
};
