import { type Href, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AmbientGradient } from '@/components/home/AmbientGradient';
import { AppText, Bloom, FadeIn, PressableScale, Screen, Shimmer } from '@/components/ui';
import { useTodayData } from '@/presenters';
import { ACCENT, ACCENT_GLOW, radius, space, surface } from '@/theme/tokens';

const GLOW_BLEED = 22;
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

type WeekRowProps = {
  activeIndex?: number;
  sessionDoneToday: boolean;
};

function WeekRow({ activeIndex = 3, sessionDoneToday }: WeekRowProps) {
  return (
    <View style={styles.weekRow}>
      {DAYS.map((day, index) => {
        const isToday = index === activeIndex;
        const isDone = index < activeIndex || (isToday && sessionDoneToday);

        return (
          <View key={`${day}-${index}`} style={styles.dayCell}>
            <AppText color={isToday ? 'primary' : 'muted'} variant="micro">
              {day}
            </AppText>
            <View style={styles.dayDotFrame}>
              {isToday ? <Bloom color={ACCENT_GLOW} style={styles.dayBloom} /> : null}
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
  const { data, isLoading } = useTodayData();

  return (
    <Screen padded>
      <AmbientGradient reduceMotion={false} />
      {isLoading ? (
        <LoadingToday />
      ) : (
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
          <View style={styles.spacer} />
          <View style={styles.bottomBlock}>
            <FadeIn>
              <WeekRow sessionDoneToday={data.sessionDoneToday} />
            </FadeIn>
            <FadeIn delay={40} style={styles.titleBlock}>
              <AppText color="primary" variant="hero">
                {data.sessionDoneToday
                  ? 'Come back\ntomorrow'
                  : data.streakDays === 0
                    ? 'Set your\nbaseline'
                    : 'Ready when\nyou are'}
              </AppText>
              <AppText color="muted" variant="caption">
                {data.sessionDoneToday
                  ? `Next · ${data.nextTargetLabel}`
                  : data.streakDays === 0
                    ? 'Your first session sets the baseline'
                    : `Next · ${data.nextTargetLabel}`}
              </AppText>
            </FadeIn>
            <FadeIn delay={80}>
              <View style={styles.buttonFrame}>
                <Bloom color={ACCENT_GLOW} style={styles.buttonBloom} />
                <PressableScale
                  accessibilityLabel="Start session"
                  accessibilityRole="button"
                  haptic="select"
                  onPress={() => router.push('/session' as Href)}
                  scaleTo={0.96}
                  style={styles.startButton}>
                  <AppText color="inverse" variant="heading">
                    {data.sessionDoneToday ? 'Train again' : 'Start session'}
                  </AppText>
                </PressableScale>
              </View>
            </FadeIn>
          </View>
        </>
      )}
    </Screen>
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
    flex: 1,
  },
  bottomBlock: {
    gap: space.md,
    paddingBottom: space.lg,
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
  dayDot: {
    borderRadius: radius.pill,
    height: 6,
    width: 6,
  },
  dayDotDone: {
    backgroundColor: surface.hairlineStrong,
  },
  dayDotFuture: {
    backgroundColor: 'transparent',
    borderColor: surface.hairline,
    borderWidth: 1,
  },
  dayDotToday: {
    backgroundColor: ACCENT,
    borderWidth: 0,
    height: 8,
    width: 8,
  },
  titleBlock: {
    gap: space.sm,
  },
  buttonFrame: {
    position: 'relative',
  },
  buttonBloom: {
    position: 'absolute',
    top: -GLOW_BLEED,
    right: -GLOW_BLEED,
    bottom: -GLOW_BLEED,
    left: -GLOW_BLEED,
  },
  startButton: {
    alignItems: 'center',
    backgroundColor: ACCENT,
    borderRadius: radius.pill,
    paddingVertical: space.base,
  },
  loadingTitle: {
    gap: space.sm,
    width: '60%',
  },
  loadingTitleShort: {
    width: '75%',
  },
});
