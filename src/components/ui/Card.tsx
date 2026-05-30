import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { hairline, radius, space, surface } from '@/theme/tokens';

export type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  raised?: boolean;
};

export function Card({ children, style, raised = false }: CardProps) {
  return <View style={[styles.card, raised && styles.raised, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: surface.raised,
    borderWidth: hairline.px1,
    borderColor: surface.hairline,
    borderRadius: radius.lg,
    padding: space.base,
  },
  raised: {
    backgroundColor: surface.overlay,
  },
});
