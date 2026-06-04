import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/ui';
import { haptics } from '@/theme/haptics';
import { ACCENT, ACCENT_GLOW, motion, radius, surface, text } from '@/theme/tokens';

export type ToggleProps = {
  accessibilityLabel?: string;
  disabled?: boolean;
  onChange: (value: boolean) => void;
  value: boolean;
};

const TRACK_WIDTH = 48;
const TRACK_HEIGHT = 28;
const KNOB_SIZE = 22;
const KNOB_INSET = 3;
const KNOB_TRAVEL = TRACK_WIDTH - KNOB_SIZE - KNOB_INSET * 2;

export function Toggle({ accessibilityLabel, disabled = false, onChange, value }: ToggleProps) {
  const progress = useSharedValue(value ? 1 : 0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const target = value ? 1 : 0;
    progress.value = reduceMotion ? target : withSpring(target, motion.spring.toggle);
  }, [progress, reduceMotion, value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [surface.hairlineStrong, ACCENT]),
  }));
  const knobStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [text.secondary, text.inverse]),
    transform: [{ translateX: progress.value * KNOB_TRAVEL }],
    shadowColor: ACCENT_GLOW,
    shadowOpacity: progress.value,
    shadowRadius: 6 * progress.value,
    shadowOffset: { width: 0, height: 0 },
  }));
  const handleChange = () => {
    const nextValue = !value;

    // Commit-frame feedback: the tick lands exactly as the knob crosses, not on touch-down.
    haptics.select();
    const target = nextValue ? 1 : 0;
    progress.value = reduceMotion ? target : withSpring(target, motion.spring.toggle);
    onChange(nextValue);
  };

  return (
    <PressableScale
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      haptic="none"
      onPress={handleChange}
      scaleTo={0.94}>
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.knob, knobStyle]} />
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: radius.pill,
    height: TRACK_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: KNOB_INSET,
    width: TRACK_WIDTH,
  },
  knob: {
    borderRadius: radius.pill,
    height: KNOB_SIZE,
    width: KNOB_SIZE,
  },
});
