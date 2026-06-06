import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';

import { easings } from '@/theme/motion';
import { ACCENT, ACCENT_GLOW } from '@/theme/tokens';

export type KinoEdgeArcProps = {
  progress: number;
};

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const INSET = 3;
const CORNER_RADIUS = 28;

export function KinoEdgeArc({ progress }: KinoEdgeArcProps) {
  const { height, width } = useWindowDimensions();
  const rectWidth = Math.max(width - INSET * 2, 0);
  const rectHeight = Math.max(height - INSET * 2, 0);
  const radius = Math.min(CORNER_RADIUS, rectWidth / 2, rectHeight / 2);
  const perimeter = 2 * (rectWidth + rectHeight - 4 * radius) + 2 * Math.PI * radius;
  const strokeDashoffset = useSharedValue(perimeter);
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeDashoffset.value,
  }));

  useEffect(() => {
    const boundedProgress = Math.min(Math.max(progress, 0), 1);

    strokeDashoffset.value = withTiming(perimeter * (1 - boundedProgress), {
      duration: 500,
      easing: easings.out,
    });

    return () => cancelAnimation(strokeDashoffset);
  }, [perimeter, progress, strokeDashoffset]);

  return (
    <Svg height={height} pointerEvents="none" style={styles.arc} width={width}>
      <AnimatedRect
        animatedProps={animatedProps}
        fill="none"
        height={rectHeight}
        opacity={0.78}
        rx={radius}
        stroke={ACCENT_GLOW}
        strokeDasharray={perimeter}
        strokeLinecap="round"
        strokeWidth={8}
        width={rectWidth}
        x={INSET}
        y={INSET}
      />
      <AnimatedRect
        animatedProps={animatedProps}
        fill="none"
        height={rectHeight}
        rx={radius}
        stroke={ACCENT}
        strokeDasharray={perimeter}
        strokeLinecap="round"
        strokeWidth={3}
        width={rectWidth}
        x={INSET}
        y={INSET}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  arc: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
