import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { ACCENT, ACCENT_GLOW } from '@/theme/tokens';

export type BreathingOrbProps = {
  size?: number;
  reactivity?: number;
  reduceMotion?: boolean;
};

export function BreathingOrb({
  size = 164,
  reactivity = 0,
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

    scale.value = withRepeat(
      withTiming(maxScale, {
        duration: halfCycleMs,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );

    return () => cancelAnimation(scale);
  }, [halfCycleMs, maxScale, scale, shouldReduceMotion]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scale.value, [1, maxScale], [0.3, 0.14]),
  }));

  return (
    <View pointerEvents="none" style={[styles.container, { height: haloSize, width: haloSize }]}>
      <Animated.View style={[styles.layer, { height: haloSize, width: haloSize }, haloStyle]}>
        <Svg height={haloSize} width={haloSize}>
          <Circle cx={haloSize / 2} cy={haloSize / 2} fill={ACCENT_GLOW} r={haloSize / 2} />
        </Svg>
      </Animated.View>
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
});
