import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';

import { luminanceToLinearGray } from '@/core/displayCalibration';
import type { CalibrationProfile, GaborStimulus } from '@/types';

export type GaborCanvasHandle = {
  present: (stimulus: GaborStimulus) => Promise<{ onset: number; offset: number }>;
  clear: () => void;
};

type GaborCanvasProps = {
  calibration: CalibrationProfile;
  onReadyChange?: (ready: boolean) => void;
};

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 132;
const STOP_COUNT = 96;
const now = () => (globalThis.performance?.now?.() ?? Date.now());

function grayColor(luminanceCdM2: number, calibration: CalibrationProfile) {
  const gray = Math.round(luminanceToLinearGray(luminanceCdM2, calibration) * 255);
  const channel = Math.max(0, Math.min(255, gray)).toString(16).padStart(2, '0');

  return `#${channel}${channel}${channel}`;
}

function orientationVector(orientationDeg: number) {
  const radians = (orientationDeg * Math.PI) / 180;
  const dx = Math.cos(radians) * 0.5;
  const dy = Math.sin(radians) * 0.5;

  return {
    x1: 0.5 - dx,
    y1: 0.5 - dy,
    x2: 0.5 + dx,
    y2: 0.5 + dy,
  };
}

function useStripeStops(stimulus: GaborStimulus | null) {
  return useMemo(() => {
    if (!stimulus) {
      return [];
    }

    const cycles = Math.max(2.5, Math.min(10, stimulus.spatialFrequencyCpd * 1.45));
    const contrast = Math.max(0, Math.min(stimulus.contrast, 1));
    const opacity = contrast;

    return Array.from({ length: STOP_COUNT + 1 }, (_, index) => {
      const t = index / STOP_COUNT;
      const signal = Math.cos(2 * Math.PI * cycles * t + stimulus.phaseRad);

      return {
        color: signal >= 0 ? '#F9FEFF' : '#020506',
        offset: t,
        opacity: Math.max(0.06, Math.abs(signal)) * opacity,
      };
    });
  }, [stimulus]);
}

export const GaborCanvas = forwardRef<GaborCanvasHandle, GaborCanvasProps>(
  ({ calibration, onReadyChange }, ref) => {
    const rawId = useId().replace(/:/g, '');
    const stripeId = `gabor-stripes-${rawId}`;
    const windowId = `gabor-window-${rawId}`;
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mountedRef = useRef(false);
    const [stimulus, setStimulus] = useState<GaborStimulus | null>(null);
    const stops = useStripeStops(stimulus);
    const backgroundColor = grayColor(calibration.backgroundLuminanceCdM2, calibration);

    const clearTimeoutIfNeeded = useCallback(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }, []);

    useEffect(() => {
      mountedRef.current = true;
      onReadyChange?.(true);

      return () => {
        mountedRef.current = false;
        clearTimeoutIfNeeded();
        onReadyChange?.(false);
      };
    }, [clearTimeoutIfNeeded, onReadyChange]);

    useImperativeHandle(
      ref,
      () => ({
        clear: () => {
          clearTimeoutIfNeeded();
          setStimulus(null);
        },
        present: (nextStimulus) =>
          new Promise((resolve) => {
            clearTimeoutIfNeeded();
            const onset = now();
            setStimulus(nextStimulus);
            timeoutRef.current = setTimeout(() => {
              const offset = now();

              timeoutRef.current = null;
              if (mountedRef.current) {
                setStimulus(null);
              }
              resolve({ onset, offset });
            }, Math.max(0, nextStimulus.durationMs));
          }),
      }),
      [clearTimeoutIfNeeded]
    );

    const vector = stimulus ? orientationVector(stimulus.orientationDeg) : null;

    return (
      <View style={[styles.container, { backgroundColor }]}>
        {stimulus && vector ? (
          <Svg height={SIZE} width={SIZE}>
            <Defs>
              <LinearGradient id={stripeId} {...vector}>
                {stops.map((stop, index) => (
                  <Stop
                    key={index}
                    offset={stop.offset}
                    stopColor={stop.color}
                    stopOpacity={stop.opacity}
                  />
                ))}
              </LinearGradient>
              <RadialGradient id={windowId} cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={backgroundColor} stopOpacity={0} />
                <Stop offset="58%" stopColor={backgroundColor} stopOpacity={0} />
                <Stop offset="82%" stopColor={backgroundColor} stopOpacity={0.5} />
                <Stop offset="100%" stopColor={backgroundColor} stopOpacity={1} />
              </RadialGradient>
            </Defs>
            <Circle cx={CENTER} cy={CENTER} fill={backgroundColor} r={RADIUS} />
            <Circle cx={CENTER} cy={CENTER} fill={`url(#${stripeId})`} r={RADIUS} />
            <Circle cx={CENTER} cy={CENTER} fill={`url(#${windowId})`} r={RADIUS} />
          </Svg>
        ) : null}
      </View>
    );
  }
);

GaborCanvas.displayName = 'GaborCanvas';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
