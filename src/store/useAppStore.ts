import { create } from 'zustand';
import { applyPhase, getTimePhase } from '../theme';
import type {
  AssessmentResult,
  CalibrationProfile,
  DashboardSnapshot,
  DichopticSettings,
  EyeMode,
  GamificationAward,
  GamificationState,
  GoalType,
  ParadigmId,
  SessionLog,
  SessionType,
  TabId,
  ThresholdEstimate,
  TimePhase,
  TrialRecord,
  UserProfile
} from '../types';
import { createBrowserCalibration, DEFAULT_CALIBRATION } from '../core/displayCalibration';
import {
  getDb,
  getLatestCalibration,
  getDichopticSettings,
  getGamification,
  loadDashboardData,
  saveCalibration,
  saveDichopticSettings,
  saveAssessment,
  saveGamification,
  saveProfile,
  saveSession,
  saveThreshold,
  saveTrial
} from '../data/db';
import { createSessionLog } from '../session/sessionPlanner';

type AppState = {
  ready: boolean;
  currentTab: TabId;
  timePhase: TimePhase;
  calibration: CalibrationProfile;
  profile: UserProfile;
  gamification: GamificationState;
  dichopticSettings: DichopticSettings;
  activeSession: SessionLog | null;
  dashboard: DashboardSnapshot;
  initialize: () => Promise<void>;
  updateCalibration: (profile: CalibrationProfile) => Promise<void>;
  startSession: (plannedBlocks?: ParadigmId[], eyeMode?: EyeMode, sessionType?: SessionType) => Promise<SessionLog>;
  updateSession: (session: SessionLog) => Promise<void>;
  abandonSession: () => Promise<void>;
  completeSession: () => Promise<void>;
  recordTrial: (trial: TrialRecord) => Promise<GamificationAward>;
  recordThreshold: (threshold: ThresholdEstimate) => Promise<void>;
  recordAssessment: (assessment: AssessmentResult) => Promise<void>;
  setGoalType: (goal: GoalType, name?: string) => Promise<void>;
  setCurrentTab: (tab: TabId) => void;
  setTimePhase: (phase: TimePhase) => void;
  setMonocularMode: (enabled: boolean, eye?: 'left' | 'right') => Promise<void>;
  refreshDashboard: () => Promise<void>;
};

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

const defaultGamification: GamificationState = {
  id: 'local-gamification',
  xp: 0,
  level: 1,
  earnedBadges: [],
  audioMuted: false,
  updatedAt: new Date().toISOString()
};

const defaultDichopticSettings: DichopticSettings = {
  id: 'local-dichoptic',
  dominantEye: 'right',
  redFilterEye: 'right',
  dominantContrast: 0.8,
  nonDominantContrast: 0.2,
  setupCompleted: false,
  updatedAt: new Date().toISOString()
};

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  currentTab: 'home' as TabId,
  timePhase: getTimePhase(),
  calibration: DEFAULT_CALIBRATION,
  profile: defaultProfile,
  gamification: defaultGamification,
  dichopticSettings: defaultDichopticSettings,
  activeSession: null,
  dashboard: {
    sessions: [],
    trials: [],
    thresholds: [],
    assessments: []
  },

  initialize: async () => {
    const db = await getDb();
    const storedProfile = await db.get('profiles', defaultProfile.id);
    const profile = {
      ...defaultProfile,
      ...storedProfile,
      theme: storedProfile?.theme ?? defaultProfile.theme,
      monocularMode: storedProfile?.monocularMode ?? defaultProfile.monocularMode,
      monocularEye: storedProfile?.monocularEye ?? defaultProfile.monocularEye
    };
    await saveProfile(profile);
    const calibration = (await getLatestCalibration()) ?? createBrowserCalibration();
    await saveCalibration(calibration);
    const gamification = (await getGamification()) ?? defaultGamification;
    const dichopticSettings = (await getDichopticSettings()) ?? defaultDichopticSettings;
    await saveGamification(gamification);
    await saveDichopticSettings(dichopticSettings);
    const dashboard = await loadDashboardData();
    const syncedGamification = await syncBadges(gamification, dashboard);
    const phase = getTimePhase();
    applyPhase(phase);
    set({ calibration, profile, dashboard, gamification: syncedGamification, dichopticSettings, ready: true, timePhase: phase });
  },

  updateCalibration: async (profile) => {
    await saveCalibration(profile);
    set({ calibration: profile });
  },

  startSession: async (plannedBlocks, eyeMode = 'both', sessionType = 'guided') => {
    const session = createSessionLog(get().calibration.id, plannedBlocks, eyeMode, sessionType);
    await saveSession(session);
    set({ activeSession: session });
    await get().refreshDashboard();
    return session;
  },

  updateSession: async (session) => {
    await saveSession(session);
    set({ activeSession: session });
    await get().refreshDashboard();
  },

  abandonSession: async () => {
    const activeSession = get().activeSession;
    if (!activeSession) {
      return;
    }
    const abandoned: SessionLog = {
      ...activeSession,
      status: 'abandoned'
    };
    await saveSession(abandoned);
    set({ activeSession: null });
    await get().refreshDashboard();
  },

  completeSession: async () => {
    const activeSession = get().activeSession;
    if (!activeSession) {
      return;
    }
    const completed: SessionLog = {
      ...activeSession,
      status: 'completed',
      completedAt: new Date().toISOString()
    };
    await saveSession(completed);
    set({ activeSession: null });
    await get().refreshDashboard();
    const syncedGamification = await syncBadges(get().gamification, get().dashboard);
    set({ gamification: syncedGamification });
  },

  recordTrial: async (trial) => {
    await saveTrial(trial);
    const award = awardXp(get().gamification, trial);
    await saveGamification(award.nextState);
    set({ gamification: award.nextState });
    const activeSession = get().activeSession;
    if (activeSession) {
      const updated = { ...activeSession, completedTrials: activeSession.completedTrials + 1 };
      await saveSession(updated);
      set({ activeSession: updated });
    }
    set((state) => ({ dashboard: { ...state.dashboard, trials: [...state.dashboard.trials, trial] } }));
    return award.result;
  },

  recordThreshold: async (threshold) => {
    await saveThreshold(threshold);
    set((state) => ({
      dashboard: { ...state.dashboard, thresholds: [...state.dashboard.thresholds, threshold] }
    }));
  },

  recordAssessment: async (assessment) => {
    await saveAssessment(assessment);
    set((state) => ({
      dashboard: { ...state.dashboard, assessments: [...state.dashboard.assessments, assessment] }
    }));
  },

  setGoalType: async (goal, name) => {
    const profile = { ...get().profile, diagnosisType: goal, ...(name ? { displayName: name } : {}) };
    await saveProfile(profile);
    set({ profile });
  },

  setCurrentTab: (tab) => {
    set({ currentTab: tab });
  },

  setTimePhase: (phase: TimePhase) => {
    applyPhase(phase);
    set({ timePhase: phase });
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

  refreshDashboard: async () => {
    const dashboard = await loadDashboardData();
    set({ dashboard });
  }
}));

export function levelForXp(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) {
    level += 1;
  }
  return level;
}

export function xpForLevel(level: number): number {
  if (level <= 1) {
    return 0;
  }
  if (level === 2) {
    return 200;
  }
  if (level === 3) {
    return 500;
  }
  return 500 + (level - 3) * 350;
}

function awardXp(state: GamificationState, trial: TrialRecord): { nextState: GamificationState; result: GamificationAward } {
  const frequencyMultiplier = 1 + Math.min(1.5, trial.stimulus.spatialFrequencyCpd / 12);
  const xpEarned = Math.round((10 + (trial.correct ? 5 : 0)) * frequencyMultiplier);
  const xp = state.xp + xpEarned;
  const levelBefore = state.level;
  const levelAfter = levelForXp(xp);
  return {
    nextState: {
      ...state,
      xp,
      level: levelAfter,
      updatedAt: new Date().toISOString()
    },
    result: {
      xpEarned,
      levelBefore,
      levelAfter,
      leveledUp: levelAfter > levelBefore
    }
  };
}

async function syncBadges(state: GamificationState, dashboard: DashboardSnapshot): Promise<GamificationState> {
  const completedSessions = dashboard.sessions.filter((session) => session.status === 'completed').length;
  const completedParadigms = new Set(dashboard.trials.map((trial) => trial.paradigm));
  const improvement = firstImprovement(dashboard.thresholds);
  const streak = sessionStreak(dashboard.sessions);
  const badgeChecks = [
    ['first-session', 'First Session', completedSessions >= 1],
    ['five-sessions', '5 Sessions', completedSessions >= 5],
    ['ten-sessions', '10 Sessions', completedSessions >= 10],
    ['first-improvement', 'First Improvement', improvement],
    ['three-day-streak', '3-Day Streak', streak >= 3],
    ['week-streak', 'Week Streak', streak >= 7],
    ['all-paradigms', 'All Paradigms Tried', completedParadigms.size >= 6]
  ] as const;

  const earnedIds = new Set(state.earnedBadges.map((badge) => badge.id));
  const earnedBadges = [...state.earnedBadges];
  const earnedAt = new Date().toISOString();
  for (const [id, label, earned] of badgeChecks) {
    if (earned && !earnedIds.has(id)) {
      earnedBadges.push({ id, label, earnedAt });
    }
  }

  if (earnedBadges.length === state.earnedBadges.length) {
    return state;
  }

  const updated = { ...state, earnedBadges, updatedAt: earnedAt };
  await saveGamification(updated);
  return updated;
}

function firstImprovement(thresholds: ThresholdEstimate[]): boolean {
  const byFrequency = new Map<number, ThresholdEstimate[]>();
  for (const threshold of thresholds) {
    const values = byFrequency.get(threshold.spatialFrequencyCpd) ?? [];
    values.push(threshold);
    byFrequency.set(threshold.spatialFrequencyCpd, values);
  }
  for (const values of byFrequency.values()) {
    values.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const first = values[0];
    const latest = values.at(-1);
    if (first && latest && latest.thresholdContrast < first.thresholdContrast) {
      return true;
    }
  }
  return false;
}

function sessionStreak(sessions: DashboardSnapshot['sessions']): number {
  const completedDates = new Set(
    sessions
      .filter((session) => session.status === 'completed' && session.completedAt)
      .map((session) => localDateKey(new Date(session.completedAt as string)))
  );
  let streak = 0;
  const cursor = new Date();
  while (completedDates.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
