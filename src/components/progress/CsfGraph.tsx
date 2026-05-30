import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { AppText } from '@/components/ui';
import { ACCENT, ACCENT_GLOW, motion, radius, surface, text } from '@/theme/tokens';

export type CsfGraphProps = {
  points: { spatialFrequency: number; sensitivity: number }[];
  width: number;
  height: number;
};

type ChartPoint = CsfGraphProps['points'][number] & {
  x: number;
  y: number;
};

type SelectedDotProps = {
  point: ChartPoint;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);
const CHART_TOP = 34;
const CHART_BOTTOM = 12;
const CHART_INSET = 8;
const SELECTED_DOT_SIZE = 12;
const NODE_NEUTRALS = [text.muted, '#7B828A', '#8A9198', text.secondary] as const;

function createChartPoints(points: CsfGraphProps['points'], width: number, height: number) {
  const frequencies = points.map((point) => point.spatialFrequency);
  const sensitivities = points.map((point) => Math.log10(Math.max(point.sensitivity, 1)));
  const minimumFrequency = Math.min(...frequencies);
  const maximumFrequency = Math.max(...frequencies);
  const minimumSensitivity = Math.min(...sensitivities);
  const maximumSensitivity = Math.max(...sensitivities);
  const frequencyRange = maximumFrequency - minimumFrequency || 1;
  const sensitivityRange = maximumSensitivity - minimumSensitivity || 1;
  const drawableWidth = Math.max(width - CHART_INSET * 2, 0);
  const drawableHeight = Math.max(height - CHART_TOP - CHART_BOTTOM, 0);

  return points.map((point) => ({
    ...point,
    x: CHART_INSET + ((point.spatialFrequency - minimumFrequency) / frequencyRange) * drawableWidth,
    y:
      CHART_TOP +
      ((maximumSensitivity - Math.log10(Math.max(point.sensitivity, 1))) / sensitivityRange) *
        drawableHeight,
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

function SelectedDot({ point }: SelectedDotProps) {
  const scale = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    scale.value = 0;
    scale.value = withSpring(1, motion.spring.input);

    return () => cancelAnimation(scale);
  }, [point.x, point.y, scale]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.selectedDot,
        {
          left: point.x - SELECTED_DOT_SIZE / 2,
          top: point.y - SELECTED_DOT_SIZE / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

export function CsfGraph({ points, width, height }: CsfGraphProps) {
  const chartPoints = useMemo(() => createChartPoints(points, width, height), [height, points, width]);
  const path = createPath(chartPoints);
  const pathLength = getPathLength(chartPoints);
  const strokeDashoffset = useSharedValue(pathLength);
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeDashoffset.value,
  }));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedIndexRef = useRef<number | null>(null);
  const selectedPoint = selectedIndex === null ? null : chartPoints[selectedIndex];
  const baselineY = height - CHART_BOTTOM;

  useEffect(() => {
    strokeDashoffset.value = pathLength;
    strokeDashoffset.value = withTiming(0, {
      duration: 1100,
      easing: Easing.out(Easing.cubic),
    });

    return () => cancelAnimation(strokeDashoffset);
  }, [pathLength, strokeDashoffset]);

  const selectNearest = useCallback(
    (fingerX: number) => {
      if (chartPoints.length === 0) return;

      const nearestIndex = chartPoints.reduce((nearest, point, index) => {
        return Math.abs(point.x - fingerX) < Math.abs(chartPoints[nearest].x - fingerX)
          ? index
          : nearest;
      }, 0);

      if (selectedIndexRef.current === nearestIndex) return;

      selectedIndexRef.current = nearestIndex;
      setSelectedIndex(nearestIndex);
      void Haptics.selectionAsync();
    },
    [chartPoints]
  );

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .activeOffsetX([-10, 10])
      .onStart((event) => {
        runOnJS(selectNearest)(event.x);
      })
      .onUpdate((event) => {
        runOnJS(selectNearest)(event.x);
      });
    const tap = Gesture.Tap().onEnd((event) => {
      runOnJS(selectNearest)(event.x);
    });

    return Gesture.Race(pan, tap);
  }, [selectNearest]);

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width, height }}>
        <Svg height={height} width={width}>
          {[0.35, 0.68].map((offset) => {
            const y = CHART_TOP + (baselineY - CHART_TOP) * offset;

            return (
              <Line
                key={offset}
                opacity={0.72}
                stroke={surface.hairline}
                strokeWidth={1}
                x1={CHART_INSET}
                x2={width - CHART_INSET}
                y1={y}
                y2={y}
              />
            );
          })}
          <Line
            stroke={surface.hairline}
            strokeWidth={1}
            x1={CHART_INSET}
            x2={width - CHART_INSET}
            y1={baselineY}
            y2={baselineY}
          />
          {selectedPoint ? (
            <Line
              opacity={0.82}
              stroke={surface.hairlineStrong}
              strokeWidth={1}
              x1={selectedPoint.x}
              x2={selectedPoint.x}
              y1={CHART_TOP}
              y2={baselineY}
            />
          ) : null}
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
                strokeWidth={9}
              />
              <AnimatedPath
                animatedProps={animatedProps}
                d={path}
                fill="none"
                stroke={ACCENT}
                strokeDasharray={pathLength}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
              />
            </>
          ) : null}
          {chartPoints.map((point, index) => (
            <Circle
              cx={point.x}
              cy={point.y}
              fill={NODE_NEUTRALS[index % NODE_NEUTRALS.length]}
              key={point.spatialFrequency}
              r={3}
            />
          ))}
        </Svg>
        {selectedPoint ? (
          <>
            <SelectedDot point={selectedPoint} />
            <AppText
              style={[
                styles.readout,
                selectedPoint.x > width * 0.58
                  ? { right: width - selectedPoint.x }
                  : { left: selectedPoint.x },
                { top: Math.max(0, selectedPoint.y - 28) },
              ]}
              tabular
              variant="caption">
              {`${selectedPoint.spatialFrequency} cpd · ${selectedPoint.sensitivity}`}
            </AppText>
          </>
        ) : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  readout: {
    position: 'absolute',
  },
  selectedDot: {
    backgroundColor: ACCENT,
    borderRadius: radius.pill,
    height: SELECTED_DOT_SIZE,
    position: 'absolute',
    width: SELECTED_DOT_SIZE,
  },
});
