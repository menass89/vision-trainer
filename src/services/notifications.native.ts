import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { NotificationService } from './notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const notificationService: NotificationService = {
  async requestRemindersPermission() {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (current.canAskAgain === false) return false;
    const next = await Notifications.requestPermissionsAsync();
    return next.granted;
  },

  async scheduleDailyReminder(hour, minute) {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily-reminder', {
        name: 'Daily reminder',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to train your vision',
        body: 'A few quiet minutes keeps your streak and your gains alive.',
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
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
};
