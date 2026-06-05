import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { CelestialGabor } from '@/components/home/CelestialGabor';
import { AppText, FadeIn } from '@/components/ui';
import {
  ACCENT,
  ACCENT_CORE,
  ACCENT_GLOW,
  ACCENT_HOT,
  ACCENT_MUTED,
  ACCENT_SOFT,
  radius,
  space,
} from '@/theme/tokens';

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
  reduceMotion?: boolean;
};

export function ProgressEmptySky({ reduceMotion }: ProgressEmptySkyProps) {
  return (
    <View style={styles.root}>
      <FadeIn>
        <View style={styles.screenLabelPlate}>
          <AppText color="accent" style={styles.screenLabel} variant="caption">
            Progress
          </AppText>
        </View>
      </FadeIn>
      <View style={styles.scene}>
        <FadeIn>
          <View>
            <CelestialGabor
              contrast={0.32}
              progress={0.08}
              reduceMotion={reduceMotion}
              resolveOnMount
            />
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
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  arc: {
    width: '100%',
  },
  bottomBlock: {
    gap: space.md,
    paddingBottom: space.xl,
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
