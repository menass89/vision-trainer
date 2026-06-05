import type { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { space, surface } from '@/theme/tokens';

export type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  warm?: boolean;
  padded?: boolean;
  /**
   * Full-bleed backdrop (e.g. the ambient gradient). Rendered as an absolutely
   * positioned sibling BEHIND the content — outside the safe-area padding and
   * outside the safe-area padding. Scroll screens mount it inside the scroll
   * content so the sky travels with long pages instead of revealing flat gutters.
   */
  background?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Screen({
  children,
  scroll = false,
  warm = false,
  padded = true,
  background,
  style,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const backgroundColor = warm ? surface.warm : surface.base;
  const contentStyle = [
    styles.content,
    { paddingBottom: insets.bottom },
    padded && styles.padded,
    style,
    // Safe-area top is applied LAST so a screen's own `style` can never clobber it.
    // Every screen's header lands at the same Y, clear of the status bar / Dynamic Island.
    { paddingTop: insets.top + (scroll ? space.xxl : space.lg) },
  ];

  return (
    <View style={[styles.background, { backgroundColor }]}>
      {!scroll && background ? (
        <View pointerEvents="none" style={styles.backgroundLayer}>
          {background}
        </View>
      ) : null}
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.scrollBackdrop, { minHeight: height }]}>
            {background ? (
              <View pointerEvents="none" style={styles.backgroundLayer}>
                {background}
              </View>
            ) : null}
            <View style={contentStyle}>{children}</View>
          </View>
        </ScrollView>
      ) : (
        <View style={contentStyle}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flexGrow: 1,
  },
  padded: {
    paddingHorizontal: space.lg,
  },
  scrollBackdrop: {
    flexGrow: 1,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
  },
});
