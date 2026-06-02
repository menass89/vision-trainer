import { useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
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

export function Bloom({
  color = accent.glow,
  core,
  edge,
  opacity = 1,
  rx = '55%',
  ry = '60%',
  style,
}: BloomProps) {
  const rawId = useId();
  const gradientId = `bloom-${rawId.replace(/:/g, '')}`;

  return (
    <View pointerEvents="none" style={[styles.bloom, { opacity }, style]}>
      <Svg height="100%" width="100%">
        <Defs>
          <RadialGradient cx="50%" cy="50%" id={gradientId} rx={rx} ry={ry}>
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
