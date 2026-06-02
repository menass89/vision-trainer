import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui';
import { haptics } from '@/theme/haptics';
import { motion, space, surface } from '@/theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type RowProps = {
  label: string;
  description?: string;
  right: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
};

type RowBodyProps = Pick<RowProps, 'label' | 'description' | 'right'>;

function RowBody({ label, description, right }: RowBodyProps) {
  return (
    <>
      <View style={styles.copy}>
        <AppText variant="bodyStrong">{label}</AppText>
        {description ? (
          <AppText color="muted" variant="caption">
            {description}
          </AppText>
        ) : null}
      </View>
      <View style={styles.right}>{right}</View>
    </>
  );
}

export function Row({ label, description, right, onPress, accessibilityLabel }: RowProps) {
  const pressed = useSharedValue(0);
  const fillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(pressed.value, [0, 1], [surface.card, surface.cardPressed]),
  }));

  if (!onPress) {
    return (
      <View style={styles.row}>
        <RowBody description={description} label={label} right={right} />
      </View>
    );
  }

  return (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: 90 });
        haptics.select();
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: motion.timing.rangeFadeMs });
      }}
      style={[styles.row, fillStyle]}>
      <RowBody description={description} label={label} right={right} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.md,
    paddingHorizontal: space.base,
    paddingVertical: space.md,
  },
  copy: {
    flex: 1,
    gap: space.xs,
  },
  right: {
    flexShrink: 0,
  },
});
