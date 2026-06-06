import { useCallback, useEffect, useRef, type ComponentType, type ComponentProps } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { AmbientGradient } from '@/components/home/AmbientGradient';
import { CelestialGabor } from '@/components/home/CelestialGabor';
import { AppText, Bloom, GlassSurface, PressableScale } from '@/components/ui';
import { useTodayData } from '@/presenters';
import { haptics } from '@/theme/haptics';
import { easings } from '@/theme/motion';
import {
  ACCENT,
  ACCENT_GLOW,
  material,
  motion,
  radius,
  space,
  surface,
  tabularFigures,
  text,
  type as typeScale,
} from '@/theme/tokens';

export type CompletionRewardProps = {
  accuracyTarget: number;
  actionLabel?: string;
  correctCount: number;
  total: number;
  onDone: () => void;
  reduceMotion?: boolean;
  subtitle?: string;
};

type CountUpTextInputProps = ComponentProps<typeof TextInput> & {
  animatedProps: Partial<{ text: string }>;
};

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput) as unknown as ComponentType<
  CountUpTextInputProps
>;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RING_SIZE = 132;
const RING_CENTER = RING_SIZE / 2;
const RING_RADIUS = 58;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function CompletionReward({
  accuracyTarget,
  actionLabel = 'Done',
  correctCount,
  total,
  onDone,
  reduceMotion = false,
  subtitle = 'Come back tomorrow',
}: CompletionRewardProps) {
  const today = useTodayData();
  const streakNow = today.data.streakDays;
  const streakWasCounted = today.data.sessionDoneToday;
  const streakFrom = Math.max(streakNow - 1, 0);
  const showStreak = streakNow > 0;
  // Only celebrate the +1 once today's session is actually recorded — recordSessionResult
  // is fired without awaiting, so streakNow can lead sessionDoneToday for a frame. Gate the
  // count-up and milestone haptic on the live recorded state, never the optimistic streak.
  const streakIncrements = streakWasCounted && streakNow > streakFrom;
  const didSettleRef = useRef(false);
  const streakTargetRef = useRef(streakNow);
  const backdropOpacity = useSharedValue(0);
  const skyIgnite = useSharedValue(0);
  const bloomOpacity = useSharedValue(0);
  const bloomScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(-40);
  const accuracy = useSharedValue(0);
  const constellation = useSharedValue(0);
  const streak = useSharedValue(streakFrom);
  const streakRowOpacity = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);
  const ctaTranslateY = useSharedValue(12);
  const subtitleOpacity = useSharedValue(0);

  const handleNumberSettle = useCallback(() => {
    if (didSettleRef.current) return;

    didSettleRef.current = true;
    haptics.numberSettle();
  }, []);

  useEffect(() => {
    streakTargetRef.current = streakNow;
  }, [streakNow, streakWasCounted]);

  useEffect(() => {
    if (reduceMotion) {
      backdropOpacity.value = 0.82;
      skyIgnite.value = 1;
      bloomOpacity.value = 0.5;
      bloomScale.value = 1;
      cardOpacity.value = 1;
      cardTranslateY.value = 0;
      accuracy.value = accuracyTarget;
      constellation.value = 1;
      streak.value = streakTargetRef.current;
      streakRowOpacity.value = 1;
      ctaOpacity.value = 1;
      ctaTranslateY.value = 0;
      subtitleOpacity.value = 1;
      return;
    }

    backdropOpacity.value = withTiming(0.82, { duration: 360 });
    skyIgnite.value = withDelay(60, withTiming(1, { duration: 460, easing: easings.out }));
    bloomOpacity.value = withSequence(
      withTiming(0.85, { duration: 300 }),
      withTiming(0.5, { duration: 300 })
    );
    bloomScale.value = withSpring(1, motion.spring.reward);
    cardOpacity.value = withDelay(360, withTiming(1, { duration: 200 }));
    cardTranslateY.value = withSpring(0, motion.spring.reward);
    accuracy.value = withDelay(
      520,
      withTiming(
        accuracyTarget,
        { duration: motion.timing.countUpRewardMs, easing: easings.out },
        (finished) => {
          if (finished) runOnJS(handleNumberSettle)();
        }
      )
    );
    constellation.value = withDelay(
      900,
      withTiming(1, { duration: motion.timing.drawOnMs, easing: easings.out })
    );
    streakRowOpacity.value = withDelay(1500, withTiming(1, { duration: 280, easing: easings.out }));
    ctaOpacity.value = withDelay(2300, withTiming(1, { duration: 280, easing: easings.out }));
    ctaTranslateY.value = withDelay(2300, withSpring(0, motion.spring.snap));
    subtitleOpacity.value = withDelay(2300, withTiming(1, { duration: 280, easing: easings.out }));
  }, [
    accuracyTarget,
    handleNumberSettle,
    reduceMotion,
  ]);

  useEffect(() => {
    if (reduceMotion) {
      streak.value = streakTargetRef.current;
      return;
    }

    const timeout = setTimeout(() => {
      const target = streakTargetRef.current;

      if (target > streakFrom) {
        streak.value = streakFrom;
        streak.value = withTiming(
          target,
          { duration: motion.timing.countUpProgressMs, easing: easings.out },
          (finished) => {
            if (finished && streakIncrements) runOnJS(haptics.milestone)();
          }
        );
      } else {
        streak.value = target;
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, [
    reduceMotion,
    streakFrom,
    streakIncrements,
  ]);

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));
  const skyStyle = useAnimatedStyle(() => ({
    opacity: skyIgnite.value,
  }));
  const gaborLayerStyle = useAnimatedStyle(() => ({
    opacity: skyIgnite.value,
  }));
  const bloomStyle = useAnimatedStyle(() => ({
    opacity: bloomOpacity.value,
    transform: [{ scale: bloomScale.value }],
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));
  const accuracyProps = useAnimatedProps(() => ({
    text: `${Math.round(accuracy.value)}`,
  }));
  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRCUMFERENCE * (1 - constellation.value),
  }));
  const streakProps = useAnimatedProps(() => ({
    text: `${Math.round(streak.value)}`,
  }));
  const streakRowStyle = useAnimatedStyle(() => ({
    opacity: streakRowOpacity.value,
    transform: [{ translateY: 8 * (1 - streakRowOpacity.value) }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaTranslateY.value }],
  }));
  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  return (
    <View style={styles.backdrop}>
      <Animated.View pointerEvents="none" style={[styles.backdropFill, backdropAnimStyle]} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, skyStyle]}>
        <AmbientGradient constellation reduceMotion={reduceMotion} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.gaborLayer, gaborLayerStyle]}>
        <CelestialGabor contrast={1} reduceMotion={reduceMotion} resolveOnMount />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.bloom, bloomStyle]}>
        <Bloom color={ACCENT_GLOW} />
      </Animated.View>
      <Animated.View style={cardStyle}>
        <GlassSurface radius={material.radius} style={styles.card}>
          <Animated.View pointerEvents="none" style={styles.ring}>
            <Svg height={RING_SIZE} width={RING_SIZE}>
              <Circle
                cx={RING_CENTER}
                cy={RING_CENTER}
                fill="none"
                r={RING_RADIUS}
                stroke={surface.hairline}
                strokeWidth={1}
              />
              <AnimatedCircle
                animatedProps={ringProps}
                cx={RING_CENTER}
                cy={RING_CENTER}
                fill="none"
                r={RING_RADIUS}
                stroke={ACCENT}
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeLinecap="round"
                strokeWidth={1.5}
                transform={`rotate(-90 ${RING_CENTER} ${RING_CENTER})`}
              />
            </Svg>
          </Animated.View>
          <AppText color="muted" uppercase variant="micro">
            Session complete
          </AppText>
          <View accessible accessibilityLabel={`${accuracyTarget}% accuracy`} style={styles.accuracy}>
            <AnimatedTextInput
              animatedProps={accuracyProps}
              defaultValue="0"
              editable={false}
              style={styles.accuracyNumber}
              underlineColorAndroid="transparent"
            />
            <AppText style={styles.percent} tabular variant="display">
              %
            </AppText>
          </View>
          <AppText color="secondary" style={styles.correctLine} tabular variant="caption">
            {correctCount}/{total} correct
          </AppText>
          {showStreak ? (
            <Animated.View
              accessible
              accessibilityLabel={`${streakNow} day streak`}
              style={[styles.streakRow, streakRowStyle]}>
              <AnimatedTextInput
                animatedProps={streakProps}
                defaultValue={`${streakFrom}`}
                editable={false}
                style={styles.streakNumber}
                underlineColorAndroid="transparent"
              />
              <AppText color="secondary" style={styles.streakLabel} variant="caption">
                day streak
              </AppText>
            </Animated.View>
          ) : null}
        </GlassSurface>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.subtitleWrap, subtitleStyle]}>
        <AppText color="muted" variant="caption">
          {subtitle}
        </AppText>
      </Animated.View>
      <Animated.View style={ctaStyle}>
        <PressableScale
          accessibilityLabel="Finish session"
          accessibilityRole="button"
          onPress={onDone}
          style={styles.action}>
          <AppText color="inverse" variant="caption">
            {actionLabel}
          </AppText>
        </PressableScale>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  accuracy: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 0,
    marginTop: space.xl,
    width: 220,
  },
  accuracyNumber: {
    color: text.primary,
    fontFamily: typeScale.display.fontFamily,
    fontSize: 68,
    fontVariant: [...tabularFigures.fontVariant],
    height: 82,
    letterSpacing: 0,
    lineHeight: 82,
    padding: 0,
    textAlign: 'right',
    width: 144,
  },
  action: {
    alignItems: 'center',
    backgroundColor: ACCENT,
    borderColor: ACCENT_GLOW,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: space.lg,
    minWidth: 112,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  backdrop: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    paddingHorizontal: space.xl,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  backdropFill: {
    backgroundColor: surface.base,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  bloom: {
    height: 320,
    position: 'absolute',
    width: 320,
  },
  card: {
    alignItems: 'center',
    minWidth: 292,
    paddingHorizontal: space.xl,
    paddingVertical: space.xl,
  },
  correctLine: {
    marginTop: -2,
  },
  gaborLayer: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    transform: [{ scale: 0.9 }],
  },
  percent: {
    color: text.primary,
    fontFamily: typeScale.title.fontFamily,
    fontSize: 32,
    lineHeight: 44,
    marginLeft: 8,
    paddingBottom: 6,
  },
  ring: {
    alignItems: 'center',
    height: RING_SIZE,
    justifyContent: 'center',
    position: 'absolute',
    top: 72,
    width: RING_SIZE,
  },
  streakLabel: {
    marginLeft: 6,
  },
  streakNumber: {
    color: text.secondary,
    fontFamily: typeScale.title.fontFamily,
    fontSize: 34,
    fontVariant: [...tabularFigures.fontVariant],
    height: 40,
    letterSpacing: 0,
    lineHeight: 40,
    minWidth: 58,
    padding: 0,
    textAlign: 'right',
  },
  streakRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    marginTop: space.md,
  },
  subtitleWrap: {
    alignItems: 'center',
    marginTop: space.lg,
  },
});
