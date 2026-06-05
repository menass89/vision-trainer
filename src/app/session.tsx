import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { GaborCanvas, type GaborCanvasHandle } from '@/components/GaborCanvas';
import { AmbientGradient } from '@/components/home/AmbientGradient';
import { CompletionReward } from '@/components/session/CompletionReward';
import { KinoEdgeArc } from '@/components/session/KinoEdgeArc';
import { ResponseTap } from '@/components/session/ResponseTap';
import { RewardBurst } from '@/components/session/RewardBurst';
import { AppText, Bloom, FadeIn, GlassSurface, PressableScale, PrimaryButton } from '@/components/ui';
import { useSessionController } from '@/presenters';
import { applyBrightness, restoreSystemBrightness } from '@/services/brightness';
import { useAppStore } from '@/store/useAppStore';
import { haptics } from '@/theme/haptics';
import { easings } from '@/theme/motion';
import {
  ACCENT,
  ACCENT_CORE,
  ACCENT_GLOW,
  material,
  motion,
  radius,
  space,
  surface,
  text,
  verdict,
} from '@/theme/tokens';
import type { GaborStimulus, TrialInterval } from '@/types';

type UiPhase =
  | 'idle'
  | 'ready'
  | 'fixation'
  | 'interval-1'
  | 'isi'
  | 'interval-2'
  | 'response'
  | 'feedback'
  | 'block-fold';

type ChoiceResolver = (choice: TrialInterval | null) => void;

const CHECKMARK_LENGTH = 28;
const READY_GLOW = 'rgba(51,210,214,0.06)';
const AnimatedPath = Animated.createAnimatedComponent(Path);
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function SessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const controller = useSessionController();
  const canvasRef = useRef<GaborCanvasHandle>(null);
  const isMountedRef = useRef(true);
  const trialRunningRef = useRef(false);
  const foldRunningRef = useRef(false);
  const continueRunningRef = useRef(false);
  const choiceResolverRef = useRef<ChoiceResolver | null>(null);
  const blockStartCorrectCountRef = useRef(0);
  const [uiPhase, setUiPhase] = useState<UiPhase>('ready');
  const [burst, setBurst] = useState(0);
  const [bigBurst, setBigBurst] = useState(false);
  const [blockCorrectCount, setBlockCorrectCount] = useState(0);
  const [canvasReady, setCanvasReady] = useState(false);
  const [showBlockSummary, setShowBlockSummary] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const fieldScale = useSharedValue(1);
  const fieldOpacity = useSharedValue(1);
  const fieldRotation = useSharedValue(0);
  const feedbackRingScale = useSharedValue(0.7);
  const feedbackRingOpacity = useSharedValue(0);
  const checkDraw = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const bornProgress = useSharedValue(reduceMotion ? 1 : 0);

  const fieldStyle = useAnimatedStyle(() => ({
    opacity: fieldOpacity.value,
    transform: [
      { perspective: 900 },
      { scale: fieldScale.value },
      { rotateX: `${fieldRotation.value}deg` },
    ],
  }));
  const feedbackRingStyle = useAnimatedStyle(() => ({
    opacity: feedbackRingOpacity.value,
    transform: [{ scale: feedbackRingScale.value }],
  }));
  const checkmarkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
  }));
  const checkmarkProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECKMARK_LENGTH * (1 - checkDraw.value),
  }));
  const readyHaloStyle = useAnimatedStyle(() => {
    const p = interpolate(bornProgress.value, [0, 0.55], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: p,
      transform: [{ scale: 0.62 + p * 0.38 }],
    };
  });
  const readyWashStyle = useAnimatedStyle(() => ({
    opacity: interpolate(bornProgress.value, [0.05, 0.5], [0, 1], Extrapolation.CLAMP),
  }));
  const metaRiseStyle = useAnimatedStyle(() => {
    const p = interpolate(bornProgress.value, [0.45, 0.7], [0, 1], Extrapolation.CLAMP);
    return { opacity: p, transform: [{ translateY: 10 * (1 - p) }] };
  });
  const heroRiseStyle = useAnimatedStyle(() => {
    const p = interpolate(bornProgress.value, [0.55, 0.82], [0, 1], Extrapolation.CLAMP);
    return { opacity: p, transform: [{ translateY: 10 * (1 - p) }] };
  });
  const instructionRiseStyle = useAnimatedStyle(() => {
    const p = interpolate(bornProgress.value, [0.65, 0.92], [0, 1], Extrapolation.CLAMP);
    return { opacity: p, transform: [{ translateY: 10 * (1 - p) }] };
  });
  const beginRiseStyle = useAnimatedStyle(() => {
    const p = interpolate(bornProgress.value, [0.75, 1], [0, 1], Extrapolation.CLAMP);
    return { opacity: p, transform: [{ translateY: 10 * (1 - p) }] };
  });

  useEffect(() => {
    void applyBrightness(useAppStore.getState().settings.displayBrightness);

    return () => {
      void restoreSystemBrightness();
    };
  }, []);

  const isStillMounted = useCallback(async (ms: number) => {
    await delay(ms);
    return isMountedRef.current;
  }, []);

  const setPhase = useCallback((phase: UiPhase) => {
    if (isMountedRef.current) setUiPhase(phase);
  }, []);

  const presentInterval = useCallback(
    async (stimulus: GaborStimulus | null, durationMs: number) => {
      if (!isMountedRef.current) return false;

      if (stimulus) {
        await canvasRef.current?.present(stimulus);
      } else {
        canvasRef.current?.clear();
        if (!(await isStillMounted(durationMs))) return false;
      }

      return isMountedRef.current;
    },
    [isStillMounted]
  );

  const waitForChoice = useCallback(
    () =>
      new Promise<TrialInterval | null>((resolve) => {
        choiceResolverRef.current = resolve;
      }),
    []
  );

  const handleChoice = useCallback((choice: TrialInterval) => {
    const resolve = choiceResolverRef.current;

    choiceResolverRef.current = null;
    resolve?.(choice);
  }, []);

  const runTrial = useCallback(async () => {
    if (trialRunningRef.current || !isMountedRef.current) return;

    trialRunningRef.current = true;
    setPhase('fixation');
    if (!(await isStillMounted(500))) return;

    const trial = controller.currentTrial();
    const stimulus = trial.intervals[0] ?? trial.intervals[1];
    const durationMs = stimulus?.durationMs ?? 150;

    setPhase('interval-1');
    if (!(await presentInterval(trial.intervals[0], durationMs))) return;

    setPhase('isi');
    canvasRef.current?.clear();
    if (!(await isStillMounted(400))) return;

    setPhase('interval-2');
    if (!(await presentInterval(trial.intervals[1], durationMs))) return;

    canvasRef.current?.clear();
    setPhase('response');
    const choice = await waitForChoice();

    if (!choice || !isMountedRef.current) return;

    const finishesBlock = controller.trialIndex + 1 >= controller.trialsPerBlock;
    const { correct } = controller.respond(choice);

    setPhase('feedback');
    if (correct) {
      setBigBurst(finishesBlock);
      setBurst((current) => current + 1);
      feedbackRingScale.value = 0.7;
      feedbackRingOpacity.value = 1;
      feedbackRingScale.value = withSpring(finishesBlock ? 1.45 : 1.2, motion.spring.reward);
      feedbackRingOpacity.value = withTiming(0, { duration: 420 });
      checkDraw.value = 0;
      checkOpacity.value = 1;
      checkDraw.value = withTiming(1, { duration: 160, easing: easings.out });
      checkOpacity.value = withDelay(300, withTiming(0, { duration: 200 }));
      haptics.correct();
    } else {
      checkOpacity.value = 0;
      haptics.wrong();
    }

    if (!(await isStillMounted(450))) return;

    trialRunningRef.current = false;
    fieldScale.value = withSequence(
      withSpring(0.985, motion.spring.liquid),
      withSpring(1, motion.spring.liquid)
    );
    fieldOpacity.value = withSequence(
      withSpring(0.9, motion.spring.liquid),
      withSpring(1, motion.spring.liquid)
    );
    setPhase('idle');
  }, [
    checkDraw,
    checkOpacity,
    controller,
    feedbackRingOpacity,
    feedbackRingScale,
    fieldOpacity,
    fieldScale,
    isStillMounted,
    presentInterval,
    setPhase,
    waitForChoice,
  ]);

  const startBlockFold = useCallback(async () => {
    if (foldRunningRef.current || !isMountedRef.current) return;

    foldRunningRef.current = true;
    setPhase('block-fold');
    fieldScale.value = withSpring(0.86, motion.spring.input);
    fieldOpacity.value = withTiming(0.4, { duration: 450 });
    fieldRotation.value = withSpring(3, motion.spring.input);

    if (!(await isStillMounted(450))) return;

    setBlockCorrectCount(controller.correctCount - blockStartCorrectCountRef.current);
    setShowBlockSummary(true);
  }, [controller.correctCount, fieldOpacity, fieldRotation, fieldScale, isStillMounted, setPhase]);

  const handleContinue = useCallback(async () => {
    if (continueRunningRef.current || !showBlockSummary || !isMountedRef.current) return;
    continueRunningRef.current = true;
    try {
      setShowBlockSummary(false);
      blockStartCorrectCountRef.current = controller.correctCount;
      controller.advanceBlock();
      fieldScale.value = withSpring(1, motion.spring.input);
      fieldOpacity.value = withTiming(1, { duration: 450 });
      fieldRotation.value = withSpring(0, motion.spring.input);

      if (!(await isStillMounted(450))) return;

      foldRunningRef.current = false;
      setPhase('idle');
    } finally {
      continueRunningRef.current = false;
    }
  }, [
    controller,
    fieldOpacity,
    fieldRotation,
    fieldScale,
    isStillMounted,
    setPhase,
    showBlockSummary,
  ]);

  const handleBegin = useCallback(() => {
    if (!canvasReady) return;

    controller.begin();
    setPhase('idle');
  }, [canvasReady, controller, setPhase]);

  const handleClose = useCallback(() => {
    canvasRef.current?.clear();
    router.back();
  }, [router]);

  useEffect(() => {
    if (controller.status === 'running' && uiPhase === 'idle' && !trialRunningRef.current) {
      void runTrial();
    } else if (
      controller.status === 'block-complete' &&
      uiPhase === 'idle' &&
      !foldRunningRef.current
    ) {
      void startBlockFold();
    } else if (controller.status === 'complete' && uiPhase === 'idle' && !showCompletion) {
      setShowCompletion(true);
      setBigBurst(true);
      setBurst((current) => current + 1);
      haptics.rewardChord();
    }
  }, [controller.status, runTrial, showCompletion, startBlockFold, uiPhase]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      canvasRef.current?.clear();
      choiceResolverRef.current?.(null);
      choiceResolverRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      bornProgress.value = 1;
      return;
    }
    bornProgress.value = 0;
    bornProgress.value = withDelay(0, withTiming(1, { duration: 520, easing: easings.out }));
    return () => cancelAnimation(bornProgress);
  }, [bornProgress, reduceMotion]);

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.field, fieldStyle]}>
        <GaborCanvas
          calibration={controller.calibration}
          onReadyChange={setCanvasReady}
          ref={canvasRef}
        />
        <KinoEdgeArc progress={controller.progress} />
        <View pointerEvents="none" style={styles.phaseLayer}>
          {uiPhase === 'fixation' ? <View style={styles.fixationDot} /> : null}
          {uiPhase === 'feedback' && !controller.lastCorrect ? (
            <View style={styles.wrongFeedbackDot} />
          ) : null}
          <Animated.View style={[styles.feedbackRing, feedbackRingStyle]} />
          <Animated.View style={[styles.checkmark, checkmarkStyle]}>
            <Svg height={28} width={28}>
              <AnimatedPath
                animatedProps={checkmarkProps}
                d="M4 14L11 21L24 7"
                fill="none"
                stroke={ACCENT}
                strokeDasharray={CHECKMARK_LENGTH}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
              />
            </Svg>
          </Animated.View>
        </View>
        <ResponseTap enabled={uiPhase === 'response'} onCommit={handleChoice} />
        <RewardBurst big={bigBurst} trigger={burst} />
        <TrialPhaseGuide phase={uiPhase} />
      </Animated.View>

      {controller.status === 'ready' && uiPhase === 'ready' ? (
        <View style={styles.readyOverlay}>
          <Animated.View style={[StyleSheet.absoluteFill, readyWashStyle]}>
            <AmbientGradient constellation reduceMotion={reduceMotion} />
          </Animated.View>

          {/* Center halo that CATCHES the Today orb's departing bloom — same hue ladder, blooms outward. */}
          <Animated.View pointerEvents="none" style={[styles.readyHalo, readyHaloStyle]}>
            <Bloom color={ACCENT_GLOW} core={ACCENT_CORE} edge={ACCENT_GLOW} />
          </Animated.View>

          {/* Existing soft top glow, fades in with the wash. */}
          <Animated.View style={[styles.readyGlow, readyWashStyle]} pointerEvents="none">
            <Bloom color={READY_GLOW} rx="70%" ry="42%" />
          </Animated.View>

          <View style={[styles.readyContent, { paddingBottom: insets.bottom + space.xxl }]}>
            <Animated.View style={metaRiseStyle}>
              <AppText color="muted" style={styles.readyMeta} uppercase variant="micro">
                {controller.blockLabel}
              </AppText>
            </Animated.View>
            <Animated.View style={heroRiseStyle}>
              <AppText style={styles.readyHero} variant="hero">
                Two flashes
              </AppText>
            </Animated.View>
            <Animated.View style={instructionRiseStyle}>
              <AppText color="secondary" style={styles.readyInstruction} variant="body">
                Pick the one with the pattern.
              </AppText>
            </Animated.View>
            <Animated.View style={[styles.beginWrap, beginRiseStyle]}>
              <PrimaryButton
                disabled={!canvasReady}
                haptic="select"
                label={canvasReady ? 'Begin' : 'Preparing'}
                onPress={handleBegin}
              />
            </Animated.View>
          </View>
        </View>
      ) : null}

      {showBlockSummary ? (
        <View style={styles.centeredOverlay}>
          <FadeIn duration={motion.timing.entranceMs}>
            <GlassSurface radius={material.radius} style={styles.overlayCard}>
              <AppText color="muted" uppercase variant="micro">
                Block complete
              </AppText>
              <View style={styles.blockScore}>
                <Bloom color={ACCENT_GLOW} style={styles.blockBloom} />
                <AppText style={styles.score} tabular variant="title">
                  {blockCorrectCount}/{controller.trialsPerBlock}
                </AppText>
              </View>
              <PressableScale onPress={() => void handleContinue()} style={styles.action}>
                <AppText color="inverse" variant="caption">
                  Continue
                </AppText>
              </PressableScale>
            </GlassSurface>
          </FadeIn>
        </View>
      ) : null}

      {showCompletion ? (
        <CompletionReward
          accuracyTarget={Math.round(
            (controller.correctCount / (controller.totalBlocks * controller.trialsPerBlock)) * 100
          )}
          correctCount={controller.correctCount}
          onDone={handleClose}
          reduceMotion={reduceMotion}
          total={controller.totalBlocks * controller.trialsPerBlock}
        />
      ) : null}

      <PressableScale
        accessibilityLabel="Close session"
        accessibilityRole="button"
        hitSlop={12}
        onPress={handleClose}
        style={[styles.close, { top: insets.top + space.sm }]}>
        <Svg height={14} width={14}>
          <Path d="M2 2L12 12M12 2L2 12" stroke={text.muted} strokeLinecap="round" strokeWidth={1.4} />
        </Svg>
      </PressableScale>
    </View>
  );
}

function TrialPhaseGuide({ phase }: { phase: UiPhase }) {
  const activeIndex =
    phase === 'interval-1' ? 0 : phase === 'isi' ? 1 : phase === 'interval-2' ? 2 : null;
  const label =
    phase === 'fixation'
      ? 'Ready'
      : phase === 'interval-1'
        ? 'Flash 1'
        : phase === 'isi'
          ? 'Wait'
          : phase === 'interval-2'
            ? 'Flash 2'
            : phase === 'response'
              ? 'Choose'
              : null;

  if (!label) return null;

  return (
    <View pointerEvents="none" style={styles.phaseGuide}>
      <View style={styles.phaseRail}>
        {['1', '·', '2'].map((item, index) => (
          <View
            key={`${item}-${index}`}
            style={[
              styles.phaseStep,
              activeIndex === index ? styles.phaseStepActive : styles.phaseStepIdle,
            ]}>
            <AppText color={activeIndex === index ? 'inverse' : 'muted'} tabular variant="micro">
              {item}
            </AppText>
          </View>
        ))}
      </View>
      <AppText color="primary" variant="caption">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: surface.base,
    flex: 1,
  },
  field: {
    backgroundColor: surface.base,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  phaseLayer: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  phaseGuide: {
    alignItems: 'center',
    backgroundColor: 'rgba(8, 10, 13, 0.62)',
    borderColor: 'rgba(239, 243, 244, 0.12)',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    bottom: '58%',
    gap: space.xs,
    left: '50%',
    marginLeft: -68,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    position: 'absolute',
    width: 136,
    zIndex: 5,
  },
  phaseRail: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.xs,
  },
  phaseStep: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  phaseStepActive: {
    backgroundColor: ACCENT_CORE,
  },
  phaseStepIdle: {
    backgroundColor: 'rgba(239, 243, 244, 0.08)',
    borderColor: surface.hairline,
    borderWidth: StyleSheet.hairlineWidth,
  },
  fixationDot: {
    backgroundColor: text.secondary,
    borderRadius: radius.pill,
    height: 5,
    opacity: 0.7,
    width: 5,
  },
  wrongFeedbackDot: {
    backgroundColor: verdict.regressing,
    borderRadius: radius.pill,
    height: 10,
    opacity: 0.42,
    width: 10,
  },
  feedbackRing: {
    borderColor: ACCENT,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 72,
    position: 'absolute',
    width: 72,
  },
  checkmark: {
    position: 'absolute',
  },
  centeredOverlay: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    paddingHorizontal: space.xl,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  readyOverlay: {
    backgroundColor: surface.base,
    bottom: 0,
    justifyContent: 'flex-end',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  readyGlow: {
    height: '55%',
    left: 0,
    position: 'absolute',
    right: 0,
    top: '6%',
  },
  readyHalo: {
    alignItems: 'center',
    height: '70%',
    justifyContent: 'center',
    left: '-15%',
    position: 'absolute',
    right: '-15%',
    top: '4%',
  },
  readyContent: {
    paddingHorizontal: space.lg,
  },
  readyMeta: {
    letterSpacing: 1.6,
  },
  readyHero: {
    marginTop: space.md,
  },
  readyInstruction: {
    marginTop: space.sm,
  },
  beginWrap: {
    marginTop: space.xl,
  },
  score: {
    marginTop: space.sm,
  },
  overlayCard: {
    alignItems: 'center',
    padding: space.lg,
  },
  blockScore: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockBloom: {
    bottom: -space.md,
    left: -space.xl,
    right: -space.xl,
    top: -space.md,
  },
  action: {
    alignItems: 'center',
    backgroundColor: ACCENT,
    borderColor: ACCENT_GLOW,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: space.lg,
    minWidth: 112,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  close: {
    alignItems: 'center',
    borderColor: surface.hairline,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    left: space.base,
    position: 'absolute',
    width: 32,
  },
});
