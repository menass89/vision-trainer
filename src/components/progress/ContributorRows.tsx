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

import { AppText, Hairline } from '@/components/ui';
import { easings } from '@/theme/motion';
import { data, radius, space, surface, verdict } from '@/theme/tokens';

export type ContributorRowsProps = {
  rows: { label: string; sensitivity: number; norm: number }[];
};

type ContributorRowProps = ContributorRowsProps['rows'][number] & {
  delay: number;
  isLast: boolean;
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
  isLast,
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
      <View style={styles.topRow}>
        <AppText color="muted" tabular uppercase variant="micro">
          {label}
        </AppText>
        <View style={styles.leader} />
        <AppText style={[styles.value, { color: fillColor }]} tabular variant="caption">
          {sensitivity}
        </AppText>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { backgroundColor: fillColor }, animatedStyle]} />
      </View>
      {isLast ? null : <Hairline style={styles.divider} />}
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
          isLast={index === rows.length - 1}
          isStatic={isStatic}
          key={row.label}
          maxSensitivity={maxSensitivity}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    marginTop: space.sm,
  },
  fill: {
    borderRadius: radius.pill,
    height: '100%',
  },
  leader: {
    alignSelf: 'flex-end',
    borderBottomColor: surface.hairline,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dotted',
    flex: 1,
    marginBottom: space.xs,
    marginHorizontal: space.sm,
  },
  list: {
    gap: space.md,
  },
  row: {
    flexDirection: 'column',
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  track: {
    backgroundColor: data.track,
    borderRadius: radius.pill,
    height: 2,
    marginTop: space.xs,
    overflow: 'hidden',
    width: '100%',
  },
  value: {
    textAlign: 'right',
    width: 40,
  },
});
