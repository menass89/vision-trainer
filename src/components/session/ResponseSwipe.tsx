import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { motion, radius, space, surface, text, type as typo } from '@/theme/tokens';
import type { TrialInterval } from '@/types';

export type ResponseSwipeProps = {
  onCommit: (choice: TrialInterval) => void;
  enabled: boolean;
};

function fireThresholdHaptic() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function ResponseSwipe({ enabled, onCommit }: ResponseSwipeProps) {
  const { width } = useWindowDimensions();
  const translationX = useSharedValue(0);
  const thresholdFired = useSharedValue(false);
  const threshold = width * 0.22;

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .onBegin(() => {
          thresholdFired.value = false;
        })
        .onUpdate((event) => {
          translationX.value = event.translationX;

          if (!thresholdFired.value && Math.abs(event.translationX) >= threshold) {
            thresholdFired.value = true;
            runOnJS(fireThresholdHaptic)();
          }
        })
        .onEnd(() => {
          const choice: TrialInterval | null =
            Math.abs(translationX.value) >= threshold ? (translationX.value < 0 ? 1 : 2) : null;

          if (choice) {
            runOnJS(onCommit)(choice);
          }
        })
        .onFinalize(() => {
          thresholdFired.value = false;
          translationX.value = withSpring(0, motion.spring.input);
        }),
    [enabled, onCommit, threshold, thresholdFired, translationX]
  );

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value * 0.3 },
      {
        rotateZ: `${interpolate(
          translationX.value,
          [-width / 2, width / 2],
          [-8, 8],
          Extrapolation.CLAMP
        )}deg`,
      },
    ],
  }));
  const leftLabelStyle = useAnimatedStyle(() => {
    const intensity = interpolate(
      translationX.value,
      [-threshold, 0],
      [1, 0.3],
      Extrapolation.CLAMP
    );

    return {
      color: interpolateColor(intensity, [0.3, 1], [text.secondary, text.primary]),
      opacity: intensity,
      transform: [{ scale: interpolate(intensity, [0.3, 1], [0.92, 1]) }],
    };
  });
  const rightLabelStyle = useAnimatedStyle(() => {
    const intensity = interpolate(
      translationX.value,
      [0, threshold],
      [0.3, 1],
      Extrapolation.CLAMP
    );

    return {
      color: interpolateColor(intensity, [0.3, 1], [text.secondary, text.primary]),
      opacity: intensity,
      transform: [{ scale: interpolate(intensity, [0.3, 1], [0.92, 1]) }],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        pointerEvents={enabled ? 'auto' : 'none'}
        style={[styles.layer, { opacity: enabled ? 1 : 0 }]}>
        <Animated.View style={[styles.indicator, indicatorStyle]}>
          <Animated.Text style={[styles.label, leftLabelStyle]}>1</Animated.Text>
          <View style={styles.track}>
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
          <Animated.Text style={[styles.label, rightLabelStyle]}>2</Animated.Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  layer: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  indicator: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.md,
  },
  label: {
    ...typo.caption,
    color: text.secondary,
  },
  track: {
    alignItems: 'center',
    backgroundColor: surface.overlay,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  dot: {
    backgroundColor: text.muted,
    borderRadius: radius.pill,
    height: 5,
    width: 5,
  },
});
