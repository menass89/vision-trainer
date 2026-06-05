import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, GlassSurface, Hairline } from '@/components/ui';
import { radius, space } from '@/theme/tokens';

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
      <GlassSurface radius={radius.lg} style={styles.group}>
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 ? <Hairline style={styles.hairline} /> : null}
            {row}
          </Fragment>
        ))}
      </GlassSurface>
      {footer ? (
        <AppText color="muted" style={styles.footer} variant="caption">
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: space.base,
  },
  group: {
    borderRadius: radius.lg,
  },
  hairline: {
    marginLeft: space.base,
  },
  section: {
    gap: space.md,
    marginBottom: space.xl,
  },
});
