import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, space } from '@/theme/tokens';

import { GlassSurface } from './GlassSurface';

export type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  raised?: boolean;
};

export function Card({ children, style, raised = false }: CardProps) {
  return (
    <View style={styles.shadow}>
      <GlassSurface radius={radius.lg} style={[styles.card, raised && styles.raised, style]}>
        {children}
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: space.base,
  },
  raised: {
    backgroundColor: 'rgba(14, 22, 25, 0.44)',
  },
  shadow: {
    borderRadius: radius.lg,
    elevation: 2,
    shadowColor: '#071114',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
});
