import { describe, expect, it } from 'vitest';

import {
  computeStreak,
  isSameLocalDay,
  localDayKey,
  localDayKeyFromIso,
  todayIndex,
  weekCompletion,
  weekdayShortFromIso,
} from './clock';

describe('clock', () => {
  it('returns the local weekday index', () => {
    expect(todayIndex(new globalThis.Date(2026, 4, 31))).toBe(0);
    expect(todayIndex(new globalThis.Date(2026, 5, 1))).toBe(1);
  });

  it('formats a zero-padded local calendar day key', () => {
    expect(localDayKey(new globalThis.Date(2026, 0, 9))).toBe('2026-01-09');
  });

  it('compares local calendar days', () => {
    expect(
      isSameLocalDay(new globalThis.Date(2026, 4, 31, 1), new globalThis.Date(2026, 4, 31, 23))
    ).toBe(true);
    expect(
      isSameLocalDay(new globalThis.Date(2026, 4, 30, 23), new globalThis.Date(2026, 4, 31, 1))
    ).toBe(false);
  });

  it('returns zero for an empty streak', () => {
    expect(computeStreak([], new globalThis.Date(2026, 4, 31))).toBe(0);
  });

  it('counts consecutive completed days including today', () => {
    expect(
      computeStreak(['2026-05-29', '2026-05-30', '2026-05-31'], new globalThis.Date(2026, 4, 31))
    ).toBe(3);
  });

  it('keeps yesterday-ending streaks alive during today', () => {
    expect(
      computeStreak(['2026-05-28', '2026-05-29', '2026-05-30'], new globalThis.Date(2026, 4, 31))
    ).toBe(3);
  });

  it('stops counting at a gap', () => {
    expect(
      computeStreak(
        ['2026-05-27', '2026-05-29', '2026-05-30', '2026-05-31'],
        new globalThis.Date(2026, 4, 31)
      )
    ).toBe(3);
  });

  it('maps completed days onto the local Sun..Sat week, fabricating none', () => {
    // Wed 2026-06-03 → week starts Sun 2026-05-31.
    expect(
      weekCompletion(['2026-06-01', '2026-06-03'], new globalThis.Date(2026, 5, 3))
    ).toEqual([false, true, false, true, false, false, false]);
  });

  it('ignores completed days outside the current week', () => {
    // Sun 2026-05-31 starts its own week; the prior Sat belongs to last week.
    expect(
      weekCompletion(['2026-05-30', '2026-05-31'], new globalThis.Date(2026, 4, 31))
    ).toEqual([true, false, false, false, false, false, false]);
  });

  it('formats a local calendar day key from an ISO timestamp', () => {
    const date = new globalThis.Date(2026, 4, 31);

    expect(localDayKeyFromIso(date.toISOString())).toBe(localDayKey(date));
  });

  it('formats a short local weekday from an ISO timestamp', () => {
    const date = new globalThis.Date(2026, 4, 31);
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    expect(weekdayShortFromIso(date.toISOString())).toBe(weekdays[date.getDay()]);
  });
});
