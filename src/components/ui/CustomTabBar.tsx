import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { ACCENT, ACCENT_GLOW, material, motion, space, text } from '@/theme/tokens';

import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

type TabIconProps = {
  color: string;
  routeName: string;
};

function TabIcon({ color, routeName }: TabIconProps) {
  const content = (() => {
    switch (routeName) {
      case 'progress':
        return (
          <>
            <Path d="M3 17 C 8 17, 9 8, 13 8 S 18 5, 21 4" />
            <Circle cx={3} cy={17} r={1.4} />
            <Circle cx={21} cy={4} r={1.4} />
          </>
        );
      case 'settings':
        return (
          <>
            <Line x1={4} x2={20} y1={7} y2={7} />
            <Circle cx={16} cy={7} r={2} />
            <Line x1={4} x2={20} y1={12} y2={12} />
            <Circle cx={9} cy={12} r={2} />
            <Line x1={4} x2={20} y1={17} y2={17} />
            <Circle cx={14} cy={17} r={2} />
          </>
        );
      case 'index':
      default:
        return (
          <>
            <Circle cx={12} cy={12} r={8} />
            <Path d="M12 4 A8 8 0 0 1 18 7" />
          </>
        );
    }
  })();

  return (
    <Svg
      fill="none"
      height={24}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={24}>
      {content}
    </Svg>
  );
}

type TabButtonProps = {
  focused: boolean;
  label: string;
  onPress: () => void;
  routeName: string;
};

function TabButton({ focused, label, onPress, routeName }: TabButtonProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    const target = focused ? 1 : 0;
    if (reduceMotion) {
      progress.value = target;
      return;
    }
    progress.value = withSpring(target, motion.spring.snap);
  }, [focused, progress, reduceMotion]);

  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.06 }, { translateY: progress.value * -1 }],
  }));
  const accentLayerStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      haptic="selection"
      onPress={onPress}
      style={styles.tab}>
      <Animated.View style={[styles.iconWrap, liftStyle]}>
        <TabIcon color={text.muted} routeName={routeName} />
        <Animated.View style={[styles.iconOverlay, accentLayerStyle]}>
          <TabIcon color={ACCENT} routeName={routeName} />
        </Animated.View>
      </Animated.View>
      <View style={styles.labelWrap}>
        <AppText
          color="muted"
          numberOfLines={1}
          style={styles.label}
          uppercase
          variant="micro">
          {label}
        </AppText>
        <Animated.View pointerEvents="none" style={[styles.labelOverlay, accentLayerStyle]}>
          <AppText
            color="accent"
            numberOfLines={1}
            style={styles.label}
            uppercase
            variant="micro">
            {label}
          </AppText>
        </Animated.View>
      </View>
    </PressableScale>
  );
}

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const liquidGlass = isLiquidGlassAvailable();

  const row = (
    <View style={styles.row}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = descriptors[route.key].options.title ?? route.name;
        const handlePress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabButton
            focused={focused}
            key={route.key}
            label={label}
            onPress={handlePress}
            routeName={route.name}
          />
        );
      })}
    </View>
  );

  const sheen = (
    <LinearGradient
      colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)']}
      end={{ x: 0.5, y: 1 }}
      pointerEvents="none"
      start={{ x: 0.5, y: 0 }}
      style={styles.sheen}
    />
  );

  return (
    <View style={[styles.outer, { paddingBottom: insets.bottom + space.sm }]}>
      <View style={styles.pillShadow}>
        {liquidGlass ? (
          <GlassView
            colorScheme="dark"
            glassEffectStyle="regular"
            style={styles.pill}
            tintColor="rgba(12,20,23,0.55)">
            {sheen}
            {row}
          </GlassView>
        ) : (
          <BlurView
            experimentalBlurMethod="dimezisBlurView"
            intensity={material.blurIntensity}
            style={[styles.pill, styles.pillFallback]}
            tint="dark">
            {sheen}
            {row}
          </BlurView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
  },
  pillShadow: {
    borderRadius: 28,
    shadowColor: ACCENT_GLOW,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    width: '100%',
  },
  pill: {
    borderColor: material.hairlineOnGlass,
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  pillFallback: {
    backgroundColor: 'rgba(12,20,23,0.55)',
  },
  sheen: {
    height: '55%',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    width: '100%',
  },
  iconOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    letterSpacing: 1,
  },
  labelOverlay: {
    alignItems: 'center',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  labelWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    gap: space.sm,
  },
});
