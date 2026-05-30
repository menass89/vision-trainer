import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { motion } from '@/theme/tokens';

export type AmbientGradientProps = {
  reduceMotion?: boolean;
};

const AMBIENT_COLORS = ['#0C0E12', '#0A0B0D', '#0B0A0C'] as const;
const DRIFT_OFFSET = 12;
const SPACE_FOR_DRIFT = DRIFT_OFFSET * 2;

export function AmbientGradient({ reduceMotion = false }: AmbientGradientProps) {
  const translateY = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    cancelAnimation(translateY);

    if (reduceMotion) {
      translateY.value = 0;
      return;
    }

    translateY.value = -DRIFT_OFFSET;
    translateY.value = withRepeat(
      withTiming(DRIFT_OFFSET, {
        duration: motion.ambientMs * 2,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );

    return () => cancelAnimation(translateY);
  }, [reduceMotion, translateY]);

  const gradient = (
    <LinearGradient
      colors={AMBIENT_COLORS}
      end={{ x: 0.5, y: 1 }}
      start={{ x: 0.5, y: 0 }}
      style={styles.gradient}
    />
  );

  return (
    <View pointerEvents="none" style={styles.container}>
      {reduceMotion ? (
        <View style={styles.layer}>{gradient}</View>
      ) : (
        <Animated.View style={[styles.layer, animatedStyle]}>{gradient}</Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    top: -SPACE_FOR_DRIFT,
    right: 0,
    bottom: -SPACE_FOR_DRIFT,
    left: 0,
  },
  gradient: {
    flex: 1,
  },
});
