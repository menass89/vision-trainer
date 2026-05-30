import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';

import { AppText, PressableScale } from '@/components/ui';
import { ACCENT, ACCENT_GLOW, space, surface, verdict as verdictColors } from '@/theme/tokens';

export type ContrastArcProps = {
  progress: number;
  value: number;
  verdictColor: string;
  size?: number;
  onPress?: () => void;
};

const DEFAULT_SIZE = 260;
const STROKE_WIDTH = 14;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function getVerdictLabel(verdictColor: string) {
  const verdict = Object.entries(verdictColors).find(([, color]) => color === verdictColor)?.[0];

  return capitalize(verdict ?? 'holding');
}

export function ContrastArc({
  progress,
  value,
  verdictColor,
  size = DEFAULT_SIZE,
  onPress,
}: ContrastArcProps) {
  const radius = size / 2 - STROKE_WIDTH;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = useSharedValue(circumference);
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeDashoffset.value,
  }));

  useEffect(() => {
    const boundedProgress = Math.min(Math.max(progress, 0), 1);

    strokeDashoffset.value = circumference;
    strokeDashoffset.value = withTiming(circumference * (1 - boundedProgress), {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });

    return () => cancelAnimation(strokeDashoffset);
  }, [circumference, progress, strokeDashoffset]);

  const arc = (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg height={size} width={size}>
        <G originX={size / 2} originY={size / 2} rotation="-90">
          <Circle
            cx={size / 2}
            cy={size / 2}
            fill="none"
            r={radius}
            stroke={surface.hairlineStrong}
            strokeLinecap="round"
            strokeWidth={STROKE_WIDTH}
          />
          <AnimatedCircle
            animatedProps={animatedProps}
            cx={size / 2}
            cy={size / 2}
            fill="none"
            opacity={0.72}
            r={radius}
            stroke={ACCENT_GLOW}
            strokeDasharray={circumference}
            strokeLinecap="round"
            strokeWidth={STROKE_WIDTH * 2}
          />
          <AnimatedCircle
            animatedProps={animatedProps}
            cx={size / 2}
            cy={size / 2}
            fill="none"
            r={radius}
            stroke={ACCENT}
            strokeDasharray={circumference}
            strokeLinecap="round"
            strokeWidth={STROKE_WIDTH}
          />
        </G>
      </Svg>
      <View pointerEvents="none" style={styles.center}>
        <AppText color="muted" uppercase variant="micro">
          Log CS
        </AppText>
        <AppText tabular variant="display">
          {value.toFixed(2)}
        </AppText>
        <View style={styles.verdict}>
          <View style={[styles.verdictDot, { backgroundColor: verdictColor }]} />
          <AppText color="secondary" variant="caption">
            {getVerdictLabel(verdictColor)}
          </AppText>
        </View>
      </View>
    </View>
  );

  if (!onPress) {
    return arc;
  }

  return (
    <PressableScale haptic="selection" onPress={onPress} scaleTo={0.98}>
      {arc}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verdict: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.xs,
    marginTop: space.sm,
  },
  verdictDot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
});
