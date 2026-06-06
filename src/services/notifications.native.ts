import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { NotificationService } from './notifications';

const DAILY_REMINDER_KIND = 'daily-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function cancelScheduledDailyReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const dailyReminders = scheduled.filter(
    (notification) => notification.content.data?.kind === DAILY_REMINDER_KIND
  );

  await Promise.all(
    dailyReminders.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier)
    )
  );
}

export const notificationService: NotificationService = {
  async requestRemindersPermission() {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (current.canAskAgain === false) return false;
    const next = await Notifications.requestPermissionsAsync();
    return next.granted;
  },

  async scheduleDailyReminder(hour: number, minute: number) {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily-reminder', {
        name: 'Daily reminder',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    await cancelScheduledDailyReminders();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to train your vision',
        body: 'A few quiet minutes keeps your streak and your gains alive.',
        data: { kind: DAILY_REMINDER_KIND },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        ...(Platform.OS === 'android' ? { channelId: 'daily-reminder' } : {}),
      },
    });
  },

  async cancelDailyReminder() {
    await cancelScheduledDailyReminders();
  },
};
