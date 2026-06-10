import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { material } from '@/theme/tokens';

export type GlassSurfaceProps = {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  radius?: number;
  interactive?: boolean;
};

export function GlassSurface({
  style,
  children,
  radius = material.radius,
  interactive = false,
}: GlassSurfaceProps) {
  const liquidGlass =
    Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  const blurIntensity =
    Platform.OS === 'ios' ? Math.max(material.blurIntensity, 58) : material.blurIntensity;
  const glassStyle = [styles.surface, { borderRadius: radius }, style, styles.liquidSurface];

  if (liquidGlass) {
    return (
      <GlassView
        colorScheme="dark"
        glassEffectStyle={{ style: 'regular', animate: true, animationDuration: 0.2 }}
        isInteractive={interactive}
        style={glassStyle}
        tintColor="rgba(10, 18, 21, 0.42)">
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.16)',
            'rgba(91,233,236,0.035)',
            'rgba(255,255,255,0.018)',
          ]}
          pointerEvents="none"
          style={styles.overlay}
        />
        <View pointerEvents="none" style={styles.topEdge} />
        {children}
      </GlassView>
    );
  }

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
  liquidSurface: {
    backgroundColor: 'transparent',
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
