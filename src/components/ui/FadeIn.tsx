import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeIn as ReanimatedFadeIn } from 'react-native-reanimated';

export type FadeInProps = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
};

export function FadeIn({ children, delay = 0, duration = 280, style }: FadeInProps) {
  return (
    <Animated.View entering={ReanimatedFadeIn.delay(delay).duration(duration)} style={style}>
      {children}
    </Animated.View>
  );
}
