import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from './AppText';
import { PressableScale, type PressableScaleProps } from './PressableScale';
import { ACCENT, ACCENT_CORE, radius, space, surface } from '@/theme/tokens';

export type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'solid' | 'ghost';
  haptic?: PressableScaleProps['haptic'];
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

// One committing action per screen = the solid cyan pill (Today, Progress, Onboarding).
// Ghost = a softer secondary commit. The internal sheen gives the fill a faint top-light.
export function PrimaryButton({
  label,
  onPress,
  variant = 'solid',
  haptic = 'select',
  accessibilityLabel,
  disabled = false,
  style,
  children,
}: PrimaryButtonProps) {
  const isSolid = variant === 'solid';

  return (
    <PressableScale
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      disabled={disabled}
      haptic={haptic}
      onPress={onPress}
      scaleTo={0.96}
      style={[styles.base, isSolid ? styles.solid : styles.ghost, style]}>
      {isSolid ? (
        <>
          <LinearGradient
            colors={[ACCENT_CORE, ACCENT]}
            end={{ x: 0.5, y: 1 }}
            pointerEvents="none"
            start={{ x: 0.5, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']}
            end={{ x: 0.5, y: 1 }}
            pointerEvents="none"
            start={{ x: 0.5, y: 0 }}
            style={styles.sheen}
          />
        </>
      ) : null}
      <AppText color={isSolid ? 'inverse' : 'primary'} variant="heading">
        {label}
      </AppText>
      {children}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.pill,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingVertical: space.base,
  },
  solid: {
    backgroundColor: ACCENT,
    // iOS-only cyan glow (premium CTA signature). No Android `elevation` — it would
    // ignore shadowColor and stamp a grey material box instead of this glow.
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
  },
  ghost: {
    backgroundColor: surface.raised,
    borderColor: surface.hairlineStrong,
    borderWidth: 1,
  },
  sheen: {
    height: '60%',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
