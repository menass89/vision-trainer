// PLACEHOLDER — body filled in Phase 3c/3d/...
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import { AppText, FadeIn, PressableScale, Screen } from '@/components/ui';
import { hairline, radius, space, surface } from '@/theme/tokens';

export default function SessionScreen() {
  const router = useRouter();

  return (
    <Screen>
      <FadeIn style={styles.placeholder}>
        <AppText variant="title">Session</AppText>
        <AppText color="muted" variant="caption">
          Phase 3d — coming next
        </AppText>
        <PressableScale haptic="selection" onPress={() => router.back()} style={styles.close}>
          <AppText color="secondary" variant="caption">
            Close
          </AppText>
        </PressableScale>
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  close: {
    borderWidth: hairline.px1,
    borderColor: surface.hairline,
    borderRadius: radius.pill,
    marginTop: space.base,
    paddingHorizontal: space.base,
    paddingVertical: space.sm,
  },
});
