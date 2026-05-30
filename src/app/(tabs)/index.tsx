import { type Href, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { AmbientGradient } from '@/components/home/AmbientGradient';
import { ContrastArc } from '@/components/home/ContrastArc';
import { AppText, FadeIn, PressableScale, Screen, Shimmer } from '@/components/ui';
import { useTodayData } from '@/presenters';
import { ACCENT, ACCENT_GLOW, radius, space, surface, verdict as verdictColors } from '@/theme/tokens';

const ARC_SIZE = 260;
const GLOW_BLEED = 22;

function ButtonGlow() {
  return (
    <View pointerEvents="none" style={styles.buttonGlow}>
      <Svg height="100%" width="100%">
        <Defs>
          <RadialGradient cx="50%" cy="50%" id="ctaGlow" rx="58%" ry="62%">
            <Stop offset="0%" stopColor={ACCENT_GLOW} stopOpacity={1} />
            <Stop offset="55%" stopColor={ACCENT_GLOW} stopOpacity={0.5} />
            <Stop offset="100%" stopColor={ACCENT_GLOW} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect fill="url(#ctaGlow)" height="100%" rx="50%" ry="50%" width="100%" />
      </Svg>
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
            <View style={styles.streakChip}>
              <AppText color="secondary" tabular variant="caption">
                {`${data.streakDays} day streak`}
              </AppText>
            </View>
          </FadeIn>
          <FadeIn delay={80} style={styles.hero}>
            <ContrastArc
              onPress={() => router.push('/progress' as Href)}
              progress={data.dailyProgress}
              value={data.contrastSensitivity}
              verdictColor={verdictColors[data.verdict]}
            />
          </FadeIn>
          <FadeIn delay={160} style={styles.footer}>
            <View style={styles.buttonFrame}>
              <ButtonGlow />
              <PressableScale
                haptic="success"
                onPress={() => router.push('/session' as Href)}
                scaleTo={0.96}
                style={styles.startButton}>
                <AppText color="inverse" variant="heading">
                  {data.sessionDoneToday ? 'Train again' : 'Start session'}
                </AppText>
              </PressableScale>
            </View>
            <AppText color="muted" style={styles.footerCaption} variant="caption">
              {data.streakDays === 0 && !data.sessionDoneToday
                ? 'Your first session sets the baseline'
                : `Next · ${data.nextTargetLabel}`}
            </AppText>
          </FadeIn>
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
      <FadeIn delay={80} style={styles.hero}>
        <Shimmer height={ARC_SIZE} radius={radius.pill} width={ARC_SIZE} />
      </FadeIn>
      <FadeIn delay={160} style={styles.footer}>
        <Shimmer height={58} radius={radius.pill} width="100%" />
        <Shimmer height={18} radius={radius.pill} style={styles.captionShimmer} width={168} />
      </FadeIn>
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
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    gap: space.md,
    paddingBottom: space.lg,
  },
  buttonFrame: {
    position: 'relative',
  },
  buttonGlow: {
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
  footerCaption: {
    textAlign: 'center',
  },
  captionShimmer: {
    alignSelf: 'center',
  },
});
