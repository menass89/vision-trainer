import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { TrajectoryPointLight } from '@/components/progress/TrajectoryPointLight';
import { AppText } from '@/components/ui';
import { haptics } from '@/theme/haptics';
import { ACCENT, ACCENT_GLOW, motion, radius, surface, text, verdict } from '@/theme/tokens';

export type CsfGraphProps = {
  points: { spatialFrequency: number; sensitivity: number }[];
  width: number;
  height: number;
  references?: { label: string; sensitivity: number }[];
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
const EMPTY_REFERENCES: NonNullable<CsfGraphProps['references']> = [];

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function createSensitivityScale(
  points: CsfGraphProps['points'],
  references: NonNullable<CsfGraphProps['references']>,
  height: number
) {
  const sensitivities = [...points, ...references].map((point) =>
    Math.log10(Math.max(point.sensitivity, 1))
  );
  const sensitivityDomain = sensitivities.length === 0 ? [0] : sensitivities;
  const minimumSensitivity = Math.min(...sensitivityDomain);
  const maximumSensitivity = Math.max(...sensitivityDomain);
  const sensitivityRange = maximumSensitivity - minimumSensitivity || 1;
  const drawableHeight = Math.max(height - CHART_TOP - CHART_BOTTOM, 0);

  return (sensitivity: number) => {
    const position =
      (maximumSensitivity - Math.log10(Math.max(sensitivity, 1))) / sensitivityRange;

    return CHART_TOP + clamp(position, 0, 1) * drawableHeight;
  };
}

function createChartPoints(
  points: CsfGraphProps['points'],
  width: number,
  sensitivityToY: (sensitivity: number) => number
) {
  const frequencies = points.map((point) => Math.log10(Math.max(point.spatialFrequency, 0.01)));
  const frequencyDomain = frequencies.length === 0 ? [0] : frequencies;
  const minimumFrequency = Math.min(...frequencyDomain);
  const maximumFrequency = Math.max(...frequencyDomain);
  const frequencyRange = maximumFrequency - minimumFrequency || 1;
  const drawableWidth = Math.max(width - CHART_INSET * 2, 0);

  return points.map((point) => ({
    ...point,
    x:
      CHART_INSET +
      ((Math.log10(Math.max(point.spatialFrequency, 0.01)) - minimumFrequency) / frequencyRange) *
        drawableWidth,
    y: sensitivityToY(point.sensitivity),
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

export function CsfGraph({ points, width, height, references = EMPTY_REFERENCES }: CsfGraphProps) {
  const sensitivityToY = useMemo(
    () => createSensitivityScale(points, references, height),
    [height, points, references]
  );
  const chartPoints = useMemo(
    () => createChartPoints(points, width, sensitivityToY),
    [points, sensitivityToY, width]
  );
  const path = createPath(chartPoints);
  const pathLength = getPathLength(chartPoints);
  const reduceMotion = useReducedMotion();
  const isStatic = reduceMotion || Platform.OS === 'web';
  const strokeDashoffset = useSharedValue(isStatic ? 0 : pathLength);
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeDashoffset.value,
  }));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedIndexRef = useRef<number | null>(null);
  const selectedPoint = selectedIndex === null ? null : chartPoints[selectedIndex];
  const baselineY = height - CHART_BOTTOM;
  const firstPoint = chartPoints[0];
  const lastPoint = chartPoints.at(-1);
  const areaPath =
    path && firstPoint && lastPoint
      ? `${path} L ${lastPoint.x} ${baselineY} L ${firstPoint.x} ${baselineY} Z`
      : '';
  const referenceLines = references.map((reference) => ({
    ...reference,
    y: sensitivityToY(reference.sensitivity),
  }));
  const normReference = referenceLines.find((reference) => reference.label === 'Norm');
  const targetReference = referenceLines.find((reference) => reference.label === 'Target');
  const safeZone =
    normReference && targetReference
      ? {
          height: Math.abs(normReference.y - targetReference.y),
          y: Math.min(normReference.y, targetReference.y),
        }
      : null;

  useEffect(() => {
    if (isStatic) {
      strokeDashoffset.value = 0;
      return;
    }

    strokeDashoffset.value = pathLength;
    strokeDashoffset.value = withTiming(0, {
      duration: 1100,
      easing: Easing.out(Easing.cubic),
    });

    return () => cancelAnimation(strokeDashoffset);
  }, [isStatic, pathLength, strokeDashoffset]);

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
      haptics.select();
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
          {safeZone ? (
            <Rect
              fill={verdict.improving}
              fillOpacity={0.05}
              height={safeZone.height}
              width={Math.max(width - CHART_INSET * 2, 0)}
              x={CHART_INSET}
              y={safeZone.y}
            />
          ) : null}
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
          {referenceLines.map((reference) => (
            <Line
              key={reference.label}
              stroke={text.muted}
              strokeDasharray="4 4"
              strokeOpacity={0.6}
              strokeWidth={1}
              x1={CHART_INSET}
              x2={width - CHART_INSET}
              y1={reference.y}
              y2={reference.y}
            />
          ))}
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
              strokeDasharray="3 3"
              strokeWidth={1}
              x1={selectedPoint.x}
              x2={selectedPoint.x}
              y1={CHART_TOP}
              y2={baselineY}
            />
          ) : null}
          <Defs>
            <LinearGradient gradientUnits="userSpaceOnUse" id="csfArea" x1={0} x2={0} y1={CHART_TOP} y2={baselineY}>
              <Stop offset="0" stopColor={ACCENT} stopOpacity={0.18} />
              <Stop offset="1" stopColor={ACCENT} stopOpacity={0} />
            </LinearGradient>
            <RadialGradient id="csfBloom" cx="50%" cy="50%" r="55%">
              <Stop offset="0%" stopColor={ACCENT_GLOW} stopOpacity={1} />
              <Stop offset="55%" stopColor={ACCENT_GLOW} stopOpacity={0.45} />
              <Stop offset="100%" stopColor={ACCENT_GLOW} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect
            fill="url(#csfBloom)"
            height={baselineY - CHART_TOP}
            opacity={0.1}
            width={Math.max(width - CHART_INSET * 2, 0)}
            x={CHART_INSET}
            y={CHART_TOP}
          />
          {areaPath ? <Path d={areaPath} fill="url(#csfArea)" stroke="none" /> : null}
          {path ? (
            <>
              {isStatic ? (
                <Path
                  d={path}
                  fill="none"
                  opacity={0.5}
                  stroke={ACCENT_GLOW}
                  strokeDashoffset={0}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={9}
                />
              ) : (
                <AnimatedPath
                  animatedProps={animatedProps}
                  d={path}
                  fill="none"
                  opacity={0.5}
                  stroke={ACCENT_GLOW}
                  strokeDasharray={pathLength}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={9}
                />
              )}
              {isStatic ? (
                <Path
                  d={path}
                  fill="none"
                  stroke={ACCENT}
                  strokeDashoffset={0}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                />
              ) : (
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
              )}
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
          {chartPoints.length > 0 ? (
            <TrajectoryPointLight
              coreR={3.5}
              isStatic={isStatic}
              pathLength={pathLength}
              points={chartPoints}
              progress={strokeDashoffset}
            />
          ) : null}
        </Svg>
        {referenceLines.map((reference) => (
          <AppText
            color="muted"
            key={reference.label}
            style={[styles.referenceLabel, { top: Math.max(0, reference.y - 14) }]}
            variant="micro">
            {reference.label}
          </AppText>
        ))}
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
  referenceLabel: {
    position: 'absolute',
    right: CHART_INSET,
    textAlign: 'right',
  },
  selectedDot: {
    backgroundColor: ACCENT,
    borderColor: surface.base,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: SELECTED_DOT_SIZE,
    position: 'absolute',
    width: SELECTED_DOT_SIZE,
  },
});
