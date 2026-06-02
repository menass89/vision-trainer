import { type Href, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AmbientGradient } from '@/components/home/AmbientGradient';
import { CelestialGabor } from '@/components/home/CelestialGabor';
import { AppText, Bloom, FadeIn, PrimaryButton, Screen, Shimmer } from '@/components/ui';
import { useTodayData } from '@/presenters';
import type { TodayView } from '@/presenters/types';
import {
  ACCENT,
  ACCENT_CORE,
  ACCENT_GLOW,
  ACCENT_MUTED,
  radius,
  space,
  surface,
} from '@/theme/tokens';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

type WeekRowProps = {
  activeIndex?: number;
  weekDays: boolean[];
};

function WeekRow({ activeIndex = 3, weekDays }: WeekRowProps) {
  return (
    <View style={styles.weekRow}>
      {DAYS.map((day, index) => {
        const isToday = index === activeIndex;
        // Honest per-day truth: a dot lights only if that calendar day was completed.
        const isDone = weekDays[index] ?? false;

        return (
          <View key={`${day}-${index}`} style={styles.dayCell}>
            <AppText color={isToday ? 'primary' : isDone ? 'secondary' : 'muted'} variant="micro">
              {day}
            </AppText>
            <View style={styles.dayDotFrame}>
              {isToday ? (
                <Bloom color={ACCENT_GLOW} style={styles.dayBloom} />
              ) : isDone ? (
                <Bloom color={ACCENT_GLOW} opacity={0.5} style={styles.dayBloomSoft} />
              ) : null}
              <View
                style={[
                  styles.dayDot,
                  isDone ? styles.dayDotDone : styles.dayDotFuture,
                  isToday && styles.dayDotToday,
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function TodayScreen() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { data, isLoading } = useTodayData();

  return (
    <Screen padded>
      <AmbientGradient constellation reduceMotion={reduceMotion} />
      {isLoading ? (
        <LoadingToday />
      ) : (
        <TodayContent data={data} reduceMotion={reduceMotion} router={router} />
      )}
    </Screen>
  );
}

type TodayContentProps = {
  data: TodayView;
  reduceMotion: boolean;
  router: ReturnType<typeof useRouter>;
};

function TodayContent({ data, reduceMotion, router }: TodayContentProps) {
  const discContrast =
    data.contrastSensitivity > 0 ? Math.min(1, 0.5 + data.contrastSensitivity * 0.22) : 0.32;

  return (
    <>
      <FadeIn style={styles.eyebrow}>
        <AppText color="muted" uppercase variant="micro">
          Today
        </AppText>
        {data.streakDays > 0 ? (
          <View style={styles.streakChip}>
            <AppText color="secondary" tabular variant="caption">
              {`${data.streakDays} day streak`}
            </AppText>
          </View>
        ) : null}
      </FadeIn>
      <View style={styles.spacer}>
        <FadeIn delay={20}>
          <View style={styles.orbScale}>
            <CelestialGabor
              contrast={discContrast}
              progress={data.sessionDoneToday ? 1 : data.streakDays === 0 ? 0.08 : 0.5}
              reduceMotion={reduceMotion}
              resolveOnMount
            />
          </View>
        </FadeIn>
      </View>
      <View style={styles.bottomBlock}>
        <FadeIn>
          <WeekRow activeIndex={data.todayIndex} weekDays={data.weekDays} />
        </FadeIn>
        <FadeIn delay={40} style={styles.titleBlock}>
          <AppText color="primary" variant="hero">
            {data.sessionDoneToday
              ? 'Come back\ntomorrow'
              : data.streakDays === 0
                ? 'Set your\nbaseline'
                : 'Ready when\nyou are'}
          </AppText>
          {data.streakDays === 0 && !data.sessionDoneToday ? null : (
            <AppText color="muted" variant="caption">
              {`Next · ${data.nextTargetLabel}`}
            </AppText>
          )}
        </FadeIn>
        <FadeIn delay={80}>
          <PrimaryButton
            accessibilityLabel={data.sessionDoneToday ? 'Train again' : 'Start session'}
            haptic="select"
            label={data.sessionDoneToday ? 'Train again' : 'Start session'}
            onPress={() => router.push('/session' as Href)}
          />
        </FadeIn>
      </View>
    </>
  );
}

function LoadingToday() {
  return (
    <>
      <FadeIn style={styles.eyebrow}>
        <Shimmer height={14} radius={radius.pill} width={48} />
        <Shimmer height={26} radius={radius.pill} width={92} />
      </FadeIn>
      <View style={styles.spacer} />
      <View style={styles.bottomBlock}>
        <FadeIn>
          <Shimmer height={34} radius={radius.pill} width="100%" />
        </FadeIn>
        <FadeIn delay={40} style={styles.loadingTitle}>
          <Shimmer height={40} radius={radius.md} width="100%" />
          <Shimmer height={40} radius={radius.md} style={styles.loadingTitleShort} width="100%" />
        </FadeIn>
        <FadeIn delay={80}>
          <Shimmer height={58} radius={radius.pill} width="100%" />
        </FadeIn>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: space.lg,
  },
  streakChip: {
    backgroundColor: surface.raised,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  spacer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: space.base,
  },
  orbScale: {
    transform: [{ scale: 1.08 }],
  },
  bottomBlock: {
    gap: space.lg,
    paddingBottom: space.xl,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  dayCell: {
    alignItems: 'center',
    gap: space.xs,
  },
  dayDotFrame: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  dayBloom: {
    height: 28,
    width: 28,
  },
  dayBloomSoft: {
    height: 18,
    width: 18,
  },
  dayDot: {
    borderRadius: radius.pill,
    height: 6,
    width: 6,
  },
  dayDotDone: {
    backgroundColor: ACCENT,
    borderRadius: radius.pill,
    height: 6,
    width: 6,
  },
  dayDotFuture: {
    backgroundColor: ACCENT_MUTED,
    opacity: 0.32,
  },
  dayDotToday: {
    backgroundColor: ACCENT_CORE,
    borderWidth: 0,
    height: 8,
    width: 8,
  },
  titleBlock: {
    gap: space.sm,
  },
  loadingTitle: {
    gap: space.sm,
    width: '60%',
  },
  loadingTitleShort: {
    width: '75%',
  },
});
