import { useId, useState } from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { accent } from '@/theme/tokens';

export type BloomProps = {
  color?: string;
  core?: string;
  edge?: string;
  opacity?: number;
  rx?: string;
  ry?: string;
  style?: StyleProp<ViewStyle>;
};

const RADIUS_FACTOR = 1.05;

export function Bloom({
  color = accent.glow,
  core,
  edge,
  opacity = 1,
  rx,
  ry,
  style,
}: BloomProps) {
  const rawId = useId();
  const [size, setSize] = useState({ height: 0, width: 0 });
  const gradientId = `bloom-${rawId.replace(/:/g, '')}`;
  const radius = (Math.max(size.height, size.width) / 2) * RADIUS_FACTOR;
  const hasSize = size.height > 0 && size.width > 0;
  const radiusX = resolveRadius(rx, radius, size.width);
  const radiusY = resolveRadius(ry, radius, size.height);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;

    setSize((current) =>
      current.height === height && current.width === width ? current : { height, width }
    );
  };

  return (
    <View onLayout={handleLayout} pointerEvents="none" style={[styles.bloom, { opacity }, style]}>
      {hasSize ? (
        <Svg height="100%" width="100%">
          <Defs>
            <RadialGradient
              cx={size.width / 2}
              cy={size.height / 2}
              gradientUnits="userSpaceOnUse"
              id={gradientId}
              rx={radiusX}
              ry={radiusY}>
              {core
                ? [
                    <Stop key="core" offset="0%" stopColor={core} stopOpacity={1} />,
                    <Stop key="color" offset="38%" stopColor={color} stopOpacity={0.55} />,
                    <Stop key="edge" offset="100%" stopColor={edge ?? color} stopOpacity={0} />,
                  ]
                : [
                    <Stop key="core" offset="0%" stopColor={color} stopOpacity={1} />,
                    <Stop key="color" offset="55%" stopColor={color} stopOpacity={0.5} />,
                    <Stop key="edge" offset="100%" stopColor={color} stopOpacity={0} />,
                  ]}
            </RadialGradient>
          </Defs>
          <Rect fill={`url(#${gradientId})`} height="100%" width="100%" />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bloom: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});

function resolveRadius(value: string | undefined, fallback: number, axis: number) {
  if (!value) {
    return fallback;
  }
  if (value.endsWith('%')) {
    const percent = Number.parseFloat(value.slice(0, -1));

    return Number.isFinite(percent) ? (axis * percent) / 100 : fallback;
  }

  const numeric = Number.parseFloat(value);

  return Number.isFinite(numeric) ? numeric : fallback;
}
