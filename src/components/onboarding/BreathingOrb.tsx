import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
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

import { ACCENT, ACCENT_CORE, ACCENT_GLOW, ACCENT_HOT, ACCENT_MUTED, ACCENT_SOFT } from '@/theme/tokens';

export type BreathingOrbProps = {
  size?: number;
  reactivity?: number;
  cadence?: 'sine' | 'breath';
  reduceMotion?: boolean;
  resolveOnMount?: boolean;
};

const RING_COUNT = 3;
const RIPPLE_MS = 3400;
const CONSTELLATION_ANGLES = [-60, 18, 96, 162, 234];

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
  resolveOnMount = false,
}: BreathingOrbProps) {
  const systemReduceMotion = useReducedMotion();
  const shouldReduceMotion = reduceMotion ?? systemReduceMotion;
  const normalizedReactivity = Math.min(Math.max(reactivity, 0), 1);
  const haloSize = size * 1.42;
  const bodyR = size * 0.34;
  const maxScale = 1.06 + normalizedReactivity * 0.04;
  const halfCycleMs = 2600 - normalizedReactivity * 400;
  const scale = useSharedValue(1);
  const twinkle = useSharedValue(0);
  const resolve = useSharedValue(resolveOnMount && !shouldReduceMotion ? 0 : 1);

  useEffect(() => {
    cancelAnimation(resolve);
    if (shouldReduceMotion || !resolveOnMount) {
      resolve.value = 1;
      return;
    }
    resolve.value = 0;
    resolve.value = withTiming(1, { duration: 2000, easing: Easing.out(Easing.cubic) });
    return () => cancelAnimation(resolve);
  }, [resolve, resolveOnMount, shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion) {
      cancelAnimation(scale);
      cancelAnimation(twinkle);
      scale.value = 1;
      twinkle.value = 0.5;
      return;
    }

    twinkle.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );

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

    return () => {
      cancelAnimation(scale);
      cancelAnimation(twinkle);
    };
  }, [cadence, halfCycleMs, maxScale, scale, shouldReduceMotion, twinkle]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const entranceStyle = useAnimatedStyle(() => ({
    opacity: resolve.value,
    transform: [{ scale: interpolate(resolve.value, [0, 1], [1.06, 1]) }],
  }));
  const coreStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scale.value, [1, maxScale], [0.32, 0.5]),
  }));
  const constellationStyle = useAnimatedStyle(() => ({
    opacity: interpolate(twinkle.value, [0, 1], [0.12, 0.26]),
  }));
  const constellationPoints = useMemo(() => {
    const center = haloSize / 2;
    const radius = haloSize * 0.42;

    return CONSTELLATION_ANGLES.map((angle) => {
      const radians = (angle * Math.PI) / 180;
      return {
        cx: center + radius * Math.cos(radians),
        cy: center + radius * Math.sin(radians),
      };
    });
  }, [haloSize]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { height: haloSize, width: haloSize }, entranceStyle]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.layer, { height: haloSize, width: haloSize }, constellationStyle]}>
        <Svg height={haloSize} width={haloSize}>
          {constellationPoints.map((point, index) => (
            <Circle
              cx={point.cx}
              cy={point.cy}
              fill={ACCENT}
              fillOpacity={index === 1 || index === 3 ? 0.55 : 1}
              key={CONSTELLATION_ANGLES[index]}
              r={1.4}
            />
          ))}
        </Svg>
      </Animated.View>
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
              <Stop offset="0%" stopColor={ACCENT_HOT} stopOpacity={0.95} />
              <Stop offset="34%" stopColor={ACCENT_CORE} stopOpacity={0.9} />
              <Stop offset="66%" stopColor={ACCENT} stopOpacity={0.5} />
              <Stop offset="100%" stopColor={ACCENT_SOFT} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient cx="40%" cy="32%" id="orbSpec" rx="42%" ry="42%">
              <Stop offset="0%" stopColor={ACCENT_HOT} stopOpacity={0.22} />
              <Stop offset="60%" stopColor={ACCENT} stopOpacity={0.04} />
              <Stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} fill="url(#orbGradient)" r={size / 2} />
          {/* upper-left specular highlight — the light source */}
          <Circle cx={size / 2} cy={size / 2} fill="url(#orbSpec)" r={bodyR} />
          {/* faint darker terminator near the lower limb — implies curvature + horizon */}
          <Circle
            cx={size / 2}
            cy={size / 2 + bodyR * 0.16}
            fill="none"
            r={bodyR * 0.92}
            stroke="#050708"
            strokeOpacity={0.22}
            strokeWidth={1.5}
          />
          {/* luminous limb — the body's edge */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            fill="none"
            r={bodyR}
            stroke={ACCENT_MUTED}
            strokeOpacity={0.5}
            strokeWidth={1}
          />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.layer, { height: size, width: size }, coreStyle]}>
        <Svg height={size} width={size}>
          <Defs>
            <RadialGradient cx="50%" cy="50%" id="orbCore" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={ACCENT_HOT} stopOpacity={0.5} />
              <Stop offset="24%" stopColor={ACCENT_CORE} stopOpacity={0.28} />
              <Stop offset="60%" stopColor={ACCENT} stopOpacity={0.06} />
              <Stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} fill="url(#orbCore)" r={size / 2} />
        </Svg>
      </Animated.View>
    </Animated.View>
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
