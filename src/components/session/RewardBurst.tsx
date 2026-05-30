import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ACCENT, ACCENT_GLOW, motion, radius } from '@/theme/tokens';

export type RewardBurstProps = {
  trigger: number;
  big?: boolean;
};

const SPARK_COUNT = 10;

type SparkProps = {
  angle: number;
  expansion: SharedValue<number>;
  opacity: SharedValue<number>;
  radiusPx: number;
  visible: boolean;
};

function Spark({ angle, expansion, opacity, radiusPx, visible }: SparkProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: visible ? opacity.value : 0,
    transform: [
      { translateX: Math.cos(angle) * radiusPx * expansion.value },
      { translateY: Math.sin(angle) * radiusPx * expansion.value },
      { scale: interpolate(opacity.value, [0, 1], [0.45, 1]) },
    ],
  }));

  return <Animated.View style={[styles.spark, animatedStyle]} />;
}

export function RewardBurst({ trigger, big = false }: RewardBurstProps) {
  const expansion = useSharedValue(0);
  const opacity = useSharedValue(0);
  const centerScale = useSharedValue(0);

  useEffect(() => {
    if (trigger <= 0) return;

    expansion.value = 0;
    opacity.value = 1;
    centerScale.value = 0.7;
    expansion.value = withSpring(1, motion.spring.reward);
    opacity.value = withTiming(0, { duration: 500 });
    centerScale.value = withSequence(
      withSpring(big ? 1.45 : 1.15, motion.spring.reward),
      withSpring(0, motion.spring.reward)
    );
  }, [big, centerScale, expansion, opacity, trigger]);

  const centerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: centerScale.value }],
  }));
  const sparkCount = big ? SPARK_COUNT : 7;
  const radiusPx = big ? 94 : 62;

  return (
    <View pointerEvents="none" style={styles.layer}>
      {Array.from({ length: SPARK_COUNT }, (_, index) => (
        <Spark
          angle={(index / SPARK_COUNT) * Math.PI * 2}
          expansion={expansion}
          key={index}
          opacity={opacity}
          radiusPx={radiusPx}
          visible={index < sparkCount}
        />
      ))}
      <Animated.View style={[styles.center, centerStyle]} />
    </View>
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
  spark: {
    backgroundColor: ACCENT,
    borderRadius: radius.pill,
    height: 6,
    position: 'absolute',
    width: 6,
  },
  center: {
    backgroundColor: ACCENT_GLOW,
    borderColor: ACCENT,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 38,
    position: 'absolute',
    width: 38,
  },
});
