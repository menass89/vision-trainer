import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { material } from '@/theme/tokens';

export type GlassSurfaceProps = {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  radius?: number;
};

export function GlassSurface({ style, children, radius = material.radius }: GlassSurfaceProps) {
  const blurIntensity =
    Platform.OS === 'ios' ? Math.max(material.blurIntensity, 58) : material.blurIntensity;

  return (
    <BlurView
      experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
      intensity={blurIntensity}
      style={[styles.surface, { borderRadius: radius }, style]}
      tint={material.blurTint}>
      <LinearGradient
        colors={[
          'rgba(255,255,255,0.11)',
          'rgba(51,210,214,0.035)',
          'rgba(255,255,255,0.015)',
        ]}
        pointerEvents="none"
        style={styles.overlay}
      />
      <View pointerEvents="none" style={styles.topEdge} />
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    bottom: 0,
    left: 0,
    opacity: 0.5,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  surface: {
    backgroundColor: 'rgba(10, 17, 20, 0.38)',
    borderColor: material.hairlineOnGlass,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topEdge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    height: StyleSheet.hairlineWidth,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
