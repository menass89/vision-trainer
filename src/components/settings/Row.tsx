import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type ViewStyle, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
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
  chevron?: boolean;
};

type RowBodyProps = Pick<RowProps, 'label' | 'description' | 'right' | 'chevron'> & {
  rightStyle?: ReturnType<typeof useAnimatedStyle<ViewStyle>>;
};

function RowBody({ label, description, right, chevron, rightStyle }: RowBodyProps) {
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
      {chevron ? (
        <Animated.View style={[styles.right, rightStyle]}>{right}</Animated.View>
      ) : (
        <View style={styles.right}>{right}</View>
      )}
    </>
  );
}

export function Row({ label, description, right, onPress, accessibilityLabel, chevron = false }: RowProps) {
  const pressed = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const followX = useSharedValue(0);
  const rightStyle = useAnimatedStyle<ViewStyle>(() => ({
    transform: [{ translateX: followX.value }],
  }));
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
        pressed.value = reduceMotion ? 1 : withTiming(1, { duration: 90 });
        if (chevron) {
          followX.value = reduceMotion ? 2 : withSpring(2, motion.spring.press);
        }
        haptics.select();
      }}
      onPressOut={() => {
        pressed.value = reduceMotion ? 0 : withTiming(0, { duration: motion.timing.rangeFadeMs });
        if (chevron) {
          followX.value = reduceMotion ? 0 : withSpring(0, motion.spring.press);
        }
      }}
      style={[styles.row, fillStyle]}>
      <RowBody
        chevron={chevron}
        description={description}
        label={label}
        right={right}
        rightStyle={rightStyle}
      />
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
