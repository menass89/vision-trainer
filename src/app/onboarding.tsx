import { type Href, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AmbientGradient } from '@/components/home/AmbientGradient';
import { BreathingOrb } from '@/components/onboarding/BreathingOrb';
import { StepReveal } from '@/components/onboarding/StepReveal';
import { AppText, FadeIn, PressableScale, PrimaryButton, Screen } from '@/components/ui';
import { applyBrightness, getCurrentBrightness } from '@/services/brightness';
import { notificationService } from '@/services/notifications';
import { useAppStore } from '@/store/useAppStore';
import { haptics } from '@/theme/haptics';
import { ACCENT, ACCENT_GLOW, motion, radius, space, surface, text, type } from '@/theme/tokens';
import type { GoalType } from '@/types';

const BASE_ORB = 180;
const BRIGHTNESS_MAX = 1;
const BRIGHTNESS_MIN = 0.2;
const BRIGHTNESS_RANGE = BRIGHTNESS_MAX - BRIGHTNESS_MIN;
const SLIDER_KNOB_SIZE = 28;
const REMINDER_HOUR = 19;
const REMINDER_MINUTE = 0;

const STEPS = [
  { id: 'welcome', buttonLabel: 'Begin' },
  { id: 'science', buttonLabel: 'Continue' },
  { id: 'vision', buttonLabel: 'Continue' },
  { id: 'accent', buttonLabel: 'Got it' },
  { id: 'reminders', buttonLabel: 'Enable reminders' },
  { id: 'calibration', buttonLabel: '' },
  { id: 'ready', buttonLabel: 'Start training' },
] as const;

const GOAL_OPTIONS: Array<{ value: GoalType; label: string; detail: string }> = [
  { value: 'myopia', label: 'Distance clarity', detail: 'Sharper contrast at farther targets.' },
  { value: 'presbyopia', label: 'Near work', detail: 'Comfort for reading and close focus.' },
  { value: 'sports-vision', label: 'Fast reactions', detail: 'Faster visual pickup and motion decisions.' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const currentStep = STEPS[step];
  const [selectedGoal, setSelectedGoal] = useState<GoalType>(() => {
    const storedGoal = useAppStore.getState().settings.visionGoal;
    return storedGoal === 'unspecified' ? 'myopia' : storedGoal;
  });

  const advance = () => {
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const handleEnableReminders = async () => {
    try {
      const granted = await notificationService.requestRemindersPermission();
      if (granted) {
        await notificationService.scheduleDailyReminder(REMINDER_HOUR, REMINDER_MINUTE);
        useAppStore.getState().updateSetting('remindersEnabled', true);
      }
    } catch {
      // Permission/scheduling failed — reflect the off state, never strand the user.
      useAppStore.getState().updateSetting('remindersEnabled', false);
    } finally {
      advance();
    }
  };

  const handleCalibration = () => {
    advance();
  };

  const handleGoalContinue = () => {
    useAppStore.getState().updateSetting('visionGoal', selectedGoal);
    advance();
  };

  const handleStart = () => {
    // Persisted so the root layout never re-onboards a returning user on cold launch.
    useAppStore.getState().updateSetting('onboardingComplete', true);
    router.replace('/paywall' as Href);
  };

  return (
    <Screen padded warm background={<AmbientGradient constellation reduceMotion={reduceMotion} />}>
      <View style={styles.screen}>
        {currentStep.id === 'calibration' ? (
          <FadeIn key="calibration" duration={420} style={styles.page}>
            <CalibrationStep onComplete={handleCalibration} />
          </FadeIn>
        ) : (
          <View style={styles.page}>
            <View style={styles.hero}>
              <PersistentOrb step={step} />
              <View key={currentStep.id} style={styles.copy}>
                <StepCopy step={step} />
                {currentStep.id === 'vision' ? (
                  <GoalChoices selected={selectedGoal} onSelect={setSelectedGoal} />
                ) : null}
              </View>
            </View>
            <FadeIn key={`actions-${currentStep.id}`} delay={240} duration={motion.timing.entranceMs}>
              <View style={styles.actions}>
                <PrimaryButton
                  haptic={currentStep.id === 'ready' ? 'milestone' : 'selection'}
                  label={currentStep.buttonLabel}
                  onPress={
                    currentStep.id === 'vision'
                      ? handleGoalContinue
                      : currentStep.id === 'reminders'
                      ? () => {
                          void handleEnableReminders();
                        }
                      : currentStep.id === 'ready'
                        ? handleStart
                        : advance
                  }
                />
                {currentStep.id === 'reminders' ? (
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
      <BreathingOrb resolveOnMount size={BASE_ORB} />
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
          <FocusInText>{'Train the\nway you see'}</FocusInText>
          <StepReveal delay={200} duration={320}>
            <AppText color="secondary" variant="caption">
              A quieter daily practice for sharper contrast.
            </AppText>
          </StepReveal>
        </>
      ) : null}
      {step === 1 ? (
        <>
          <StepReveal delay={0}>
            <AppText variant="title">
              Your brain sharpens contrast with practice. Measurably.
            </AppText>
          </StepReveal>
          <StepReveal delay={120} duration={320}>
            <AppText color="secondary">
              Short, consistent sessions help perceptual learning settle in over time.
            </AppText>
          </StepReveal>
        </>
      ) : null}
      {step === 2 ? (
        <>
          <StepReveal delay={0}>
            <AppText variant="title">What should training optimise for?</AppText>
          </StepReveal>
          <StepReveal delay={120} duration={320}>
            <AppText color="secondary">
              The first calibration stays broad. Your goal shapes the training plan after that.
            </AppText>
          </StepReveal>
        </>
      ) : null}
      {step === 3 ? (
        <>
          <StepReveal delay={0}>
            <AppText variant="title">
              This colour means <AppText color="accent" variant="title">action.</AppText>
            </AppText>
          </StepReveal>
          <StepReveal delay={120} duration={320}>
            <AppText color="muted" variant="caption">
              The glow marks anything you can start or commit.
            </AppText>
          </StepReveal>
        </>
      ) : null}
      {step === 4 ? (
        <>
          <StepReveal delay={0}>
            <AppText variant="title">A gentle cue keeps the practice close.</AppText>
          </StepReveal>
          <StepReveal delay={120} duration={320}>
            <AppText color="secondary">
              Daily reminders make it easier to keep your streak and retain each session's gains.
            </AppText>
          </StepReveal>
        </>
      ) : null}
      {step === 6 ? (
        <>
          <StepReveal delay={0}>
            <AppText variant="hero">You're set</AppText>
          </StepReveal>
          <StepReveal delay={120} duration={320}>
            <AppText color="secondary" variant="caption">
              Your first session will set a baseline.
            </AppText>
          </StepReveal>
        </>
      ) : null}
    </>
  );
}

type GoalChoicesProps = {
  selected: GoalType;
  onSelect: (goal: GoalType) => void;
};

function GoalChoices({ selected, onSelect }: GoalChoicesProps) {
  return (
    <View style={styles.goalList}>
      {GOAL_OPTIONS.map((option) => {
        const isSelected = selected === option.value;

        return (
          <PressableScale
            accessibilityRole="button"
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={[styles.goalChoice, isSelected && styles.goalChoiceSelected]}>
            <View>
              <AppText color="primary" variant="caption">
                {option.label}
              </AppText>
              <AppText color="muted" variant="micro">
                {option.detail}
              </AppText>
            </View>
            <View style={[styles.goalDot, isSelected && styles.goalDotSelected]} />
          </PressableScale>
        );
      })}
    </View>
  );
}

type CalibrationStepProps = {
  onComplete: () => void;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function brightnessToProgress(value: number) {
  return (clamp(value, BRIGHTNESS_MIN, BRIGHTNESS_MAX) - BRIGHTNESS_MIN) / BRIGHTNESS_RANGE;
}

function CalibrationStep({ onComplete }: CalibrationStepProps) {
  const storedBrightness = useAppStore((state) => state.settings.displayBrightness);
  const [brightness, setBrightness] = useState(
    clamp(storedBrightness, BRIGHTNESS_MIN, BRIGHTNESS_MAX)
  );
  const [trackWidth, setTrackWidth] = useState(0);
  const lastHapticStepRef = useRef(Math.round(brightness * 10));
  const latestBrightnessRef = useRef(brightness);
  const progress = useSharedValue(brightnessToProgress(brightness));
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let active = true;

    const loadInitialBrightness = async () => {
      const currentBrightness = await getCurrentBrightness();
      const initialBrightness = clamp(
        currentBrightness ?? storedBrightness,
        BRIGHTNESS_MIN,
        BRIGHTNESS_MAX
      );

      if (!active) return;

      latestBrightnessRef.current = initialBrightness;
      lastHapticStepRef.current = Math.round(initialBrightness * 10);
      setBrightness(initialBrightness);
      progress.value = reduceMotion
        ? brightnessToProgress(initialBrightness)
        : withTiming(brightnessToProgress(initialBrightness), { duration: 180 });
    };

    void loadInitialBrightness();

    return () => {
      active = false;
    };
  }, [progress, reduceMotion, storedBrightness]);

  const commitBrightness = useCallback((nextBrightness: number) => {
    const calibratedBrightness = clamp(nextBrightness, BRIGHTNESS_MIN, BRIGHTNESS_MAX);
    const hapticStep = Math.round(calibratedBrightness * 10);

    latestBrightnessRef.current = calibratedBrightness;
    setBrightness(calibratedBrightness);
    void applyBrightness(calibratedBrightness);

    if (hapticStep !== lastHapticStepRef.current) {
      lastHapticStepRef.current = hapticStep;
      haptics.select();
    }
  }, []);

  const confirmBrightness = () => {
    const calibratedBrightness = clamp(latestBrightnessRef.current, BRIGHTNESS_MIN, BRIGHTNESS_MAX);

    useAppStore.getState().updateSetting('displayBrightness', calibratedBrightness);
    onComplete();
  };

  const gesture = useMemo(() => {
    const updateFromX = (x: number) => {
      'worklet';
      const travel = Math.max(trackWidth - SLIDER_KNOB_SIZE, 0);
      const nextProgress =
        travel === 0
          ? progress.value
          : Math.max(0, Math.min(1, (x - SLIDER_KNOB_SIZE / 2) / travel));
      const nextBrightness = BRIGHTNESS_MIN + nextProgress * BRIGHTNESS_RANGE;

      progress.value = nextProgress;
      runOnJS(commitBrightness)(nextBrightness);
    };
    const pan = Gesture.Pan()
      .activeOffsetX([-4, 4])
      .onBegin((event) => {
        updateFromX(event.x);
      })
      .onUpdate((event) => {
        updateFromX(event.x);
      });
    const tap = Gesture.Tap().onEnd((event) => {
      updateFromX(event.x);
    });

    return Gesture.Race(pan, tap);
  }, [commitBrightness, progress, trackWidth]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));
  const knobStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [text.secondary, text.inverse]),
    shadowOpacity: 0.3 + progress.value * 0.35,
    transform: [{ translateX: progress.value * Math.max(trackWidth - SLIDER_KNOB_SIZE, 0) }],
  }));

  return (
    <View style={styles.calibration}>
      <View style={styles.calibrationReference}>
        <BreathingOrb cadence="breath" reactivity={0.9} size={206} />
        <AppText style={styles.calibrationCopy} variant="title">
          Set a comfortable glow for your room.
        </AppText>
      </View>

      <View style={styles.calibrationControls}>
        <GestureDetector gesture={gesture}>
          <View
            onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
            style={styles.slider}>
            <View pointerEvents="none" style={styles.sliderTrack}>
              <Animated.View style={[styles.sliderFill, fillStyle]} />
            </View>
            <Animated.View pointerEvents="none" style={[styles.sliderKnob, knobStyle]} />
          </View>
        </GestureDetector>
        <View style={styles.sliderLabels}>
          <AppText color="muted" variant="micro">
            Dim
          </AppText>
          <AppText color="muted" tabular variant="micro">
            {Math.round(brightness * 100)}%
          </AppText>
          <AppText color="muted" variant="micro">
            Bright
          </AppText>
        </View>
      </View>

      <PrimaryButton label="This feels right" onPress={confirmBrightness} />
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
    paddingHorizontal: 0,
  },
  page: {
    flex: 1,
  },
  hero: {
    flex: 1,
    justifyContent: 'flex-end',
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
  secondaryChoice: {
    alignItems: 'center',
    paddingVertical: space.md,
  },
  calibration: {
    alignItems: 'center',
    gap: space.xl,
    justifyContent: 'flex-end',
    minHeight: 520,
    paddingBottom: space.lg,
  },
  calibrationControls: {
    gap: space.sm,
    width: '100%',
  },
  calibrationCopy: {
    maxWidth: 320,
    textAlign: 'center',
  },
  calibrationReference: {
    alignItems: 'center',
    gap: space.xl,
    justifyContent: 'center',
  },
  slider: {
    height: 44,
    justifyContent: 'center',
    width: '100%',
  },
  sliderFill: {
    backgroundColor: ACCENT,
    borderRadius: radius.pill,
    height: '100%',
  },
  sliderKnob: {
    backgroundColor: text.inverse,
    borderColor: ACCENT_GLOW,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: SLIDER_KNOB_SIZE,
    left: 0,
    position: 'absolute',
    shadowColor: ACCENT_GLOW,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    width: SLIDER_KNOB_SIZE,
  },
  sliderLabels: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderTrack: {
    backgroundColor: surface.hairlineStrong,
    borderRadius: radius.pill,
    height: 8,
    overflow: 'hidden',
    width: '100%',
  },
  footer: {
    gap: space.sm,
    paddingTop: space.sm,
  },
  goalChoice: {
    alignItems: 'center',
    backgroundColor: surface.raised,
    borderColor: surface.hairline,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: space.md,
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  goalChoiceSelected: {
    backgroundColor: 'rgba(51, 210, 214, 0.12)',
    borderColor: ACCENT_GLOW,
  },
  goalDot: {
    backgroundColor: surface.hairline,
    borderRadius: radius.pill,
    height: 10,
    width: 10,
  },
  goalDotSelected: {
    backgroundColor: ACCENT,
    shadowColor: ACCENT_GLOW,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
  },
  goalList: {
    gap: space.sm,
    width: '100%',
  },
  progressTrack: {
    backgroundColor: surface.hairlineStrong,
    borderRadius: radius.pill,
    height: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    backgroundColor: ACCENT,
    borderRadius: radius.pill,
    height: 3,
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
