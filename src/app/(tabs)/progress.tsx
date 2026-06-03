import { useCallback, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AmbientGradient } from '@/components/home/AmbientGradient';
import { ContributorRows } from '@/components/progress/ContributorRows';
import { CountUpNumber } from '@/components/progress/CountUpNumber';
import { CsfGraph } from '@/components/progress/CsfGraph';
import { ProgressEmptySky } from '@/components/progress/ProgressEmptySky';
import { Sparkline } from '@/components/progress/Sparkline';
import { VerdictBand } from '@/components/progress/VerdictBand';
import { AppText, Bloom, Card, FadeIn, Screen, Shimmer } from '@/components/ui';
import { useProgressData } from '@/presenters';
import { haptics } from '@/theme/haptics';
import { data as tokenData, motion, radius, space, surface } from '@/theme/tokens';

const SPARKLINE_HEIGHT = 112;
const CSF_GRAPH_HEIGHT = 220;

export default function ProgressScreen() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { data, isLoading } = useProgressData();
  const isEmpty = data.csf.length === 0;
  const [chartWidth, setChartWidth] = useState(0);
  const handleChartLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    setChartWidth((previous) => (previous === next ? previous : next));
  }, []);

  return (
    <Screen scroll style={styles.screen}>
      <AmbientGradient constellation reduceMotion={reduceMotion} />
      {isLoading ? (
        <LoadingProgress />
      ) : isEmpty ? (
        <ProgressEmptySky
          onBegin={() => router.push('/session' as Href)}
          reduceMotion={reduceMotion}
        />
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
            <View
              accessibilityLabel={data.headlineAcuity.toFixed(2)}
              style={styles.heroNumber}>
              <Bloom color={tokenData.heroGlow} opacity={0.7} rx="62%" ry="48%" />
              <CountUpNumber
                durationMs={motion.timing.countUpProgressMs}
                from={data.previousAcuity}
                onSettle={haptics.numberSettle}
                to={data.headlineAcuity}
              />
            </View>
            <VerdictBand delta={data.delta} verdict={data.verdict} />
          </FadeIn>
          <FadeIn delay={120}>
            <Card style={styles.card}>
              <AppText color="secondary" variant="caption">
                Last 7 days
              </AppText>
              {data.sparkline.length === 0 ? (
                <View style={styles.emptyTrend}>
                  <AppText color="secondary" variant="caption">
                    Awaiting first reading
                  </AppText>
                  <View style={styles.emptyTrendBaseline} />
                  <AppText color="muted" uppercase variant="micro">
                    Complete a session to chart your trend
                  </AppText>
                </View>
              ) : (
                <View onLayout={handleChartLayout} style={styles.chartMeasure}>
                  {chartWidth > 0 ? (
                    <FadeIn duration={motion.timing.rangeDrawMs}>
                      <Sparkline height={SPARKLINE_HEIGHT} points={data.sparkline} width={chartWidth} />
                    </FadeIn>
                  ) : null}
                </View>
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
              <View onLayout={handleChartLayout} style={styles.chartMeasure}>
                {chartWidth > 0 ? (
                  <FadeIn duration={motion.timing.rangeDrawMs}>
                    <CsfGraph
                      height={CSF_GRAPH_HEIGHT}
                      points={data.csf}
                      references={data.csfReferences}
                      width={chartWidth}
                    />
                  </FadeIn>
                ) : null}
              </View>
            </Card>
          </FadeIn>
          <FadeIn delay={240}>
            <Card style={styles.card}>
              <AppText color="secondary" variant="caption">
                By spatial frequency
              </AppText>
              <ContributorRows rows={data.contributors} />
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
      <FadeIn delay={240}>
        <Shimmer height={248} radius={radius.lg} width="100%" />
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
  chartMeasure: {
    width: '100%',
  },
  emptyTrend: {
    alignItems: 'center',
    gap: space.xs,
    justifyContent: 'center',
    minHeight: SPARKLINE_HEIGHT + 20,
  },
  emptyTrendBaseline: {
    backgroundColor: surface.hairline,
    height: StyleSheet.hairlineWidth,
    width: '70%',
  },
  hero: {
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.xl,
  },
  heroNumber: {
    alignItems: 'center',
    height: 160,
    justifyContent: 'center',
    width: 260,
  },
  loadingHero: {
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.xxl,
  },
  screen: {
    gap: space.md,
    paddingBottom: space.lg,
    paddingTop: space.lg,
  },
});
