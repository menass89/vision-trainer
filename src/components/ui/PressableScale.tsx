import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { haptics } from '@/theme/haptics';
import { motion } from '@/theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Pick<
  PressableProps,
  | 'accessibilityRole'
  | 'accessibilityLabel'
  | 'accessibilityHint'
  | 'accessibilityState'
  | 'testID'
> & {
  onPress?: () => void;
  onLongPress?: () => void;
  haptic?: 'select' | 'correct' | 'wrong' | 'milestone' | 'none' | 'selection';
  scaleTo?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  hitSlop?: number;
};

export function PressableScale({
  onPress,
  onLongPress,
  haptic = 'select',
  scaleTo = motion.pressScale,
  disabled = false,
  style,
  children,
  hitSlop,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  testID,
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(scaleTo, motion.spring.press);

    if (haptic === 'selection') {
      haptics.select();
    } else if (haptic !== 'none') {
      haptics[haptic]();
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, motion.spring.press);
  };

  return (
    <AnimatedPressable
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      testID={testID}
      onLongPress={onLongPress}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle, disabled && styles.disabled]}>
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.4,
  },
});
