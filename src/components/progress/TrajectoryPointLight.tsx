import { useEffect, useMemo } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Circle } from 'react-native-svg';

import { ACCENT, ACCENT_GLOW, motion } from '@/theme/tokens';

export type Pt = {
  x: number;
  y: number;
};

export type TrajectoryPointLightProps = {
  points: Pt[];
  pathLength: number;
  progress: SharedValue<number>;
  isStatic: boolean;
  coreR?: number;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function TrajectoryPointLight({
  points,
  pathLength,
  progress,
  isStatic,
  coreR = 3.5,
}: TrajectoryPointLightProps) {
  const { lastPoint, segs } = useMemo(() => {
    let cumulativeLength = 0;

    return {
      lastPoint: points.at(-1),
      segs: points.slice(1).map((point, index) => {
        const previous = points[index];
        const len = Math.hypot(point.x - previous.x, point.y - previous.y);
        const segment = {
          d0: cumulativeLength,
          len,
          x0: previous.x,
          y0: previous.y,
          x1: point.x,
          y1: point.y,
        };

        cumulativeLength += len;
        return segment;
      }),
    };
  }, [points]);
  const breathe = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(breathe);
    if (isStatic) {
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
  }, [breathe, isStatic]);

  function posAt(traveled: number) {
    'worklet';
    const fallback = lastPoint ?? { x: 0, y: 0 };
    const clamped = Math.min(Math.max(traveled, 0), pathLength);

    for (let index = 0; index < segs.length; index += 1) {
      const segment = segs[index];

      if (clamped <= segment.d0 + segment.len || index === segs.length - 1) {
        const t = segment.len === 0 ? 0 : (clamped - segment.d0) / segment.len;

        return {
          x: segment.x0 + (segment.x1 - segment.x0) * t,
          y: segment.y0 + (segment.y1 - segment.y0) * t,
        };
      }
    }

    return fallback;
  }

  const coreProps = useAnimatedProps(() => {
    const traveled = pathLength - progress.value;
    const point = posAt(traveled);
    const drawT = pathLength <= 0 ? 1 : 1 - progress.value / pathLength;
    const appear = Math.max(0, Math.min(drawT / 0.12, 1));

    return {
      cx: point.x,
      cy: point.y,
      opacity: appear,
    } as any;
  });
  const haloProps = useAnimatedProps(() => {
    const traveled = pathLength - progress.value;
    const point = posAt(traveled);
    const drawT = pathLength <= 0 ? 1 : 1 - progress.value / pathLength;
    const appear = Math.max(0, Math.min(drawT / 0.12, 1));

    return {
      cx: point.x,
      cy: point.y,
      opacity: appear * (0.5 + breathe.value * 0.4),
      r: coreR * 2.6 * (1 + breathe.value * 0.06),
    } as any;
  });

  if (points.length === 0) return null;

  return (
    <>
      <AnimatedCircle
        animatedProps={haloProps}
        fill={ACCENT_GLOW}
        r={coreR * 2.6}
      />
      <AnimatedCircle
        animatedProps={coreProps}
        fill="#CFFCFD"
        r={coreR}
        stroke={ACCENT}
        strokeWidth={1.5}
      />
    </>
  );
}
