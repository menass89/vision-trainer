import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AppText, PressableScale } from '@/components/ui';
import { ACCENT, motion, radius, space, surface } from '@/theme/tokens';

export type SegmentOption<T extends string = string> = {
  label: string;
  value: T;
};

export type SegmentedControlProps<T extends string = string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

const SEGMENT_WIDTH = 52;
const CONTAINER_INSET = 2;
const ACCENT_TINT = `${ACCENT}29`;

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0,
  );
  const position = useSharedValue(selectedIndex);

  useEffect(() => {
    position.value = withSpring(selectedIndex, motion.spring.input);
  }, [position, selectedIndex]);

  const highlightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value * SEGMENT_WIDTH }],
  }));

  return (
    <View style={[styles.container, { width: options.length * SEGMENT_WIDTH + CONTAINER_INSET * 2 }]}>
      <Animated.View style={[styles.highlight, highlightStyle]} />
      {options.map((option, index) => {
        const selected = option.value === value;
        const handleChange = () => {
          if (selected) {
            return;
          }

          position.value = withSpring(index, motion.spring.input);
          onChange(option.value);
        };

        return (
          <PressableScale
            haptic={selected ? 'none' : 'selection'}
            key={option.value}
            onPress={handleChange}
            scaleTo={0.94}
            style={styles.segment}>
            <AppText color={selected ? 'accent' : 'secondary'} variant="caption">
              {option.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: surface.overlay,
    borderRadius: radius.md,
    flexDirection: 'row',
    padding: CONTAINER_INSET,
    position: 'relative',
  },
  highlight: {
    backgroundColor: ACCENT_TINT,
    borderRadius: radius.sm,
    bottom: CONTAINER_INSET,
    left: CONTAINER_INSET,
    position: 'absolute',
    top: CONTAINER_INSET,
    width: SEGMENT_WIDTH,
  },
  segment: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.sm,
    width: SEGMENT_WIDTH,
  },
});
