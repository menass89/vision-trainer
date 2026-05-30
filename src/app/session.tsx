import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { GaborCanvas, type GaborCanvasHandle } from '@/components/GaborCanvas';
import { KinoEdgeArc } from '@/components/session/KinoEdgeArc';
import { ResponseSwipe } from '@/components/session/ResponseSwipe';
import { RewardBurst } from '@/components/session/RewardBurst';
import { AppText, PressableScale } from '@/components/ui';
import { useSessionController } from '@/presenters';
import {
  ACCENT,
  ACCENT_GLOW,
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

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function SessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const controller = useSessionController();
  const canvasRef = useRef<GaborCanvasHandle>(null);
  const isMountedRef = useRef(true);
  const trialRunningRef = useRef(false);
  const foldRunningRef = useRef(false);
  const choiceResolverRef = useRef<ChoiceResolver | null>(null);
  const blockStartCorrectCountRef = useRef(0);
  const [uiPhase, setUiPhase] = useState<UiPhase>('ready');
  const [burst, setBurst] = useState(0);
  const [bigBurst, setBigBurst] = useState(false);
  const [blockCorrectCount, setBlockCorrectCount] = useState(0);
  const [showBlockSummary, setShowBlockSummary] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const fieldScale = useSharedValue(1);
  const fieldOpacity = useSharedValue(1);
  const fieldRotation = useSharedValue(0);
  const feedbackRingScale = useSharedValue(0.7);
  const feedbackRingOpacity = useSharedValue(0);

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
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (!(await isStillMounted(450))) return;

    trialRunningRef.current = false;
    setPhase('idle');
  }, [
    controller,
    feedbackRingOpacity,
    feedbackRingScale,
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
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);

    if (!(await isStillMounted(450))) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    setBlockCorrectCount(controller.correctCount - blockStartCorrectCountRef.current);
    setShowBlockSummary(true);
  }, [controller.correctCount, fieldOpacity, fieldRotation, fieldScale, isStillMounted, setPhase]);

  const handleContinue = useCallback(async () => {
    if (!showBlockSummary || !isMountedRef.current) return;

    setShowBlockSummary(false);
    blockStartCorrectCountRef.current = controller.correctCount;
    controller.advanceBlock();
    fieldScale.value = withSpring(1, motion.spring.input);
    fieldOpacity.value = withTiming(1, { duration: 450 });
    fieldRotation.value = withSpring(0, motion.spring.input);

    if (!(await isStillMounted(450))) return;

    foldRunningRef.current = false;
    setPhase('idle');
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
    controller.begin();
    setPhase('idle');
  }, [controller, setPhase]);

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
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.field, fieldStyle]}>
        <GaborCanvas calibration={controller.calibration} ref={canvasRef} />
        <KinoEdgeArc progress={controller.progress} />
        <View pointerEvents="none" style={styles.phaseLayer}>
          {uiPhase === 'fixation' ? <View style={styles.fixationDot} /> : null}
          {uiPhase === 'feedback' && !controller.lastCorrect ? (
            <View style={styles.wrongFeedbackDot} />
          ) : null}
          <Animated.View style={[styles.feedbackRing, feedbackRingStyle]} />
        </View>
        <ResponseSwipe enabled={uiPhase === 'response'} onCommit={handleChoice} />
        <RewardBurst big={bigBurst} trigger={burst} />
      </Animated.View>

      {controller.status === 'ready' && uiPhase === 'ready' ? (
        <View style={[styles.centeredOverlay, styles.readyOverlay]}>
          <AppText style={styles.centeredText} variant="heading">
            {controller.blockLabel}
          </AppText>
          <AppText color="muted" style={styles.centeredText} variant="caption">
            Two flashes. Pick the one with the pattern.
          </AppText>
          <PressableScale haptic="success" onPress={handleBegin} style={styles.action}>
            <AppText color="inverse" variant="caption">
              Begin
            </AppText>
          </PressableScale>
        </View>
      ) : null}

      {showBlockSummary ? (
        <View style={styles.centeredOverlay}>
          <AppText color="muted" uppercase variant="micro">
            Block complete
          </AppText>
          <AppText style={styles.score} tabular variant="title">
            {blockCorrectCount}/{controller.trialsPerBlock}
          </AppText>
          <PressableScale onPress={() => void handleContinue()} style={styles.action}>
            <AppText color="inverse" variant="caption">
              Continue
            </AppText>
          </PressableScale>
        </View>
      ) : null}

      {showCompletion ? (
        <View style={styles.centeredOverlay}>
          <AppText style={styles.centeredText} variant="title">
            Session complete
          </AppText>
          <AppText color="muted" style={styles.centeredText} tabular variant="caption">
            {controller.correctCount}/{controller.totalBlocks * controller.trialsPerBlock} correct
          </AppText>
          <PressableScale haptic="success" onPress={handleClose} style={styles.action}>
            <AppText color="inverse" variant="caption">
              Done
            </AppText>
          </PressableScale>
        </View>
      ) : null}

      <PressableScale
        haptic="light"
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
  },
  centeredText: {
    textAlign: 'center',
  },
  score: {
    marginTop: space.sm,
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
