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

import { Bloom, Grain } from '@/components/ui';
import { ACCENT, ACCENT_CORE, data, motion } from '@/theme/tokens';

export type AmbientGradientProps = {
  constellation?: boolean;
  reduceMotion?: boolean;
};

const AMBIENT_COLORS = ['#0E1A1F', '#0B1418', '#090C0F', '#080A0D', '#050708'] as const;
const STAR_COUNT = 44;

// Deterministic PRNG so the field is stable across renders/launches (no hydration mismatch).
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Power-law magnitudes: most stars tiny + dim, a few brighter. Concentrated in the upper sky.
const STARFIELD = (() => {
  const rand = mulberry32(0x5eed51);
  return Array.from({ length: STAR_COUNT }, () => {
    const mag = Math.pow(rand(), 2.2); // skewed toward 0 → mostly faint
    return {
      top: 3 + rand() * 66, // % of height — upper ~69%
      left: 3 + rand() * 94, // % of width
      size: 0.8 + mag * 2.0, // 0.8 .. 2.8 px
      opacity: 0.1 + mag * 0.42, // 0.10 .. 0.52
      bright: mag > 0.6, // brightest quartile burns at the hot core hue
    };
  });
})();
const DRIFT_OFFSET = 16;
const SPACE_FOR_DRIFT = DRIFT_OFFSET * 2;
const BLOOM_LAG_MS = 400;

export function AmbientGradient({
  constellation = false,
  reduceMotion = false,
}: AmbientGradientProps) {
  const translateY = useSharedValue(0);
  const bloomOpacity = useSharedValue(0.7);
  const bloomScale = useSharedValue(1);
  const deepOpacity = useSharedValue(0.3);
  const deepScale = useSharedValue(1);
  const driftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const bloomStyle = useAnimatedStyle(() => ({
    opacity: bloomOpacity.value,
    transform: [{ scale: bloomScale.value }],
  }));
  const deepStyle = useAnimatedStyle(() => ({
    opacity: deepOpacity.value,
    transform: [{ scale: deepScale.value }],
  }));

  useEffect(() => {
    cancelAnimation(translateY);
    cancelAnimation(bloomOpacity);
    cancelAnimation(bloomScale);
    cancelAnimation(deepOpacity);
    cancelAnimation(deepScale);

    if (reduceMotion) {
      translateY.value = 0;
      bloomOpacity.value = 0.7;
      bloomScale.value = 1;
      deepOpacity.value = 0.3;
      deepScale.value = 1;
      return () => {
        cancelAnimation(translateY);
        cancelAnimation(bloomOpacity);
        cancelAnimation(bloomScale);
        cancelAnimation(deepOpacity);
        cancelAnimation(deepScale);
      };
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
    deepOpacity.value = 0.22;
    deepScale.value = 1;
    deepOpacity.value = withRepeat(
      withTiming(0.34, {
        duration: motion.ambientMs,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
    deepScale.value = withRepeat(
      withTiming(1.04, {
        duration: motion.ambientMs,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(bloomOpacity);
      cancelAnimation(bloomScale);
      cancelAnimation(deepOpacity);
      cancelAnimation(deepScale);
    };
  }, [bloomOpacity, bloomScale, deepOpacity, deepScale, reduceMotion, translateY]);

  const gradient = (
    <LinearGradient
      colors={AMBIENT_COLORS}
      end={{ x: 0.5, y: 1 }}
      start={{ x: 0.5, y: 0 }}
      style={styles.gradient}
    />
  );
  const stars = constellation
    ? STARFIELD.map((s, index) => (
        <View
          key={index}
          style={[
            styles.star,
            {
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: s.size,
              height: s.size,
              borderRadius: s.size / 2,
              opacity: s.opacity,
              backgroundColor: s.bright ? ACCENT_CORE : ACCENT,
            },
          ]}
        />
      ))
    : null;

  return (
    <View pointerEvents="none" style={styles.container}>
      {reduceMotion ? (
        <View style={styles.layer}>
          {gradient}
          {stars}
        </View>
      ) : (
        <Animated.View style={[styles.layer, driftStyle]}>
          {gradient}
          {stars}
        </Animated.View>
      )}
      <Animated.View style={[styles.deepGlow, deepStyle]}>
        <Bloom color={data.heroGlow} rx="90%" ry="44%" />
      </Animated.View>
      <Animated.View style={[styles.bloom, bloomStyle]}>
        <Bloom color={data.heroGlowStrong} rx="62%" ry="38%" />
      </Animated.View>
      <Grain opacity={0.03} />
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
  deepGlow: {
    bottom: '-8%',
    left: -80,
    position: 'absolute',
    right: -80,
    top: '-8%',
  },
  bloom: {
    bottom: '-10%',
    left: '-34%',
    position: 'absolute',
    top: '-30%',
    width: '130%',
  },
  star: {
    position: 'absolute',
    backgroundColor: ACCENT,
  },
});
