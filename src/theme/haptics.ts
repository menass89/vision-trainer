import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const ok = Platform.OS !== 'web';
const run = (fn: () => Promise<unknown>) => {
  if (!ok) return;
  try {
    fn().catch(() => {});
  } catch {}
};

export const haptics = {
  select: () => run(() => Haptics.selectionAsync()),
  correct: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  wrong: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  milestone: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  numberSettle: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  rewardChord: () => {
    run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    if (ok) {
      setTimeout(() => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)), 120);
      setTimeout(() => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)), 240);
    }
  }
} as const;
