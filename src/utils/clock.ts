/** 0=Sun … 6=Sat, local time. */
export function todayIndex(date: Date = new Date()): number {
  return date.getDay();
}

/** Local calendar day key 'YYYY-MM-DD'. */
export function localDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return localDayKey(a) === localDayKey(b);
}

/**
 * Consecutive-day streak ending today (or yesterday — a streak stays "alive"
 * during today until midnight even before today's session).
 * @param completedDayKeys local-day-key strings of completed sessions (any order, dups ok)
 */
export function computeStreak(completedDayKeys: string[], now: Date = new Date()): number {
  const days = new Set(completedDayKeys);
  const cursor = new Date(now);
  if (!days.has(localDayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(localDayKey(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(localDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** The single ambient-clock accessor for the whole app. */
export function now(): Date {
  return new Date();
}

export function parseIsoDate(iso: string): Date {
  return new Date(iso);
}

export function localDayKeyFromIso(iso: string): string {
  return localDayKey(new Date(iso));
}

export function weekdayShortFromIso(iso: string): string {
  return WEEKDAY_SHORT[new Date(iso).getDay()];
}
