import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { surface } from '@/theme/tokens';

export type HairlineProps = {
  inset?: number;
  style?: StyleProp<ViewStyle>;
};

export function Hairline({ inset = 0, style }: HairlineProps) {
  return <View style={[styles.hairline, { marginHorizontal: inset }, style]} />;
}

const styles = StyleSheet.create({
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: surface.hairline,
    alignSelf: 'stretch',
  },
});
