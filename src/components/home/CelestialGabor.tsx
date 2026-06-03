import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Line, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Bloom } from '@/components/ui';
import { ACCENT, ACCENT_CORE, ACCENT_GLOW, ACCENT_MUTED, ACCENT_SOFT, motion, surface } from '@/theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 300;
const C = SIZE / 2;
const BODY_R = 96;
const GRAT_R = 106;
const TICK = 4;
const HALO_R = 116;
const HALO_STROKE = 2;
const HALO_CIRC = 2 * Math.PI * HALO_R;

// Sinusoidal cyan grating sampled as gradient stops (approximately 6 cycles, smooth).
function useGratingStops() {
  return useMemo(() => {
    const N = 48;
    const cycles = 6.2;
    const stops: { offset: number; opacity: number }[] = [];
    for (let i = 0; i <= N; i += 1) {
      const t = i / N;
      const s = (Math.cos(2 * Math.PI * cycles * t) + 1) / 2;
      const opacity = Math.pow(s, 1.5) * 0.72;
      stops.push({ offset: t, opacity });
    }
    return stops;
  }, []);
}

export type CelestialGaborProps = {
  progress?: number;
  contrast?: number;
  resolveOnMount?: boolean;
  reduceMotion?: boolean;
  /**
   * 0 = at rest, 1 = fully dilated + dissolved (used by the Today→Session exit theater).
   * When provided, the orb scales up and fades out, and a center bloom blooms outward.
   * Owned by the parent so the exit can be timed against navigation.
   */
  exit?: SharedValue<number>;
};

export function CelestialGabor({
  progress = 0.08,
  contrast = 1,
  resolveOnMount = false,
  reduceMotion = false,
  exit,
}: CelestialGaborProps) {
  const stops = useGratingStops();
  const clamped = Math.max(0, Math.min(progress, 1));
  const clampedContrast = Math.max(0, Math.min(contrast, 1));
  const dash = clamped * HALO_CIRC;

  const breathe = useSharedValue(0);
  const resolve = useSharedValue(resolveOnMount && !reduceMotion ? 0.12 : 1);

  useEffect(() => {
    cancelAnimation(breathe);
    if (reduceMotion) {
      breathe.value = 0.5;
      return;
    }
    breathe.value = 0;
    breathe.value = withRepeat(
      withTiming(1, { duration: motion.timing.breatheMs, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(breathe);
  }, [breathe, reduceMotion]);

  useEffect(() => {
    cancelAnimation(resolve);
    if (reduceMotion || !resolveOnMount) {
      resolve.value = 1;
      return;
    }
    resolve.value = 0.12;
    resolve.value = withTiming(1, { duration: 2200, easing: Easing.out(Easing.cubic) });
    return () => cancelAnimation(resolve);
  }, [resolve, resolveOnMount, reduceMotion]);

  const gratingProps = useAnimatedProps(() => ({
    opacity: resolve.value * clampedContrast,
  }));

  const bodyStyle = useAnimatedStyle(() => {
    const e = exit?.value ?? 0;
    return {
      opacity: (0.9 + breathe.value * 0.1) * (1 - e),
      transform: [{ scale: (1 + breathe.value * 0.035) * (1 + e * 0.18) }],
    };
  });

  const haloLayerStyle = useAnimatedStyle(() => {
    const e = exit?.value ?? 0;
    return {
      opacity: 1 - e,
      transform: [{ scale: 1 + e * 0.18 }],
    };
  });

  const exitBloomStyle = useAnimatedStyle(() => {
    const e = exit?.value ?? 0;
    // Bloom brightens during the Today exit and hands off to the Session halo.
    return {
      opacity: e * 0.6,
      transform: [{ scale: 0.6 + e * 1.0 }],
    };
  });

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Animated.View pointerEvents="none" style={[styles.exitBloom, exitBloomStyle]}>
        <Bloom color={ACCENT_GLOW} core={ACCENT_CORE} edge={ACCENT_GLOW} />
      </Animated.View>

      {/* breathing celestial body */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.center, bodyStyle]}>
        <Svg height={SIZE} width={SIZE}>
          <Defs>
            {/* sphere body volume */}
            <RadialGradient id="cg-body" cx="50%" cy="46%" r="60%">
              <Stop offset="0%" stopColor={surface.raised} stopOpacity={1} />
              <Stop offset="72%" stopColor="#0B1115" stopOpacity={1} />
              <Stop offset="100%" stopColor={surface.base} stopOpacity={1} />
            </RadialGradient>
            {/* diagonal sinusoidal grating */}
            <LinearGradient id="cg-grating" x1="0" y1="0" x2="1" y2="1">
              {stops.map((s, i) => (
                <Stop key={i} offset={s.offset} stopColor={ACCENT} stopOpacity={s.opacity} />
              ))}
            </LinearGradient>
            {/* Gaussian window: fades grating toward the rim */}
            <RadialGradient id="cg-window" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={surface.base} stopOpacity={0} />
              <Stop offset="56%" stopColor={surface.base} stopOpacity={0} />
              <Stop offset="82%" stopColor={surface.base} stopOpacity={0.6} />
              <Stop offset="100%" stopColor={surface.base} stopOpacity={1} />
            </RadialGradient>
            {/* central luminous core */}
            <RadialGradient id="cg-core" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#CFFCFD" stopOpacity={0.5} />
              <Stop offset="22%" stopColor={ACCENT} stopOpacity={0.28} />
              <Stop offset="55%" stopColor={ACCENT} stopOpacity={0.08} />
              <Stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </RadialGradient>
            {/* outer bloom halo */}
            <RadialGradient id="cg-halo" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={ACCENT} stopOpacity={0.26} />
              <Stop offset="30%" stopColor={ACCENT} stopOpacity={0.16} />
              <Stop offset="62%" stopColor={ACCENT} stopOpacity={0.06} />
              <Stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </RadialGradient>
            {/* upper-left specular highlight (tactility) */}
            <RadialGradient id="cg-spec" cx="38%" cy="30%" r="42%">
              <Stop offset="0%" stopColor="#CFFCFD" stopOpacity={0.22} />
              <Stop offset="60%" stopColor={ACCENT} stopOpacity={0.04} />
              <Stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </RadialGradient>
          </Defs>

          {/* halo bloom fills the whole box */}
          <Rect height={SIZE} width={SIZE} fill="url(#cg-halo)" />
          {/* body */}
          <Circle cx={C} cy={C} r={BODY_R} fill="url(#cg-body)" />
          {/* grating clipped to body */}
          <AnimatedCircle cx={C} cy={C} r={BODY_R} fill="url(#cg-grating)" animatedProps={gratingProps} />
          {/* gaussian window over grating */}
          <Circle cx={C} cy={C} r={BODY_R} fill="url(#cg-window)" />
          {/* luminous core */}
          <Circle cx={C} cy={C} r={BODY_R} fill="url(#cg-core)" />
          {/* specular */}
          <Circle cx={C} cy={C} r={BODY_R} fill="url(#cg-spec)" />
          {/* rim */}
          <Circle
            cx={C}
            cy={C}
            r={BODY_R}
            fill="none"
            stroke={ACCENT_MUTED}
            strokeOpacity={0.45}
            strokeWidth={1}
          />
        </Svg>
      </Animated.View>

      {/* steady progress halo (does NOT breathe) */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.center, haloLayerStyle]}>
        <Svg height={SIZE} width={SIZE}>
          {/* graticule ring — instrument eyepiece */}
          <Circle cx={C} cy={C} r={GRAT_R} fill="none" stroke={ACCENT_SOFT} strokeOpacity={0.16} strokeWidth={1} />
          {/* cardinal tick marks at 12 / 3 / 6 / 9 */}
          <Line x1={C} y1={C - GRAT_R - TICK} x2={C} y2={C - GRAT_R + TICK} stroke={ACCENT_SOFT} strokeOpacity={0.34} strokeWidth={1} />
          <Line x1={C} y1={C + GRAT_R - TICK} x2={C} y2={C + GRAT_R + TICK} stroke={ACCENT_SOFT} strokeOpacity={0.34} strokeWidth={1} />
          <Line x1={C - GRAT_R - TICK} y1={C} x2={C - GRAT_R + TICK} y2={C} stroke={ACCENT_SOFT} strokeOpacity={0.34} strokeWidth={1} />
          <Line x1={C + GRAT_R - TICK} y1={C} x2={C + GRAT_R + TICK} y2={C} stroke={ACCENT_SOFT} strokeOpacity={0.34} strokeWidth={1} />
          <Circle
            cx={C}
            cy={C}
            r={HALO_R}
            fill="none"
            stroke={surface.hairline}
            strokeWidth={HALO_STROKE}
          />
          <Circle
            cx={C}
            cy={C}
            r={HALO_R}
            fill="none"
            stroke={ACCENT}
            strokeDasharray={`${dash} ${HALO_CIRC - dash}`}
            strokeLinecap="round"
            strokeWidth={HALO_STROKE}
            transform={`rotate(-90 ${C} ${C})`}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    height: SIZE,
    justifyContent: 'center',
    width: SIZE,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitBloom: {
    alignItems: 'center',
    height: SIZE,
    justifyContent: 'center',
    position: 'absolute',
    width: SIZE,
  },
});
