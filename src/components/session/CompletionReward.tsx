import { useCallback, useEffect, useRef, type ComponentType, type ComponentProps } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppText, Bloom, GlassSurface, PressableScale } from '@/components/ui';
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
  type as typo,
} from '@/theme/tokens';

export type CompletionRewardProps = {
  accuracyTarget: number;
  correctCount: number;
  total: number;
  onDone: () => void;
};

type CountUpTextInputProps = ComponentProps<typeof TextInput> & {
  animatedProps: Partial<{ text: string }>;
};

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput) as unknown as ComponentType<
  CountUpTextInputProps
>;

export function CompletionReward({
  accuracyTarget,
  correctCount,
  total,
  onDone,
}: CompletionRewardProps) {
  const didSettleRef = useRef(false);
  const bloomOpacity = useSharedValue(0);
  const bloomScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(-40);
  const accuracy = useSharedValue(0);

  const handleNumberSettle = useCallback(() => {
    if (didSettleRef.current) return;

    didSettleRef.current = true;
    haptics.numberSettle();
  }, []);

  useEffect(() => {
    bloomOpacity.value = withSequence(
      withTiming(0.85, { duration: 300 }),
      withTiming(0.5, { duration: 300 })
    );
    bloomScale.value = withSpring(1, motion.spring.reward);
    cardOpacity.value = withTiming(1, { duration: 200 });
    cardTranslateY.value = withSpring(0, motion.spring.reward);
    accuracy.value = withTiming(
      accuracyTarget,
      { duration: motion.timing.countUpRewardMs, easing: easings.out },
      (finished) => {
        if (finished) runOnJS(handleNumberSettle)();
      }
    );
  }, [
    accuracy,
    accuracyTarget,
    bloomOpacity,
    bloomScale,
    cardOpacity,
    cardTranslateY,
    handleNumberSettle,
  ]);

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

  return (
    <View style={styles.backdrop}>
      <View pointerEvents="none" style={styles.backdropFill} />
      <Animated.View pointerEvents="none" style={[styles.bloom, bloomStyle]}>
        <Bloom color={ACCENT_GLOW} />
      </Animated.View>
      <Animated.View style={cardStyle}>
        <GlassSurface radius={material.radius} style={styles.card}>
          <AppText color="muted" uppercase variant="micro">
            Session complete
          </AppText>
          <View accessibilityLabel={`${accuracyTarget}% accuracy`} style={styles.accuracy}>
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
          <AppText color="secondary" tabular variant="caption">
            {correctCount}/{total} correct
          </AppText>
        </GlassSurface>
      </Animated.View>
      <PressableScale
        accessibilityLabel="Finish session"
        accessibilityRole="button"
        onPress={onDone}
        style={styles.action}>
        <AppText color="inverse" variant="caption">
          Done
        </AppText>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
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
    opacity: 0.82,
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
    minWidth: 272,
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
  },
  accuracy: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: space.md,
  },
  accuracyNumber: {
    ...typo.display,
    color: text.primary,
    fontVariant: [...tabularFigures.fontVariant],
    height: typo.display.lineHeight,
    padding: 0,
    textAlign: 'right',
    width: 156,
  },
  percent: {
    color: text.primary,
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
});
