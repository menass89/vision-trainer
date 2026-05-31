import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppText } from '@/components/ui';
import { radius, space, verdict as verdictColors } from '@/theme/tokens';

export type VerdictBandProps = {
  verdict: 'improving' | 'holding' | 'regressing';
  delta: number;
};

function formatDelta(delta: number) {
  const sign = delta < 0 ? '−' : delta > 0 ? '+' : '';

  return `${sign}${Math.abs(delta).toFixed(2)}`;
}

export function VerdictBand({ verdict, delta }: VerdictBandProps) {
  const verdictColor = {
    improving: verdictColors.improving,
    holding: verdictColors.holding,
    regressing: verdictColors.regressing,
  }[verdict];
  const direction = verdict === 'holding' || delta === 0 ? 'holding' : delta > 0 ? 'up' : 'down';

  return (
    <View
      style={[
        styles.band,
        {
          backgroundColor: `${verdictColor}1F`,
        },
      ]}>
      {direction === 'holding' ? (
        <AppText style={{ color: verdictColor }} variant="caption">
          —
        </AppText>
      ) : (
        <Svg height={6} viewBox="0 0 8 6" width={8}>
          <Path d={direction === 'up' ? 'M 4 0 L 8 6 L 0 6 Z' : 'M 0 0 L 8 0 L 4 6 Z'} fill={verdictColor} />
        </Svg>
      )}
      <AppText style={{ color: verdictColor }} tabular variant="caption">
        {formatDelta(delta)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: space.xs,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
});
