import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { surface } from '@/theme/tokens';

export type ShimmerProps = {
  width: number | '100%';
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

const FULL_WIDTH_FALLBACK = 320;

export function Shimmer({ width, height, radius = 8, style }: ShimmerProps) {
  const sweepDistance = typeof width === 'number' ? width : FULL_WIDTH_FALLBACK;
  const translateX = useSharedValue(-sweepDistance);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(sweepDistance, { duration: 1200, easing: Easing.linear }),
      -1,
      false,
    );

    return () => cancelAnimation(translateX);
  }, [sweepDistance, translateX]);

  return (
    <View style={[styles.base, { width, height, borderRadius: radius }, style]}>
      <Animated.View style={[styles.sweep, animatedStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(155,161,166,0.12)', 'transparent']}
          end={{ x: 1, y: 0 }}
          start={{ x: 0, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: surface.raised,
    overflow: 'hidden',
  },
  sweep: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
});
