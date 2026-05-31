import { useCallback, useEffect, useRef, type ComponentProps, type ComponentType } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { Variant } from '@/components/ui';
import { easings } from '@/theme/motion';
import { tabularFigures, text, type as typo } from '@/theme/tokens';

export type CountUpNumberProps = {
  from: number;
  to: number;
  durationMs: number;
  variant?: Variant;
  onSettle?: () => void;
};

type CountUpTextInputProps = ComponentProps<typeof TextInput> & {
  animatedProps: Partial<{ text: string }>;
};

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput) as unknown as ComponentType<
  CountUpTextInputProps
>;

export function CountUpNumber({
  from,
  to,
  durationMs,
  variant = 'display',
  onSettle,
}: CountUpNumberProps) {
  const value = useSharedValue(from);
  const reduceMotion = useReducedMotion();
  const didSettleRef = useRef(false);
  const handleSettle = useCallback(() => {
    if (didSettleRef.current) return;

    didSettleRef.current = true;
    onSettle?.();
  }, [onSettle]);

  useEffect(() => {
    didSettleRef.current = false;
    value.value = from;

    if (reduceMotion) {
      value.value = to;
      handleSettle();
      return;
    }

    value.value = withTiming(to, { duration: durationMs, easing: easings.out }, (finished) => {
      if (finished) runOnJS(handleSettle)();
    });

    return () => cancelAnimation(value);
  }, [durationMs, from, handleSettle, reduceMotion, to, value]);

  const animatedProps = useAnimatedProps(() => ({
    text: value.value.toFixed(2),
  }));

  return (
    <AnimatedTextInput
      animatedProps={animatedProps}
      defaultValue={from.toFixed(2)}
      editable={false}
      style={[styles.number, typo[variant], { height: typo[variant].lineHeight }]}
      underlineColorAndroid="transparent"
    />
  );
}

const styles = StyleSheet.create({
  number: {
    color: text.primary,
    fontVariant: [...tabularFigures.fontVariant],
    padding: 0,
    textAlign: 'center',
    width: '100%',
  },
});
