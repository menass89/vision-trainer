import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { hairline, radius, space, verdict as verdictColors } from '@/theme/tokens';

export type VerdictBandProps = {
  verdict: 'improving' | 'holding' | 'regressing';
  delta: number;
};

function formatDelta(delta: number) {
  const sign = delta < 0 ? '−' : '+';

  return `${sign}${Math.abs(delta).toFixed(2)}`;
}

export function VerdictBand({ verdict, delta }: VerdictBandProps) {
  const verdictColor = verdictColors[verdict];

  return (
    <View
      style={[
        styles.band,
        {
          backgroundColor: `${verdictColor}24`,
          borderColor: verdictColor,
        },
      ]}>
      <AppText style={{ color: verdictColor }} uppercase variant="caption">
        {verdict}
      </AppText>
      <AppText color="secondary" tabular variant="caption">
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
    borderWidth: hairline.px1,
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
});
