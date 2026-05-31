import { LinearGradient } from 'expo-linear-gradient';
import { type Href, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { BreathingOrb } from '@/components/onboarding/BreathingOrb';
import { AppText, FadeIn, PressableScale, Screen } from '@/components/ui';
import { notificationService } from '@/services/notifications';
import { useAppStore } from '@/store/useAppStore';
import { ACCENT, hairline, motion, radius, space, surface, text, type } from '@/theme/tokens';

const BASE_ORB = 180;
const REMINDER_HOUR = 19;
const REMINDER_MINUTE = 0;

const STEPS = [
  { id: 'welcome', buttonLabel: 'Begin' },
  { id: 'science', buttonLabel: 'Continue' },
  { id: 'accent', buttonLabel: 'Got it' },
  { id: 'reminders', buttonLabel: 'Enable reminders' },
  { id: 'calibration', buttonLabel: '' },
  { id: 'ready', buttonLabel: 'Start training' },
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const currentStep = STEPS[step];

  const advance = () => {
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const handleEnableReminders = async () => {
    const granted = await notificationService.requestRemindersPermission();
    if (granted) {
      await notificationService.scheduleDailyReminder(REMINDER_HOUR, REMINDER_MINUTE);
      useAppStore.getState().updateSetting('remindersEnabled', true);
    }
    advance();
  };

  const handleCalibration = () => {
    // TODO(phase4): real photometric calibration (viewing distance, background luminance).
    advance();
  };

  const handleStart = () => {
    // TODO(phase4): persist onboardingComplete and gate this route in the root layout.
    router.replace('/(tabs)' as Href);
  };

  return (
    <Screen padded warm>
      <View style={styles.screen}>
        {step === 4 ? (
          <FadeIn key="calibration" duration={420} style={styles.page}>
            <CalibrationStep onPress={handleCalibration} />
          </FadeIn>
        ) : (
          <View style={styles.page}>
            <View style={styles.hero}>
              <PersistentOrb step={step} />
              <FadeIn key={currentStep.id} duration={320} style={styles.copy}>
                <StepCopy step={step} />
              </FadeIn>
            </View>
            <FadeIn key={`actions-${currentStep.id}`} duration={320}>
              <View style={styles.actions}>
                <PressableScale
                  haptic={step === 5 ? 'milestone' : 'selection'}
                  onPress={
                    step === 3
                      ? () => {
                          void handleEnableReminders();
                        }
                      : step === 5
                        ? handleStart
                        : advance
                  }
                  style={[styles.primaryButton, step === 5 && styles.startButton]}>
                  {step === 5 ? (
                    <LinearGradient
                      colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']}
                      end={{ x: 0.5, y: 1 }}
                      pointerEvents="none"
                      start={{ x: 0.5, y: 0 }}
                      style={styles.buttonSheen}
                    />
                  ) : null}
                  <AppText color={step === 5 ? 'inverse' : 'primary'} variant="heading">
                    {currentStep.buttonLabel}
                  </AppText>
                </PressableScale>
                {step === 3 ? (
                  <PressableScale onPress={advance} style={styles.secondaryChoice}>
                    <AppText color="muted" variant="caption">
                      Not now
                    </AppText>
                  </PressableScale>
                ) : null}
              </View>
            </FadeIn>
          </View>
        )}
        <Footer onBack={() => setStep((current) => Math.max(current - 1, 0))} step={step} />
      </View>
    </Screen>
  );
}

type PersistentOrbProps = {
  step: number;
};

// Co-Star/Linear: one orb is the constant of the flow. It scales between steps with a spring
// instead of remounting per step (which stutters), so the eye tracks a single living object.
function PersistentOrb({ step }: PersistentOrbProps) {
  const target = (step === 2 ? 180 : 152) / BASE_ORB;
  const orbScale = useSharedValue(target);

  useEffect(() => {
    orbScale.value = withSpring(target, motion.spring.snap);
  }, [orbScale, target]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }));

  return (
    <Animated.View style={orbStyle}>
      <BreathingOrb size={BASE_ORB} />
    </Animated.View>
  );
}

type FocusInTextProps = {
  children: string;
};

// Open: the welcome title collapses its letter-spacing into focus - the type itself is the entrance.
function FocusInText({ children }: FocusInTextProps) {
  const progress = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }

    progress.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });

    return () => cancelAnimation(progress);
  }, [progress, reduceMotion]);

  const textStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    letterSpacing: interpolate(progress.value, [0, 1], [8, type.hero.letterSpacing]),
  }));

  return <Animated.Text style={[styles.focusHero, textStyle]}>{children}</Animated.Text>;
}

type StepCopyProps = {
  step: number;
};

function StepCopy({ step }: StepCopyProps) {
  return (
    <>
      {step === 0 ? (
        <>
          <FocusInText>Train the way you see.</FocusInText>
          <AppText color="secondary" variant="caption">
            A quieter daily practice for sharper contrast.
          </AppText>
        </>
      ) : null}
      {step === 1 ? (
        <>
          <AppText variant="title">
            Your brain sharpens contrast with practice — measurably.
          </AppText>
          <AppText color="secondary">
            Short, consistent sessions help perceptual learning settle in over time.
          </AppText>
        </>
      ) : null}
      {step === 2 ? (
        <>
          <AppText variant="title">
            This colour means <AppText color="accent" variant="title">action.</AppText>
          </AppText>
          <AppText color="muted" variant="caption">
            The glow marks anything you can start or commit.
          </AppText>
        </>
      ) : null}
      {step === 3 ? (
        <>
          <AppText variant="title">A gentle cue keeps the practice close.</AppText>
          <AppText color="secondary">
            Daily reminders make it easier to keep your streak and retain each session's gains.
          </AppText>
        </>
      ) : null}
      {step === 5 ? (
        <>
          <AppText variant="hero">You're set.</AppText>
          <AppText color="secondary" variant="caption">
            Your first session will set a baseline.
          </AppText>
        </>
      ) : null}
    </>
  );
}

type CalibrationStepProps = {
  onPress: () => void;
};

function CalibrationStep({ onPress }: CalibrationStepProps) {
  return (
    <View style={styles.hero}>
      <PressableScale onPress={onPress} scaleTo={0.99} style={styles.calibrationTap}>
        <BreathingOrb cadence="breath" reactivity={0.9} size={206} />
        <AppText style={styles.calibrationCopy} variant="title">
          Tap when the glow feels comfortable in your room.
        </AppText>
      </PressableScale>
    </View>
  );
}

type FooterProps = {
  onBack: () => void;
  step: number;
};

function Footer({ onBack, step }: FooterProps) {
  return (
    <View style={styles.footer}>
      <ProgressBar step={step} />
      <View style={styles.footerNav}>
        {step > 0 ? (
          <PressableScale hitSlop={space.sm} onPress={onBack} style={styles.backButton}>
            <AppText color="muted" variant="caption">
              Back
            </AppText>
          </PressableScale>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
      </View>
    </View>
  );
}

type ProgressBarProps = {
  step: number;
};

function ProgressBar({ step }: ProgressBarProps) {
  const fill = useSharedValue((step + 1) / STEPS.length);

  useEffect(() => {
    fill.value = withTiming((step + 1) / STEPS.length, { duration: 320 });
  }, [fill, step]);

  // Contained 2px bar inside a fixed-height track: animating width reflows nothing else.
  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%`,
  }));

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingBottom: space.lg,
    paddingHorizontal: space.xs,
  },
  page: {
    flex: 1,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: space.xl,
    paddingVertical: space.xxl,
  },
  copy: {
    gap: space.base,
    maxWidth: 340,
  },
  focusHero: {
    color: text.primary,
    fontFamily: type.hero.fontFamily,
    fontSize: type.hero.fontSize,
    lineHeight: type.hero.lineHeight,
  },
  actions: {
    gap: space.xs,
    paddingBottom: space.lg,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: surface.raised,
    borderColor: surface.hairlineStrong,
    borderRadius: radius.pill,
    borderWidth: hairline.px1,
    paddingVertical: space.base,
  },
  startButton: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
    overflow: 'hidden',
  },
  buttonSheen: {
    height: '60%',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  secondaryChoice: {
    alignItems: 'center',
    paddingVertical: space.md,
  },
  calibrationTap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xl,
    minHeight: 420,
  },
  calibrationCopy: {
    maxWidth: 320,
    textAlign: 'center',
  },
  footer: {
    gap: space.sm,
    paddingTop: space.sm,
  },
  progressTrack: {
    backgroundColor: surface.hairline,
    borderRadius: radius.pill,
    height: 2,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    backgroundColor: ACCENT,
    borderRadius: radius.pill,
    height: 2,
  },
  footerNav: {
    minHeight: 28,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: space.xs,
  },
  backPlaceholder: {
    height: 26,
  },
});
