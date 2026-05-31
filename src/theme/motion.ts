import { Easing, withSpring, withTiming, type WithSpringConfig } from 'react-native-reanimated';

import { motion } from '@/theme/tokens';

export const easings = {
  out: Easing.out(Easing.cubic),
  inOut: Easing.inOut(Easing.cubic),
  linear: Easing.linear
} as const;

export const spring = motion.spring;
export const timing = motion.timing;

export function springTo(value: number, config: WithSpringConfig = motion.spring.press) {
  'worklet';
  return withSpring(value, config);
}

export function fadeUpTiming(d = motion.timing.entranceMs) {
  'worklet';
  return withTiming(1, { duration: d, easing: easings.out });
}
