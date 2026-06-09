import { StyleSheet, View } from 'react-native';

import { AppText, Bloom, FadeIn, GlassSurface, PressableScale, PrimaryButton } from '@/components/ui';
import { ACCENT_GLOW, material, radius, space, surface } from '@/theme/tokens';
import type { PostSessionInsightView } from '@/presenters';

type PostSessionInsightProps = {
  insight: PostSessionInsightView;
  onDone: () => void;
  onViewProgress: () => void;
};

const confidenceTone: Record<PostSessionInsightView['status'], string> = {
  provisional: 'Building baseline',
  reliable: 'Ready to compare',
  'needs-retest': 'Do not overread',
};

export function PostSessionInsight({ insight, onDone, onViewProgress }: PostSessionInsightProps) {
  const delta =
    insight.deltaPercent === null
      ? insight.deltaLabel
      : `${insight.deltaLabel} ${Math.abs(insight.deltaPercent)}%`;

  return (
    <View style={styles.overlay}>
      <FadeIn duration={320}>
        <GlassSurface radius={material.radius} style={styles.card}>
          <View style={styles.header}>
            <AppText color="muted" uppercase variant="micro">
              {confidenceTone[insight.status]}
            </AppText>
            <View style={styles.confidencePill}>
              <AppText color="accent" uppercase variant="micro">
                {insight.confidenceLabel}
              </AppText>
            </View>
          </View>

          <View style={styles.hero}>
            <Bloom color={ACCENT_GLOW} opacity={0.58} rx="65%" ry="42%" />
            <AppText style={styles.title} variant="title">
              {insight.title}
            </AppText>
            <AppText color="secondary" style={styles.summary} variant="body">
              {insight.summary}
            </AppText>
          </View>

          <View style={styles.metrics}>
            <View style={styles.metric}>
              <AppText color="muted" uppercase variant="micro">
                Measured
              </AppText>
              <AppText color="secondary" tabular variant="caption">
                {insight.measuredBandsLabel}
              </AppText>
            </View>
            <View style={styles.metric}>
              <AppText color="muted" uppercase variant="micro">
                Change
              </AppText>
              <AppText color="secondary" tabular variant="caption">
                {delta}
              </AppText>
            </View>
          </View>

          <AppText color="muted" style={styles.detail} variant="caption">
            {insight.detail}
          </AppText>

          <View style={styles.actions}>
            <PrimaryButton label="View progress" onPress={onViewProgress} style={styles.primaryAction} />
            <PressableScale accessibilityRole="button" onPress={onDone} style={styles.secondaryAction}>
              <AppText color="secondary" variant="caption">
                Done
              </AppText>
            </PressableScale>
          </View>
        </GlassSurface>
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: space.sm,
  },
  card: {
    gap: space.lg,
    padding: space.xl,
    width: '100%',
  },
  confidencePill: {
    backgroundColor: 'rgba(51,210,214,0.12)',
    borderColor: 'rgba(51,210,214,0.32)',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: space.sm,
    paddingVertical: 5,
  },
  detail: {
    lineHeight: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    gap: space.sm,
    minHeight: 146,
    justifyContent: 'center',
  },
  metric: {
    flex: 1,
    gap: space.xs,
  },
  metrics: {
    borderBottomColor: surface.hairline,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: surface.hairline,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: space.md,
    paddingVertical: space.md,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  primaryAction: {
    width: '100%',
  },
  secondaryAction: {
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingVertical: space.sm,
  },
  summary: {
    textAlign: 'center',
  },
  title: {
    textAlign: 'center',
  },
});
