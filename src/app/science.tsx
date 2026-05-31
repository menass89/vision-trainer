import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppText, Card, FadeIn, PressableScale, Screen } from '@/components/ui';
import { radius, space, surface, text } from '@/theme/tokens';

const SECTIONS = [
  {
    body: 'Contrast sensitivity is not fixed. With brief, repeated exposure to faint striped patterns, the visual cortex sharpens how it encodes edges. This is perceptual learning, and the gains persist.',
    eyebrow: 'Why it works',
    title: 'Your visual system keeps learning',
  },
  {
    body: 'Each trial shows two quick flashes. One holds a faint grating, the other is blank. You pick the one with the pattern. The contrast keeps adjusting to sit right at the edge of what you can see.',
    eyebrow: 'What you are doing',
    title: 'Two flashes, one pattern',
  },
  {
    body: 'A staircase lowers the contrast when you are right and raises it when you are wrong. You spend the whole session at the boundary of your vision, which is exactly where the learning is strongest.',
    eyebrow: 'Why it adapts',
    title: 'Training lives at your threshold',
  },
  {
    body: 'A few quiet minutes in a dimly lit room beats a long, distracted stretch. Consistency is what moves the curve, so a daily session keeps the gains compounding.',
    eyebrow: 'How to get the most',
    title: 'Short, dim, and daily',
  },
] as const;

export default function ScienceScreen() {
  const router = useRouter();

  return (
    <Screen scroll style={styles.screen}>
      <View style={styles.topBar}>
        <PressableScale
          accessibilityLabel="Close"
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.close}>
          <Svg height={14} width={14}>
            <Path
              d="M2 2L12 12M12 2L2 12"
              stroke={text.muted}
              strokeLinecap="round"
              strokeWidth={1.4}
            />
          </Svg>
        </PressableScale>
      </View>
      <FadeIn style={styles.header}>
        <AppText color="muted" uppercase variant="micro">
          The science
        </AppText>
        <AppText style={styles.title} variant="title">
          How perceptual learning sharpens your sight
        </AppText>
      </FadeIn>
      {SECTIONS.map((section, index) => (
        <FadeIn delay={80 + index * 60} key={section.eyebrow}>
          <Card style={styles.card}>
            <AppText color="accent" uppercase variant="micro">
              {section.eyebrow}
            </AppText>
            <AppText variant="heading">{section.title}</AppText>
            <AppText color="secondary">{section.body}</AppText>
          </Card>
        </FadeIn>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space.sm,
  },
  close: {
    alignItems: 'center',
    borderColor: surface.hairline,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  header: {
    gap: space.sm,
    marginBottom: space.lg,
  },
  screen: {
    gap: space.md,
    paddingBottom: space.xxl,
    paddingTop: space.sm,
  },
  title: {
    maxWidth: 320,
  },
  topBar: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: space.md,
  },
});
