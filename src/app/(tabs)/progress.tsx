import { useCallback, useState } from 'react';
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
import { ACCENT_HOT, data as tokenData, motion, radius, space, surface } from '@/theme/tokens';

const SPARKLINE_HEIGHT = 112;
const CSF_GRAPH_HEIGHT = 220;

export default function ProgressScreen() {
  const reduceMotion = useReducedMotion();
  const { data, isLoading } = useProgressData();
  const isEmpty = data.csf.length === 0;
  const [chartWidth, setChartWidth] = useState(0);
  const handleChartLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    setChartWidth((previous) => (previous === next ? previous : next));
  }, []);

  return (
    <Screen
      scroll={!isEmpty}
      background={<AmbientGradient constellation reduceMotion={reduceMotion} />}
      style={styles.screen}>
      {isLoading ? (
        <LoadingProgress />
      ) : isEmpty ? (
        <ProgressEmptySky reduceMotion={reduceMotion} />
      ) : (
        <>
          <FadeIn>
            <View style={styles.screenLabelPlate}>
              <AppText color="accent" style={styles.screenLabel} variant="caption">
                Progress
              </AppText>
            </View>
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
          <FadeIn delay={90}>
            <Card style={styles.card}>
              <AppText color="secondary" variant="caption">
                Vision profile
              </AppText>
              <AppText color="primary" variant="body">
                {visionProfileSummary(data)}
              </AppText>
              <View style={styles.insightGrid}>
                <View style={styles.insightRow}>
                  <AppText color="muted" variant="micro">
                    Bands measured
                  </AppText>
                  <AppText color="secondary" tabular variant="caption">
                    {data.csf.length}
                  </AppText>
                </View>
                <View style={styles.insightRow}>
                  <AppText color="muted" variant="micro">
                    Strongest band
                  </AppText>
                  <AppText color="secondary" tabular variant="caption">
                    {strongestBandLabel(data)}
                  </AppText>
                </View>
              </View>
            </Card>
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

function strongestBandLabel(data: NonNullable<ReturnType<typeof useProgressData>['data']>): string {
  if (data.contributors.length === 0) return 'Captured';

  const strongest = data.contributors.reduce(
    (best, candidate) => (candidate.sensitivity > best.sensitivity ? candidate : best),
    data.contributors[0]
  );

  return `${strongest.label} · ${strongest.sensitivity.toFixed(1)} sensitivity`;
}

function visionProfileSummary(data: NonNullable<ReturnType<typeof useProgressData>['data']>): string {
  if (data.contributors.length === 0) {
    return 'Baseline captured. Future sessions will turn this into a trend.';
  }

  const strongest = data.contributors.reduce(
    (best, candidate) => (candidate.sensitivity > best.sensitivity ? candidate : best),
    data.contributors[0]
  );
  const weakest = data.contributors.reduce(
    (lowest, candidate) => (candidate.sensitivity < lowest.sensitivity ? candidate : lowest),
    data.contributors[0]
  );

  if (strongest.label === weakest.label) {
    return `Baseline captured at ${strongest.label}. Future sessions will show whether this band is improving.`;
  }

  return `Baseline captured across ${data.csf.length} bands. Your strongest read today is ${strongest.label}; ${weakest.label} is the band to watch next.`;
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
  insightGrid: {
    gap: space.sm,
  },
  insightRow: {
    alignItems: 'center',
    borderTopColor: surface.hairline,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: space.sm,
  },
  loadingHero: {
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.xxl,
  },
  screen: {
    gap: space.md,
    paddingBottom: space.lg,
  },
  screenLabel: {
    color: ACCENT_HOT,
    fontWeight: '800',
    letterSpacing: 0,
    textShadowColor: 'rgba(51, 210, 214, 0.56)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  screenLabelPlate: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(8, 14, 16, 0.52)',
    borderColor: 'rgba(207, 250, 251, 0.16)',
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
});
