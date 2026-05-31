import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/ui';
import { haptics } from '@/theme/haptics';
import { ACCENT, motion, radius, surface, text } from '@/theme/tokens';

export type ToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

const TRACK_WIDTH = 48;
const TRACK_HEIGHT = 28;
const KNOB_SIZE = 22;
const KNOB_INSET = 3;
const KNOB_TRAVEL = TRACK_WIDTH - KNOB_SIZE - KNOB_INSET * 2;

export function Toggle({ value, onChange, disabled = false }: ToggleProps) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, motion.spring.toggle);
  }, [progress, value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [surface.overlay, ACCENT]),
  }));
  const knobStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [text.secondary, text.inverse]),
    transform: [{ translateX: progress.value * KNOB_TRAVEL }],
  }));
  const handleChange = () => {
    const nextValue = !value;

    // Commit-frame feedback: the tick lands exactly as the knob crosses, not on touch-down.
    haptics.select();
    progress.value = withSpring(nextValue ? 1 : 0, motion.spring.toggle);
    onChange(nextValue);
  };

  return (
    <PressableScale
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
