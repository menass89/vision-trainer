import { type Href, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AmbientGradient } from '@/components/home/AmbientGradient';
import { AppText, Bloom, FadeIn, GlassSurface, PressableScale, PrimaryButton, Screen } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { ACCENT_GLOW, material, radius, space, surface } from '@/theme/tokens';

const BENEFITS = [
  'Adaptive sessions adjusted to your readings',
  'Progress graphs with confidence and retest states',
  'Private by design. Your readings stay on this device.',
] as const;

export default function PaywallScreen() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const startTrial = () => {
    const store = useAppStore.getState();
    store.updateSetting('subscriptionStatus', 'trialing');
    store.updateSetting('trialStartedAt', new Date().toISOString());
    router.replace('/(tabs)' as Href);
  };

  const continueLimited = () => {
    useAppStore.getState().updateSetting('subscriptionStatus', 'free');
    router.replace('/(tabs)' as Href);
  };

  return (
    <Screen padded background={<AmbientGradient constellation reduceMotion={reduceMotion} />}>
      <View style={styles.screen}>
        <FadeIn duration={360} style={styles.hero}>
          <View style={styles.glow}>
            <Bloom color={ACCENT_GLOW} opacity={0.7} rx="68%" ry="46%" />
          </View>
          <AppText style={styles.kicker} uppercase color="muted" variant="micro">
            7-day baseline week
          </AppText>
          <AppText style={styles.title} variant="title">
            Train your vision with adaptive 5-minute sessions.
          </AppText>
          <AppText color="secondary" style={styles.subtitle} variant="body">
            Your first week helps you understand your baseline and see whether the routine fits.
            Real change takes consistency.
          </AppText>
        </FadeIn>

        <FadeIn delay={80}>
          <GlassSurface radius={material.radius} style={styles.plan}>
            <View style={styles.planHeader}>
              <View>
                <AppText color="primary" variant="heading">
                  Vision Trainer Pro
                </AppText>
                <AppText color="muted" variant="caption">
                  Start free. Then $59.99/year.
                </AppText>
              </View>
              <View style={styles.pricePill}>
                <AppText color="accent" tabular variant="caption">
                  $9.99/mo
                </AppText>
              </View>
            </View>

            <View style={styles.benefits}>
              {BENEFITS.map((benefit) => (
                <View key={benefit} style={styles.benefitRow}>
                  <View style={styles.dot} />
                  <AppText color="secondary" style={styles.benefitText} variant="caption">
                    {benefit}
                  </AppText>
                </View>
              ))}
            </View>

            <AppText color="muted" style={styles.safety} variant="micro">
              Science-based visual training. Not a medical test or treatment. Cancel anytime in Apple subscriptions.
            </AppText>
          </GlassSurface>
        </FadeIn>

        <FadeIn delay={160} style={styles.actions}>
          <PrimaryButton label="Start 7-day free trial" onPress={startTrial} />
          <PressableScale accessibilityRole="button" onPress={continueLimited} style={styles.secondaryAction}>
            <AppText color="secondary" variant="caption">
              Continue with limited access
            </AppText>
          </PressableScale>
        </FadeIn>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: space.md,
  },
  benefitRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.sm,
  },
  benefitText: {
    flex: 1,
    lineHeight: 20,
  },
  benefits: {
    gap: space.md,
  },
  dot: {
    backgroundColor: 'rgba(91,233,236,0.86)',
    borderRadius: radius.pill,
    height: 7,
    width: 7,
  },
  glow: {
    height: 180,
    position: 'absolute',
    top: -42,
    width: 220,
  },
  hero: {
    alignItems: 'center',
    gap: space.md,
    paddingTop: space.xxl,
  },
  kicker: {
    letterSpacing: 1.8,
  },
  plan: {
    gap: space.lg,
    padding: space.lg,
  },
  planHeader: {
    alignItems: 'center',
    borderBottomColor: surface.hairline,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: space.md,
  },
  pricePill: {
    backgroundColor: 'rgba(51,210,214,0.11)',
    borderColor: 'rgba(51,210,214,0.30)',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  safety: {
    lineHeight: 17,
  },
  screen: {
    flex: 1,
    gap: space.xl,
    justifyContent: 'space-between',
    paddingBottom: space.xl,
  },
  secondaryAction: {
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingVertical: space.sm,
  },
  subtitle: {
    lineHeight: 24,
    textAlign: 'center',
  },
  title: {
    textAlign: 'center',
  },
});
