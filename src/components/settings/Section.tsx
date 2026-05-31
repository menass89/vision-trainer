import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Hairline } from '@/components/ui';
import { hairline, radius, space, surface } from '@/theme/tokens';

export type SectionProps = {
  title: string;
  children: ReactNode;
  footer?: string;
};

export function Section({ title, children, footer }: SectionProps) {
  const rows = Children.toArray(children);

  return (
    <View style={styles.section}>
      <AppText color="muted" uppercase variant="micro">
        {title}
      </AppText>
      <View style={styles.group}>
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 ? <Hairline style={styles.hairline} /> : null}
            {row}
          </Fragment>
        ))}
      </View>
      {footer ? (
        <AppText color="muted" style={styles.footer} variant="caption">
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: space.md,
    marginBottom: space.xl,
  },
  group: {
    backgroundColor: surface.card,
    borderColor: surface.hairline,
    borderRadius: radius.lg,
    borderWidth: hairline.px1,
    overflow: 'hidden',
  },
  footer: {
    paddingHorizontal: space.base,
  },
  hairline: {
    marginLeft: space.base,
  },
});
