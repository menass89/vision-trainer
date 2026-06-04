import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { material, surface } from '@/theme/tokens';

export type GlassSurfaceProps = {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  radius?: number;
};

export function GlassSurface({ style, children, radius = material.radius }: GlassSurfaceProps) {
  const blurIntensity =
    Platform.OS === 'ios' ? Math.max(material.blurIntensity, 50) : material.blurIntensity;

  return (
    <BlurView
      experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
      intensity={blurIntensity}
      style={[styles.surface, { borderRadius: radius }, style]}
      tint={material.blurTint}>
      <LinearGradient
        colors={[surface.warm, 'transparent']}
        pointerEvents="none"
        style={styles.overlay}
      />
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: 'rgba(18, 24, 28, 0.55)',
    borderColor: material.hairlineOnGlass,
    borderWidth: 1,
    overflow: 'hidden',
  },
  overlay: {
    bottom: 0,
    left: 0,
    opacity: 0.5,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
