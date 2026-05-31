import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { ACCENT, ACCENT_GLOW } from '@/theme/tokens';

export type BreathingOrbProps = {
  size?: number;
  reactivity?: number;
  cadence?: 'sine' | 'breath';
  reduceMotion?: boolean;
};

const RING_COUNT = 3;
const RIPPLE_MS = 3400;

type RippleRingProps = {
  size: number;
  delay: number;
  reduceMotion: boolean;
};

// Endel: a single orb with concentric rings expanding out of it reads as a calm, living pulse -
// far more premium than a static filled halo.
function RippleRing({ size, delay, reduceMotion }: RippleRingProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(progress);
      progress.value = 0;
      return;
    }

    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: RIPPLE_MS, easing: Easing.out(Easing.cubic) }), -1, false),
    );

    return () => cancelAnimation(progress);
  }, [delay, progress, reduceMotion]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.12, 1], [0, 0.22, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.55, 1]) }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }, ringStyle]}
    />
  );
}

export function BreathingOrb({
  size = 164,
  reactivity = 0,
  cadence = 'sine',
  reduceMotion,
}: BreathingOrbProps) {
  const systemReduceMotion = useReducedMotion();
  const shouldReduceMotion = reduceMotion ?? systemReduceMotion;
  const normalizedReactivity = Math.min(Math.max(reactivity, 0), 1);
  const haloSize = size * 1.42;
  const maxScale = 1.06 + normalizedReactivity * 0.04;
  const halfCycleMs = 2600 - normalizedReactivity * 400;
  const scale = useSharedValue(1);

  useEffect(() => {
    if (shouldReduceMotion) {
      cancelAnimation(scale);
      scale.value = 1;
      return;
    }

    if (cadence === 'breath') {
      // Calibration: a deliberate respiratory cadence (inhale -> hold -> exhale) the user can pace to.
      scale.value = withRepeat(
        withSequence(
          withTiming(maxScale, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
          withTiming(maxScale, { duration: 600, easing: Easing.linear }),
          withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    } else {
      scale.value = withRepeat(
        withTiming(maxScale, { duration: halfCycleMs, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    }

    return () => cancelAnimation(scale);
  }, [cadence, halfCycleMs, maxScale, scale, shouldReduceMotion]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View pointerEvents="none" style={[styles.container, { height: haloSize, width: haloSize }]}>
      {Array.from({ length: RING_COUNT }).map((_, index) => (
        <RippleRing
          delay={(index * RIPPLE_MS) / RING_COUNT}
          key={index}
          reduceMotion={shouldReduceMotion}
          size={haloSize}
        />
      ))}
      <Animated.View style={[styles.layer, { height: size, width: size }, orbStyle]}>
        <Svg height={size} width={size}>
          <Defs>
            <RadialGradient cx="50%" cy="46%" id="orbGradient" rx="52%" ry="52%">
              <Stop offset="0%" stopColor={ACCENT} stopOpacity={0.9} />
              <Stop offset="58%" stopColor={ACCENT_GLOW} stopOpacity={1} />
              <Stop offset="100%" stopColor={ACCENT_GLOW} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} fill="url(#orbGradient)" r={size / 2} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  layer: {
    position: 'absolute',
  },
  ring: {
    borderColor: ACCENT,
    borderWidth: 1,
    position: 'absolute',
  },
});
