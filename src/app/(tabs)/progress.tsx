import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { CsfGraph } from '@/components/progress/CsfGraph';
import { Sparkline } from '@/components/progress/Sparkline';
import { VerdictBand } from '@/components/progress/VerdictBand';
import { AppText, Card, FadeIn, Screen, Shimmer } from '@/components/ui';
import { useProgressData } from '@/presenters';
import { radius, space } from '@/theme/tokens';

const SPARKLINE_HEIGHT = 112;
const CSF_GRAPH_HEIGHT = 220;

export default function ProgressScreen() {
  const { width } = useWindowDimensions();
  const { data, isLoading } = useProgressData();
  const chartWidth = Math.max(width - space.lg * 2 - space.base * 2, 0);

  return (
    <Screen scroll style={styles.screen}>
      {isLoading ? (
        <LoadingProgress />
      ) : (
        <>
          <FadeIn>
            <AppText color="muted" uppercase variant="micro">
              Progress
            </AppText>
          </FadeIn>
          <FadeIn delay={60} style={styles.hero}>
            <AppText color="muted" uppercase variant="micro">
              Log contrast sensitivity
            </AppText>
            <AppText style={styles.headline} tabular variant="display">
              {data.headlineAcuity.toFixed(2)}
            </AppText>
            <VerdictBand delta={data.delta} verdict={data.verdict} />
          </FadeIn>
          <FadeIn delay={120}>
            <Card style={styles.card}>
              <AppText color="secondary" variant="caption">
                Last 7 days
              </AppText>
              {data.sparkline.length === 0 ? (
                <View style={styles.emptyTrend}>
                  <AppText color="muted" variant="caption">
                    Complete a session to see your trend
                  </AppText>
                </View>
              ) : (
                <Sparkline height={SPARKLINE_HEIGHT} points={data.sparkline} width={chartWidth} />
              )}
            </Card>
          </FadeIn>
          <FadeIn delay={180}>
            <Card style={styles.card}>
              <View style={styles.cardHeading}>
                <AppText color="secondary" variant="caption">
                  Contrast sensitivity function
                </AppText>
                <AppText color="muted" variant="micro">
                  Drag to inspect
                </AppText>
              </View>
              <CsfGraph height={CSF_GRAPH_HEIGHT} points={data.csf} width={chartWidth} />
            </Card>
          </FadeIn>
        </>
      )}
    </Screen>
  );
}

function LoadingProgress() {
  return (
    <>
      <FadeIn>
        <Shimmer height={14} radius={radius.pill} width={64} />
      </FadeIn>
      <FadeIn delay={60} style={styles.loadingHero}>
        <Shimmer height={14} radius={radius.pill} width={172} />
        <Shimmer height={88} radius={radius.md} width={188} />
        <Shimmer height={28} radius={radius.pill} width={142} />
      </FadeIn>
      <FadeIn delay={120}>
        <Shimmer height={178} radius={radius.lg} width="100%" />
      </FadeIn>
      <FadeIn delay={180}>
        <Shimmer height={286} radius={radius.lg} width="100%" />
      </FadeIn>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space.md,
  },
  cardHeading: {
    gap: space.xs,
  },
  emptyTrend: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: SPARKLINE_HEIGHT + 20,
  },
  headline: {
    textAlign: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.xxl,
  },
  loadingHero: {
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.xxl,
  },
  screen: {
    gap: space.sm,
    paddingBottom: space.lg,
    paddingTop: space.lg,
  },
});
