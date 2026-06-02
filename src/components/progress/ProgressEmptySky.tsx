import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { CelestialGabor } from '@/components/home/CelestialGabor';
import { AppText, FadeIn, PrimaryButton } from '@/components/ui';
import { ACCENT, ACCENT_CORE, ACCENT_GLOW, ACCENT_MUTED, ACCENT_SOFT, space } from '@/theme/tokens';

const STAR_POINTS = [
  { x: 18, y: 104 },
  { x: 64, y: 74 },
  { x: 110, y: 44 },
  { x: 150, y: 30 },
  { x: 196, y: 42 },
  { x: 242, y: 72 },
  { x: 282, y: 100 },
] as const;

const PEAK_INDEX = 3;
const ARC_PATH = STAR_POINTS.map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(
  ' ',
);

export type ProgressEmptySkyProps = {
  onBegin: () => void;
  reduceMotion?: boolean;
};

export function ProgressEmptySky({ onBegin, reduceMotion }: ProgressEmptySkyProps) {
  return (
    <View style={styles.root}>
      <FadeIn>
        <AppText color="muted" uppercase variant="micro">
          Progress
        </AppText>
      </FadeIn>
      <View style={styles.scene}>
        <FadeIn>
          <View style={styles.dormantBody}>
            <CelestialGabor contrast={0.12} progress={0} reduceMotion={reduceMotion} />
          </View>
        </FadeIn>
        <FadeIn delay={120} style={styles.arc}>
          <Svg height={132} viewBox="0 0 300 132" width="100%">
            {/* dormant axis — the chart that will fill in */}
            <Line x1={12} y1={122} x2={288} y2={122} stroke={ACCENT_MUTED} strokeOpacity={0.14} strokeWidth={1} />
            {STAR_POINTS.map(({ x }) => (
              <Line key={`tick-${x}`} x1={x} y1={122} x2={x} y2={126} stroke={ACCENT_MUTED} strokeOpacity={0.22} strokeWidth={1} />
            ))}
            <Path
              d={ARC_PATH}
              fill="none"
              stroke={ACCENT_MUTED}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={0.18}
              strokeWidth={1}
            />
            <Circle cx={150} cy={30} fill={ACCENT_GLOW} r={9} />
            <Circle cx={150} cy={30} fill={ACCENT} fillOpacity={0.12} r={5} />
            {STAR_POINTS.map(({ x, y }, index) => (
              <Circle
                key={`${x}-${y}`}
                cx={x}
                cy={y}
                fill={index === PEAK_INDEX ? ACCENT_CORE : ACCENT_SOFT}
                fillOpacity={index === PEAK_INDEX ? 0.85 : 0.16}
                r={index === PEAK_INDEX ? 3 : 2}
              />
            ))}
          </Svg>
        </FadeIn>
      </View>
      <FadeIn delay={180} style={styles.bottomBlock}>
        <AppText color="primary" variant="hero">
          {'Your sky\nis dark'}
        </AppText>
        <AppText color="secondary" variant="body">
          Train once to light your first star.
        </AppText>
        <PrimaryButton
          accessibilityLabel="Begin first session"
          haptic="select"
          label="Begin first session"
          onPress={onBegin}
        />
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  arc: {
    width: '100%',
  },
  bottomBlock: {
    gap: space.lg,
    paddingBottom: space.xl,
  },
  dormantBody: {
    opacity: 0.55,
  },
  root: {
    flex: 1,
  },
  scene: {
    alignItems: 'center',
    flex: 1,
    gap: space.md,
    justifyContent: 'center',
  },
});
