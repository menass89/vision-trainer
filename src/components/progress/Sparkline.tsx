import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { AppText } from '@/components/ui';
import { ACCENT, ACCENT_GLOW, space } from '@/theme/tokens';

export type SparklineProps = {
  points: { day: string; value: number }[];
  width: number;
  height: number;
};

type ChartPoint = {
  day: string;
  x: number;
  y: number;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);
const PLOT_INSET = 5;
const LABEL_HEIGHT = 20;

function createChartPoints(points: SparklineProps['points'], width: number, height: number) {
  const values = points.map((point) => point.value);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum || 1;
  const drawableWidth = Math.max(width - PLOT_INSET * 2, 0);
  const drawableHeight = Math.max(height - PLOT_INSET * 2, 0);

  return points.map(({ day, value }, index) => ({
    day,
    x: PLOT_INSET + (points.length === 1 ? drawableWidth / 2 : (index / (points.length - 1)) * drawableWidth),
    y: PLOT_INSET + ((maximum - value) / range) * drawableHeight,
  }));
}

function createPath(points: ChartPoint[]) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function getPathLength(points: ChartPoint[]) {
  return points.slice(1).reduce((length, point, index) => {
    const previous = points[index];

    return length + Math.hypot(point.x - previous.x, point.y - previous.y);
  }, 0);
}

export function Sparkline({ points, width, height }: SparklineProps) {
  const chartPoints = createChartPoints(points, width, height);
  const path = createPath(chartPoints);
  const pathLength = getPathLength(chartPoints);
  const strokeDashoffset = useSharedValue(pathLength);
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeDashoffset.value,
  }));
  const firstPoint = chartPoints[0];
  const lastPoint = chartPoints.at(-1);
  const areaPath =
    firstPoint && lastPoint ? `${path} L ${lastPoint.x} ${height} L ${firstPoint.x} ${height} Z` : '';

  useEffect(() => {
    strokeDashoffset.value = pathLength;
    strokeDashoffset.value = withTiming(0, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });

    return () => cancelAnimation(strokeDashoffset);
  }, [pathLength, strokeDashoffset]);

  return (
    <View style={[styles.container, { width, height: height + LABEL_HEIGHT }]}>
      <Svg height={height} width={width}>
        {areaPath ? <Path d={areaPath} fill={ACCENT} opacity={0.08} /> : null}
        {path ? (
          <>
            <AnimatedPath
              animatedProps={animatedProps}
              d={path}
              fill="none"
              opacity={0.9}
              stroke={ACCENT_GLOW}
              strokeDasharray={pathLength}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={8}
            />
            <AnimatedPath
              animatedProps={animatedProps}
              d={path}
              fill="none"
              stroke={ACCENT}
              strokeDasharray={pathLength}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </>
        ) : null}
        {chartPoints.map((point, index) => {
          const isLast = index === chartPoints.length - 1;

          return (
            <Circle
              cx={point.x}
              cy={point.y}
              fill={ACCENT}
              key={`${point.day}-${index}`}
              opacity={isLast ? 1 : 0.72}
              r={isLast ? 3.5 : 2}
            />
          );
        })}
      </Svg>
      {firstPoint ? (
        <AppText color="muted" style={styles.firstLabel} variant="micro">
          {firstPoint.day}
        </AppText>
      ) : null}
      {lastPoint && lastPoint !== firstPoint ? (
        <AppText color="muted" style={styles.lastLabel} variant="micro">
          {lastPoint.day}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  firstLabel: {
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  lastLabel: {
    bottom: 0,
    position: 'absolute',
    right: 0,
  },
});
