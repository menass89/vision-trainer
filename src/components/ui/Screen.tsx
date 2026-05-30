import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { space, surface } from '@/theme/tokens';

export type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  warm?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Screen({
  children,
  scroll = false,
  warm = false,
  padded = true,
  style,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const backgroundColor = warm ? surface.warm : surface.base;
  const contentStyle = [
    styles.content,
    {
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },
    padded && styles.padded,
    style,
  ];

  return (
    <View style={[styles.background, { backgroundColor }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={contentStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
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
  content: {
    flexGrow: 1,
  },
  padded: {
    paddingHorizontal: space.lg,
  },
});
