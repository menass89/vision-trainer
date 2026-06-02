import { useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, FeColorMatrix, FeTurbulence, Filter, Rect } from 'react-native-svg';

export type GrainProps = {
  opacity?: number;
  style?: StyleProp<ViewStyle>;
};

export function Grain({ opacity = 0.035, style }: GrainProps) {
  const rawId = useId();
  const filterId = `grain-${rawId.replace(/:/g, '')}`;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }, style]}>
      <Svg height="100%" width="100%">
        <Defs>
          <Filter id={filterId} x="0" y="0" height="100%" width="100%">
            <FeTurbulence baseFrequency="0.9" numOctaves={2} result="noise" type="fractalNoise" />
            {/* collapse to monochrome alpha-modulated grain */}
            <FeColorMatrix
              in="noise"
              type="matrix"
              values="0 0 0 0 0.55  0 0 0 0 0.6  0 0 0 0 0.6  0 0 0 0.5 0"
            />
          </Filter>
        </Defs>
        <Rect height="100%" width="100%" filter={`url(#${filterId})`} />
      </Svg>
    </View>
  );
}
