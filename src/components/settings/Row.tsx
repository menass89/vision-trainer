import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { space } from '@/theme/tokens';

export type RowProps = {
  label: string;
  description?: string;
  right: ReactNode;
};

export function Row({ label, description, right }: RowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <AppText variant="body">{label}</AppText>
        {description ? (
          <AppText color="muted" variant="caption">
            {description}
          </AppText>
        ) : null}
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.md,
    paddingHorizontal: space.base,
    paddingVertical: space.md,
  },
  copy: {
    flex: 1,
    gap: space.xs,
  },
  right: {
    flexShrink: 0,
  },
});
