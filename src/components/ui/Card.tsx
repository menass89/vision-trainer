import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { hairline, radius, space, surface } from '@/theme/tokens';

const CARD_FILL = ['#11171B', '#0C1014'] as const;
const RAISED_FILL = ['#141F22', '#0E1316'] as const;

export type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  raised?: boolean;
};

export function Card({ children, style, raised = false }: CardProps) {
  return (
    <View style={styles.shadow}>
      <View style={[styles.card, raised && styles.raised, style]}>
        <LinearGradient
          colors={raised ? RAISED_FILL : CARD_FILL}
          end={{ x: 0.5, y: 1 }}
          pointerEvents="none"
          start={{ x: 0.5, y: 0 }}
          style={styles.fill}
        />
        <View pointerEvents="none" style={styles.topEdge} />
        <View pointerEvents="none" style={styles.bottomEdge} />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  card: {
    backgroundColor: surface.raised,
    borderColor: surface.hairline,
    borderRadius: radius.lg,
    borderWidth: hairline.px1,
    overflow: 'hidden',
    padding: space.base,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  raised: {
    backgroundColor: surface.overlay,
  },
  bottomEdge: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    bottom: 0,
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  topEdge: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
