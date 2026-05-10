import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  AssessmentResult,
  CalibrationProfile,
  DichopticSettings,
  GamificationState,
  ParadigmId,
  SessionLog,
  ThresholdEstimate,
  TrialRecord,
  UserProfile
} from '../types';

const VALID_PARADIGMS: ReadonlySet<ParadigmId> = new Set<ParadigmId>([
  'contrast-detection',
  'lateral-masking',
  'spatial-masking',
  'backward-masking',
  'pedestal-discrimination'
]);

interface VisionTrainerDb extends DBSchema {
  profiles: {
    key: string;
    value: UserProfile;
  };
  calibrations: {
    key: string;
    value: CalibrationProfile;
    indexes: { 'by-created-at': string };
  };
  sessions: {
    key: string;
    value: SessionLog;
    indexes: { 'by-started-at': string; 'by-status': string };
  };
  trials: {
    key: string;
    value: TrialRecord;
    indexes: { 'by-session': string; 'by-condition': string; 'by-created-at': string };
  };
  thresholds: {
    key: string;
    value: ThresholdEstimate;
    indexes: { 'by-condition': string; 'by-created-at': string; 'by-session': string };
  };
  assessments: {
    key: string;
    value: AssessmentResult;
    indexes: { 'by-completed-at': string };
  };
  gamification: {
    key: string;
    value: GamificationState;
  };
  dichoptic: {
    key: string;
    value: DichopticSettings;
  };
}

let dbPromise: Promise<IDBPDatabase<VisionTrainerDb>> | null = null;

export function getDb(): Promise<IDBPDatabase<VisionTrainerDb>> {
  dbPromise ??= openDB<VisionTrainerDb>('vision-trainer', 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('profiles')) {
        db.createObjectStore('profiles', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('calibrations')) {
        const calibrations = db.createObjectStore('calibrations', { keyPath: 'id' });
        calibrations.createIndex('by-created-at', 'createdAt');
      }

      if (!db.objectStoreNames.contains('sessions')) {
        const sessions = db.createObjectStore('sessions', { keyPath: 'id' });
        sessions.createIndex('by-started-at', 'startedAt');
        sessions.createIndex('by-status', 'status');
      }

      if (!db.objectStoreNames.contains('trials')) {
        const trials = db.createObjectStore('trials', { keyPath: 'id' });
        trials.createIndex('by-session', 'sessionId');
        trials.createIndex('by-condition', 'conditionKey');
        trials.createIndex('by-created-at', 'createdAt');
      }

      if (!db.objectStoreNames.contains('thresholds')) {
        const thresholds = db.createObjectStore('thresholds', { keyPath: 'id' });
        thresholds.createIndex('by-condition', 'conditionKey');
        thresholds.createIndex('by-created-at', 'createdAt');
        thresholds.createIndex('by-session', 'sessionId');
      }

      if (!db.objectStoreNames.contains('assessments')) {
        const assessments = db.createObjectStore('assessments', { keyPath: 'id' });
        assessments.createIndex('by-completed-at', 'completedAt');
      }

      if (!db.objectStoreNames.contains('gamification')) {
        db.createObjectStore('gamification', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('dichoptic')) {
        db.createObjectStore('dichoptic', { keyPath: 'id' });
      }
    }
  });
  return dbPromise;
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const db = await getDb();
  await db.put('profiles', profile);
}

export async function saveCalibration(profile: CalibrationProfile): Promise<void> {
  const db = await getDb();
  await db.put('calibrations', profile);
}

export async function getLatestCalibration(): Promise<CalibrationProfile | undefined> {
  const db = await getDb();
  const all = await db.getAllFromIndex('calibrations', 'by-created-at');
  return all.at(-1);
}

export async function saveSession(session: SessionLog): Promise<void> {
  const db = await getDb();
  await db.put('sessions', session);
}

export async function saveTrial(trial: TrialRecord): Promise<void> {
  const db = await getDb();
  await db.put('trials', trial);
}

export async function saveThreshold(threshold: ThresholdEstimate): Promise<void> {
  const db = await getDb();
  await db.put('thresholds', threshold);
}

export async function saveAssessment(result: AssessmentResult): Promise<void> {
  const db = await getDb();
  await db.put('assessments', result);
}

export async function getGamification(): Promise<GamificationState | undefined> {
  const db = await getDb();
  return db.get('gamification', 'local-gamification');
}

export async function saveGamification(state: GamificationState): Promise<void> {
  const db = await getDb();
  await db.put('gamification', state);
}

export async function getDichopticSettings(): Promise<DichopticSettings | undefined> {
  const db = await getDb();
  return db.get('dichoptic', 'local-dichoptic');
}

export async function saveDichopticSettings(settings: DichopticSettings): Promise<void> {
  const db = await getDb();
  await db.put('dichoptic', settings);
}

export async function loadDashboardData() {
  const db = await getDb();
  const [sessions, trials, thresholds, assessments] = await Promise.all([
    db.getAllFromIndex('sessions', 'by-started-at'),
    db.getAllFromIndex('trials', 'by-created-at'),
    db.getAllFromIndex('thresholds', 'by-created-at'),
    db.getAllFromIndex('assessments', 'by-completed-at')
  ]);
  return { sessions: sessions.map(migrateSessionLog), trials, thresholds, assessments };
}

function migrateSessionLog(session: SessionLog): SessionLog {
  const blocks = session.plannedBlocks as unknown;
  if (!Array.isArray(blocks)) {
    return { ...session, plannedBlocks: [] };
  }
  if (blocks.length === 0) {
    return session;
  }
  // Legacy ParadigmId[] (any element a string) or malformed entries → drop.
  const isLegacy = blocks.every((block) => typeof block === 'string');
  if (isLegacy) {
    return { ...session, plannedBlocks: [] };
  }
  const isShapeValid = blocks.every((block) => {
    if (block === null || typeof block !== 'object') return false;
    const candidate = block as Record<string, unknown>;
    const condition = candidate.condition as Record<string, unknown> | null | undefined;
    return (
      typeof candidate.id === 'string' &&
      typeof candidate.label === 'string' &&
      typeof candidate.paradigm === 'string' &&
      VALID_PARADIGMS.has(candidate.paradigm as ParadigmId) &&
      typeof candidate.role === 'string' &&
      condition !== null &&
      typeof condition === 'object' &&
      typeof condition.paradigm === 'string' &&
      VALID_PARADIGMS.has(condition.paradigm as ParadigmId) &&
      Number.isFinite(condition.spatialFrequencyCpd) &&
      Number.isFinite(condition.orientationDeg) &&
      Number.isFinite(condition.trialsPerBlock)
    );
  });
  if (!isShapeValid) {
    return { ...session, plannedBlocks: [] };
  }
  return session;
}

export async function exportJson(): Promise<string> {
  const db = await getDb();
  const [profiles, calibrations, sessions, trials, thresholds, assessments, gamification, dichoptic] = await Promise.all([
    db.getAll('profiles'),
    db.getAll('calibrations'),
    db.getAll('sessions'),
    db.getAll('trials'),
    db.getAll('thresholds'),
    db.getAll('assessments'),
    db.getAll('gamification'),
    db.getAll('dichoptic')
  ]);
  return JSON.stringify({ profiles, calibrations, sessions, trials, thresholds, assessments, gamification, dichoptic }, null, 2);
}
