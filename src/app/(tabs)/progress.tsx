// PLACEHOLDER — body filled in Phase 3c/3d/...
import { StyleSheet } from 'react-native';

import { AppText, FadeIn, Screen } from '@/components/ui';
import { space } from '@/theme/tokens';

export default function ProgressScreen() {
  return (
    <Screen>
      <FadeIn style={styles.placeholder}>
        <AppText variant="title">Progress</AppText>
        <AppText color="muted" variant="caption">
          Phase 3e — coming next
        </AppText>
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
});
