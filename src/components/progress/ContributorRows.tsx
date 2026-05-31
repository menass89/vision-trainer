import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui';
import { easings } from '@/theme/motion';
import { data, radius, space, verdict } from '@/theme/tokens';

export type ContributorRowsProps = {
  rows: { label: string; sensitivity: number; norm: number }[];
};

type ContributorRowProps = ContributorRowsProps['rows'][number] & {
  delay: number;
  maxSensitivity: number;
  isStatic: boolean;
};

function getDivergingColor(sensitivity: number, norm: number) {
  const ratio = sensitivity / norm;

  if (ratio >= 1.15) return verdict.improving;
  if (ratio <= 0.9) return verdict.regressing;
  return verdict.holding;
}

function ContributorRow({
  label,
  sensitivity,
  norm,
  delay,
  maxSensitivity,
  isStatic,
}: ContributorRowProps) {
  const targetPct = Math.min((sensitivity / maxSensitivity) * 100, 100);
  const progress = useSharedValue(isStatic ? targetPct : 0);
  const fillColor = getDivergingColor(sensitivity, norm);
  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%` as `${number}%`,
  }));

  useEffect(() => {
    if (isStatic) {
      progress.value = targetPct;
      return;
    }

    progress.value = 0;
    progress.value = withDelay(
      delay,
      withTiming(targetPct, { duration: 600, easing: easings.out })
    );

    return () => cancelAnimation(progress);
  }, [delay, isStatic, progress, targetPct]);

  return (
    <View style={styles.row}>
      <AppText color="secondary" style={styles.label} tabular variant="caption">
        {label}
      </AppText>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { backgroundColor: fillColor }, animatedStyle]} />
      </View>
      <AppText style={[styles.value, { color: fillColor }]} tabular variant="caption">
        {sensitivity}
      </AppText>
    </View>
  );
}

export function ContributorRows({ rows }: ContributorRowsProps) {
  const reduceMotion = useReducedMotion();
  const isStatic = reduceMotion || Platform.OS === 'web';
  const maxSensitivity = Math.max(...rows.map((row) => row.sensitivity), 1);

  return (
    <View style={styles.list}>
      {rows.map((row, index) => (
        <ContributorRow
          {...row}
          delay={index * 40}
          isStatic={isStatic}
          key={row.label}
          maxSensitivity={maxSensitivity}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    borderRadius: radius.pill,
    height: '100%',
  },
  label: {
    width: 64,
  },
  list: {
    gap: space.md,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.sm,
  },
  track: {
    backgroundColor: data.track,
    borderRadius: radius.pill,
    flex: 1,
    height: 4,
    overflow: 'hidden',
  },
  value: {
    textAlign: 'right',
    width: 40,
  },
});
