export type Orientation = 0 | 45 | 90 | 135;

export type GoalType = 'myopia' | 'presbyopia' | 'sports-vision';

export type TabId = 'home' | 'train' | 'progress' | 'science' | 'settings';

export type EyeMode = 'both' | 'left' | 'right';

export type SessionType = 'guided';

export type DichopticMode = 'off' | 'red-only' | 'cyan-only';

export type ParadigmId =
  | 'contrast-detection'
  | 'lateral-masking'
  | 'spatial-masking'
  | 'backward-masking'
  | 'pedestal-discrimination';

export type CalibrationProfile = {
  id: string;
  createdAt: string;
  devicePixelRatio: number;
  screenWidthPx: number;
  screenHeightPx: number;
  dpi: number;
  viewingDistanceCm: number;
  gamma: number;
  refreshRateHz: number;
  backgroundLuminanceCdM2: number;
};

export type FlankerConfig = {
  enabled: boolean;
  mode: 'collinear' | 'orthogonal' | 'random';
  distanceLambda: number;
  contrast: number;
};

export type MaskConfig = {
  enabled: boolean;
  kind: 'surround' | 'full-field';
  contrast: number;
  elementCount: number;
  seed: number;
};

export type GaborStimulus = {
  spatialFrequencyCpd: number;
  orientationDeg: Orientation;
  contrast: number;
  phaseRad: number;
  durationMs: number;
  gaborSizeDeg?: number;
  backgroundLuminanceCdM2: number;
  dichopticMode?: DichopticMode;
  dichopticPartner?: {
    contrast: number;
    mode: DichopticMode;
  };
  flanker?: FlankerConfig;
  mask?: MaskConfig;
};

export type ContrastCondition = {
  paradigm: ParadigmId;
  spatialFrequencyCpd: number;
  orientationDeg: Orientation;
  trialsPerBlock: number;
  durationMs?: number;
  gaborSizeDeg?: number;
};

export type PlannedBlock = {
  id: string;
  label: string;
  paradigm: ParadigmId;
  condition: ContrastCondition;
  role: 'warm-up' | 'training' | 'assessment';
};

export type TrialInterval = 1 | 2;

export type TrialRecord = {
  id: string;
  sessionId: string;
  blockId: string;
  paradigm: ParadigmId;
  conditionKey: string;
  trialIndex: number;
  stimulus: GaborStimulus;
  targetInterval: TrialInterval;
  responseInterval: TrialInterval | null;
  correct: boolean;
  reactionTimeMs: number | null;
  intensityLog10: number;
  catchTrial: boolean;
  createdAt: string;
};

export type ThresholdEstimate = {
  id: string;
  sessionId: string;
  blockId: string;
  conditionKey: string;
  paradigm: ParadigmId;
  spatialFrequencyCpd: number;
  orientationDeg: Orientation;
  thresholdContrast: number;
  thresholdLog10: number;
  ciLow: number;
  ciHigh: number;
  trialCount: number;
  lapseRate: number;
  createdAt: string;
};

export type SessionLog = {
  id: string;
  startedAt: string;
  completedAt?: string;
  status: 'in-progress' | 'completed' | 'abandoned';
  eyeMode: EyeMode;
  sessionType: SessionType;
  calibrationId: string;
  protocolVersion: string;
  plannedBlocks: PlannedBlock[];
  completedTrials: number;
  metadata: Record<string, string | number | boolean>;
};

export type UserProfile = {
  id: string;
  createdAt: string;
  displayName: string;
  diagnosisType: GoalType | 'unspecified';
  targetCadencePerWeek: number;
  monocularMode: boolean;
  monocularEye: 'left' | 'right';
};

export type DashboardSnapshot = {
  sessions: SessionLog[];
  thresholds: ThresholdEstimate[];
  trials: TrialRecord[];
  assessments: AssessmentResult[];
};

export type BadgeId =
  | 'first-session'
  | 'five-sessions'
  | 'ten-sessions'
  | 'first-improvement'
  | 'three-day-streak'
  | 'week-streak'
  | 'all-paradigms';

export type EarnedBadge = {
  id: BadgeId;
  label: string;
  earnedAt: string;
};

export type GamificationState = {
  id: 'local-gamification';
  xp: number;
  level: number;
  earnedBadges: EarnedBadge[];
  audioMuted: boolean;
  updatedAt: string;
};

export type GamificationAward = {
  xpEarned: number;
  levelBefore: number;
  levelAfter: number;
  leveledUp: boolean;
};

export type DichopticSettings = {
  id: 'local-dichoptic';
  dominantEye: 'left' | 'right';
  redFilterEye: 'left' | 'right';
  dominantContrast: number;
  nonDominantContrast: number;
  setupCompleted: boolean;
  updatedAt: string;
};

export type AssessmentPoint = {
  spatialFrequencyCpd: number;
  thresholdContrast: number;
  sharpnessScore: number;
};

export type AssessmentResult = {
  id: string;
  startedAt: string;
  completedAt: string;
  eyeMode: EyeMode;
  points: AssessmentPoint[];
  estimatedAcuityChange: string;
};

export type TimePhase = 'dawn' | 'afternoon' | 'night';
