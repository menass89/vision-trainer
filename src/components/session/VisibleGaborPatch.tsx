import { useId, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';

import { surface } from '@/theme/tokens';
import type { GaborStimulus } from '@/types';

type VisibleGaborPatchProps = {
  stimulus: GaborStimulus | null;
};

const SIZE = 260;
const CENTER = SIZE / 2;
const RADIUS = 108;
const STOP_COUNT = 72;

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

    const cycles = Math.max(2.4, Math.min(9, stimulus.spatialFrequencyCpd * 1.45));
    const contrast = Math.max(0, Math.min(stimulus.contrast, 1));
    const opacity = 0.2 + contrast * 0.78;

    return Array.from({ length: STOP_COUNT + 1 }, (_, index) => {
      const t = index / STOP_COUNT;
      const signal = Math.cos(2 * Math.PI * cycles * t + stimulus.phaseRad);

      return {
        color: signal >= 0 ? '#F4FEFF' : '#020506',
        offset: t,
        opacity: Math.max(0.08, Math.abs(signal)) * opacity,
      };
    });
  }, [stimulus]);
}

export function VisibleGaborPatch({ stimulus }: VisibleGaborPatchProps) {
  const rawId = useId().replace(/:/g, '');
  const stripeId = `visible-gabor-stripes-${rawId}`;
  const windowId = `visible-gabor-window-${rawId}`;
  const stops = useStripeStops(stimulus);

  if (!stimulus) {
    return null;
  }

  const vector = orientationVector(stimulus.orientationDeg);

  return (
    <View pointerEvents="none" style={styles.layer}>
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
            <Stop offset="0%" stopColor={surface.base} stopOpacity={0} />
            <Stop offset="58%" stopColor={surface.base} stopOpacity={0} />
            <Stop offset="82%" stopColor={surface.base} stopOpacity={0.44} />
            <Stop offset="100%" stopColor={surface.base} stopOpacity={1} />
          </RadialGradient>
        </Defs>
        <Circle cx={CENTER} cy={CENTER} fill="#808080" r={RADIUS} />
        <Circle cx={CENTER} cy={CENTER} fill={`url(#${stripeId})`} r={RADIUS} />
        <Circle cx={CENTER} cy={CENTER} fill={`url(#${windowId})`} r={RADIUS} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
