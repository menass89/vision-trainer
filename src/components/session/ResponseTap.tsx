import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppText, Bloom } from '@/components/ui';
import { haptics } from '@/theme/haptics';
import { ACCENT_CORE, ACCENT_GLOW, motion, space, surface, text } from '@/theme/tokens';
import type { TrialInterval } from '@/types';

export type ResponseTapProps = {
  enabled: boolean;
  onCommit: (choice: TrialInterval) => void;
};

const COMMIT_DWELL_MS = 180;
const HALO_SIZE = 144;

export function ResponseTap({ enabled, onCommit }: ResponseTapProps) {
  const reduceMotion = useReducedMotion();
  const breathe = useSharedValue(0.5);
  const leftFeedback = useSharedValue(0);
  const rightFeedback = useSharedValue(0);
  const committedRef = useRef(false);
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    cancelAnimation(breathe);

    if (!enabled || reduceMotion) {
      breathe.value = 0.5;
      return;
    }

    breathe.value = 0;
    breathe.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    return () => cancelAnimation(breathe);
  }, [breathe, enabled, reduceMotion]);

  useEffect(() => {
    if (enabled) {
      committedRef.current = false;
      leftFeedback.value = 0;
      rightFeedback.value = 0;
    }
  }, [enabled, leftFeedback, rightFeedback]);

  useEffect(
    () => () => {
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    },
    []
  );

  const commitChoice = useCallback(
    (choice: TrialInterval) => {
      if (!enabled || committedRef.current) return;

      committedRef.current = true;
      leftFeedback.value = withTiming(choice === 1 ? 1 : -1, { duration: 120 });
      rightFeedback.value = withTiming(choice === 2 ? 1 : -1, { duration: 120 });
      const chosenFeedback = choice === 1 ? leftFeedback : rightFeedback;

      chosenFeedback.value = withSpring(1, motion.spring.reward);
      haptics.select();

      commitTimerRef.current = setTimeout(() => {
        onCommit(choice);
      }, COMMIT_DWELL_MS);
    },
    [enabled, leftFeedback, onCommit, rightFeedback]
  );

  const leftHaloStyle = useAnimatedStyle(() => {
    const pulse = breathe.value;
    const lift = Math.max(leftFeedback.value, 0);
    const dim = Math.min(leftFeedback.value, 0);

    return {
      opacity: interpolate(pulse, [0, 1], [0.5, 0.85]) * (1 + dim * 0.45) + lift * 0.3,
      transform: [{ scale: interpolate(pulse, [0, 1], [0.96, 1.04]) + lift * 0.12 }],
    };
  });
  const rightHaloStyle = useAnimatedStyle(() => {
    const pulse = 1 - breathe.value;
    const lift = Math.max(rightFeedback.value, 0);
    const dim = Math.min(rightFeedback.value, 0);

    return {
      opacity: interpolate(pulse, [0, 1], [0.5, 0.85]) * (1 + dim * 0.45) + lift * 0.3,
      transform: [{ scale: interpolate(pulse, [0, 1], [0.96, 1.04]) + lift * 0.12 }],
    };
  });

  return (
    <Animated.View
      accessibilityElementsHidden={!enabled}
      importantForAccessibility={enabled ? 'auto' : 'no-hide-descendants'}
      pointerEvents={enabled ? 'auto' : 'none'}
      style={[styles.layer, { opacity: enabled ? 1 : 0 }]}>
      <View pointerEvents="none" style={styles.divider} />
      <Pressable
        accessibilityLabel="The first flash had the pattern"
        accessibilityRole="button"
        disabled={!enabled}
        onPress={() => commitChoice(1)}
        style={[styles.tapZone, styles.leftTapZone]}
      />
      <Pressable
        accessibilityLabel="The second flash had the pattern"
        accessibilityRole="button"
        disabled={!enabled}
        onPress={() => commitChoice(2)}
        style={[styles.tapZone, styles.rightTapZone]}
      />
      <View pointerEvents="none" style={styles.coachRow}>
        <View style={styles.coachHalf}>
          <Animated.View style={[styles.halo, leftHaloStyle]}>
            <Bloom color={ACCENT_GLOW} core={ACCENT_CORE} />
            <AppText color="secondary" style={styles.numeral} variant="title">
              1
            </AppText>
          </Animated.View>
        </View>
        <View style={styles.coachHalf}>
          <Animated.View style={[styles.halo, rightHaloStyle]}>
            <Bloom color={ACCENT_GLOW} core={ACCENT_CORE} />
            <AppText color="secondary" style={styles.numeral} variant="title">
              2
            </AppText>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  coachHalf: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  coachRow: {
    bottom: '22%',
    flexDirection: 'row',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  divider: {
    backgroundColor: surface.hairline,
    bottom: 0,
    left: '50%',
    opacity: 0.4,
    position: 'absolute',
    top: 0,
    width: StyleSheet.hairlineWidth,
  },
  halo: {
    alignItems: 'center',
    height: HALO_SIZE,
    justifyContent: 'center',
    width: HALO_SIZE,
  },
  layer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  leftTapZone: {
    left: 0,
  },
  numeral: {
    color: text.secondary,
    opacity: 0.62,
    paddingBottom: space.xs,
  },
  rightTapZone: {
    right: 0,
  },
  tapZone: {
    bottom: 0,
    position: 'absolute',
    top: 0,
    width: '50%',
  },
});
