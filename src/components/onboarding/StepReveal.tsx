import type { ReactNode } from 'react';
import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

export type StepRevealProps = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  lift?: number;
  style?: StyleProp<ViewStyle>;
};

// Calm Sleep / How We Feel: each line resolves from the dark a beat after the last,
// so the copy reads as something settling into focus rather than a card appearing.
export function StepReveal({
  children,
  delay = 0,
  duration = 360,
  lift = 10,
  style,
}: StepRevealProps) {
  const progress = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) }),
    );
  }, [delay, duration, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: lift * (1 - progress.value) }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
