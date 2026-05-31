import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ACCENT, surface } from '@/theme/tokens';

const SIZE = 184;
const STROKE = 2;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export type BaselineRingProps = {
  progress?: number;
};

export function BaselineRing({ progress = 0.08 }: BaselineRingProps) {
  const clamped = Math.max(0, Math.min(progress, 1));
  const dash = clamped * CIRCUMFERENCE;
  const center = SIZE / 2;

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Svg height={SIZE} width={SIZE}>
        <Circle
          cx={center}
          cy={center}
          fill="none"
          r={RADIUS}
          stroke={surface.hairline}
          strokeWidth={STROKE}
        />
        <Circle
          cx={center}
          cy={center}
          fill="none"
          r={RADIUS}
          stroke={ACCENT}
          strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
          strokeLinecap="round"
          strokeWidth={STROKE}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
