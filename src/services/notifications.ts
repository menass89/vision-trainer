/**
 * Notification service contract. The device build resolves `notifications.native.ts`
 * (real native notifications); this base impl is a no-op used on web and in tests so
 * the native dependency never enters the web bundle — mirroring the persistence split.
 */
export type NotificationService = {
  /** Returns true if reminders are permitted after the request. No-op (false) on web/tests. */
  requestRemindersPermission(): Promise<boolean>;
  /** Schedule (or reschedule) the single daily reminder at the given local time. */
  scheduleDailyReminder(hour: number, minute: number): Promise<void>;
  /** Cancel the daily reminder. */
  cancelDailyReminder(): Promise<void>;
};

const noopNotificationService: NotificationService = {
  async requestRemindersPermission() {
    return false;
  },
  async scheduleDailyReminder() {
    // No scheduling surface on web/tests.
  },
  async cancelDailyReminder() {
    // Nothing scheduled.
  },
};

export const notificationService: NotificationService = noopNotificationService;
