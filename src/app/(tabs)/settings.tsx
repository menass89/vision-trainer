import { type Href, useRouter } from 'expo-router';
import { useRef } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useReducedMotion } from 'react-native-reanimated';

import { AmbientGradient } from '@/components/home/AmbientGradient';
import { Row } from '@/components/settings/Row';
import { Section } from '@/components/settings/Section';
import {
  SegmentedControl,
  type SegmentOption,
} from '@/components/settings/SegmentedControl';
import { Toggle } from '@/components/settings/Toggle';
import { AppText, FadeIn, Screen } from '@/components/ui';
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
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const { state, set } = useSettingsState();
  const reminderToggleInFlightRef = useRef(false);

  const handleRemindersChange = async (next: boolean) => {
    if (reminderToggleInFlightRef.current) {
      return;
    }

    reminderToggleInFlightRef.current = true;

    try {
      if (next) {
        const granted = await notificationService.requestRemindersPermission();
        if (!granted) {
          // Permission denied/unavailable - keep the toggle off.
          set('remindersEnabled', false);
          return;
        }
        await notificationService.scheduleDailyReminder(REMINDER_HOUR, REMINDER_MINUTE);
        set('remindersEnabled', true);
      } else {
        await notificationService.cancelDailyReminder();
        set('remindersEnabled', false);
      }
    } catch {
      // Enabling failed before a reminder was scheduled; failed cancellation leaves it active.
      set('remindersEnabled', !next);
    } finally {
      reminderToggleInFlightRef.current = false;
    }
  };

  return (
    <Screen
      scroll
      warm
      background={<AmbientGradient constellation reduceMotion={reduceMotion} />}
      style={styles.screen}>
      <FadeIn style={styles.title}>
        <AppText variant="hero">Settings</AppText>
      </FadeIn>
      <FadeIn delay={60}>
        <Section
          footer="Emphasis directs more of the session to the selected eye. Both modes need red/cyan glasses."
          title="Stimulus">
          <Row
            description="Sends a different pattern to each eye through red/cyan glasses"
            label="Dichoptic mode"
            right={
              <Toggle
                accessibilityLabel="Dichoptic mode"
                onChange={(value) => set('dichopticEnabled', value)}
                value={state.dichopticEnabled}
              />
            }
          />
          <Row
            label="Eye emphasis"
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
                accessibilityLabel="Haptics"
                onChange={(value) => set('hapticsEnabled', value)}
                value={state.hapticsEnabled}
              />
            }
          />
          <Row
            label="Sound cues"
            right={
              <Toggle
                accessibilityLabel="Sound cues"
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
                accessibilityLabel="Reduce motion"
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
                accessibilityLabel="Daily reminder"
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
            accessibilityLabel="The science"
            chevron
            description="How perceptual learning works"
            label="The science"
            onPress={() => router.push('/science' as Href)}
            right={<Chevron />}
          />
        </Section>
      </FadeIn>
    </Screen>
  );
}

function Chevron() {
  return (
    <Svg height={16} width={16}>
      <Path
        d="M6 3.5L10.5 8L6 12.5"
        fill="none"
        stroke={text.secondary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: space.lg,
  },
  title: {
    marginBottom: space.lg,
  },
});
