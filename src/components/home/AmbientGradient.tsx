import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Bloom } from '@/components/ui';
import { data, motion } from '@/theme/tokens';

export type AmbientGradientProps = {
  reduceMotion?: boolean;
};

const AMBIENT_COLORS = ['#140E0A', '#0C0A0B', '#0A0B0D'] as const;
const DRIFT_OFFSET = 12;
const SPACE_FOR_DRIFT = DRIFT_OFFSET * 2;
const BLOOM_LAG_MS = 400;

export function AmbientGradient({ reduceMotion = false }: AmbientGradientProps) {
  const translateY = useSharedValue(0);
  const bloomOpacity = useSharedValue(0.7);
  const bloomScale = useSharedValue(1);
  const driftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const bloomStyle = useAnimatedStyle(() => ({
    opacity: bloomOpacity.value,
    transform: [{ scale: bloomScale.value }],
  }));

  useEffect(() => {
    cancelAnimation(translateY);
    cancelAnimation(bloomOpacity);
    cancelAnimation(bloomScale);

    if (reduceMotion) {
      translateY.value = 0;
      bloomOpacity.value = 0.7;
      bloomScale.value = 1;
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
    bloomOpacity.value = 0.5;
    bloomScale.value = 1;
    bloomOpacity.value = withDelay(
      BLOOM_LAG_MS,
      withRepeat(
        withTiming(0.9, {
          duration: motion.timing.breatheMs,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      ),
    );
    bloomScale.value = withDelay(
      BLOOM_LAG_MS,
      withRepeat(
        withTiming(1.06, {
          duration: motion.timing.breatheMs,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      ),
    );

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(bloomOpacity);
      cancelAnimation(bloomScale);
    };
  }, [bloomOpacity, bloomScale, reduceMotion, translateY]);

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
        <Animated.View style={[styles.layer, driftStyle]}>{gradient}</Animated.View>
      )}
      <Animated.View style={[styles.bloom, bloomStyle]}>
        <Bloom color={data.heroGlow} rx="80%" ry="70%" />
      </Animated.View>
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
  bloom: {
    position: 'absolute',
    top: '5%',
    right: -48,
    left: -48,
    height: '50%',
  },
});
