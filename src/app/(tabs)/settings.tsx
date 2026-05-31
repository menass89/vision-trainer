import { type Href, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Row } from '@/components/settings/Row';
import { Section } from '@/components/settings/Section';
import {
  SegmentedControl,
  type SegmentOption,
} from '@/components/settings/SegmentedControl';
import { Toggle } from '@/components/settings/Toggle';
import { AppText, FadeIn, PressableScale, Screen } from '@/components/ui';
import { type SettingsState, useSettingsState } from '@/presenters';
import { notificationService } from '@/services/notifications';
import { space, text } from '@/theme/tokens';

const REMINDER_HOUR = 19;
const REMINDER_MINUTE = 0;

const WEAK_EYE_OPTIONS: SegmentOption<SettingsState['monocularWeakEye']>[] = [
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
  { label: 'Off', value: 'off' },
];

export default function SettingsScreen() {
  const { state, set } = useSettingsState();

  const handleRemindersChange = async (next: boolean) => {
    if (next) {
      const granted = await notificationService.requestRemindersPermission();
      if (!granted) {
        // Permission denied/unavailable — keep the toggle off.
        set('remindersEnabled', false);
        return;
      }
      await notificationService.scheduleDailyReminder(REMINDER_HOUR, REMINDER_MINUTE);
      set('remindersEnabled', true);
    } else {
      await notificationService.cancelDailyReminder();
      set('remindersEnabled', false);
    }
  };

  return (
    <Screen scroll warm style={styles.screen}>
      <FadeIn style={styles.title}>
        <AppText variant="title">Settings</AppText>
      </FadeIn>
      <FadeIn delay={60}>
        <Section title="Stimulus">
          <Row
            description="Separate red/cyan channels for amblyopia training"
            label="Dichoptic mode"
            right={
              <Toggle
                onChange={(value) => set('dichopticEnabled', value)}
                value={state.dichopticEnabled}
              />
            }
          />
          <Row
            description="Boost the non-dominant eye"
            label="Weak eye"
            right={
              <SegmentedControl
                onChange={(value) => set('monocularWeakEye', value)}
                options={WEAK_EYE_OPTIONS}
                value={state.monocularWeakEye}
              />
            }
          />
        </Section>
      </FadeIn>
      <FadeIn delay={120}>
        <Section title="Feedback">
          <Row
            label="Haptics"
            right={
              <Toggle
                onChange={(value) => set('hapticsEnabled', value)}
                value={state.hapticsEnabled}
              />
            }
          />
          <Row
            label="Sound cues"
            right={
              <Toggle
                onChange={(value) => set('soundEnabled', value)}
                value={state.soundEnabled}
              />
            }
          />
          <Row
            description="Calm ambient animation"
            label="Reduce motion"
            right={
              <Toggle
                onChange={(value) => set('reduceMotion', value)}
                value={state.reduceMotion}
              />
            }
          />
        </Section>
      </FadeIn>
      <FadeIn delay={180}>
        <Section title="Reminders">
          <Row
            description="A gentle evening nudge to keep your streak"
            label="Daily reminder"
            right={
              <Toggle
                onChange={(value) => {
                  void handleRemindersChange(value);
                }}
                value={state.remindersEnabled}
              />
            }
          />
        </Section>
      </FadeIn>
      <FadeIn delay={240}>
        <Section title="About">
          <Row
            label="Version"
            right={
              <AppText color="muted" variant="caption">
                1.0.0
              </AppText>
            }
          />
          <Row
            description="How perceptual learning works"
            label="The science"
            right={<ScienceLink />}
          />
        </Section>
      </FadeIn>
    </Screen>
  );
}

function ScienceLink() {
  const router = useRouter();

  return (
    <PressableScale
      accessibilityLabel="The science"
      accessibilityRole="button"
      haptic="selection"
      hitSlop={space.sm}
      onPress={() => router.push('/science' as Href)}
      scaleTo={0.94}>
      <Svg height={16} width={16}>
        <Path
          d="M6 3.5L10.5 8L6 12.5"
          fill="none"
          stroke={text.muted}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
        />
      </Svg>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: space.lg,
    paddingTop: space.lg,
  },
  title: {
    marginBottom: space.xl,
  },
});
