import { describe, expect, it } from 'vitest';
import { notificationService } from './notifications';

describe('notificationService (base/web)', () => {
  it('reports reminders as not permitted without throwing', async () => {
    await expect(notificationService.requestRemindersPermission()).resolves.toBe(false);
  });
  it('schedule/cancel are safe no-ops', async () => {
    await expect(notificationService.scheduleDailyReminder(19, 0)).resolves.toBeUndefined();
    await expect(notificationService.cancelDailyReminder()).resolves.toBeUndefined();
  });
});
