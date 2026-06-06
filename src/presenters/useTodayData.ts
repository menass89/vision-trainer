import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { buildGuidedSessionBlocks } from '@/session/guidedProtocol';
import { useAppStore } from '@/store/useAppStore';
import { now } from '@/utils/clock';

import { deriveTodayView } from './derive';
import type { Loadable, TodayView } from './types';

export function useTodayData(): Loadable<TodayView> {
  const hydrated = useAppStore((state) => state.hydrated);
  const sessions = useAppStore((state) => state.sessions);
  const settings = useAppStore((state) => state.settings);
  const thresholds = useAppStore((state) => state.thresholds);
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((key) => key + 1);
    }, [])
  );

  const data = useMemo(() => {
    const view = deriveTodayView(sessions, thresholds, now());
    const nextBlocks = buildGuidedSessionBlocks({
      sessionsCompleted: sessions.length,
      thresholds,
      visionGoal: settings.visionGoal,
    });
    const nextTrainingBlock =
      nextBlocks.find((block) => block.role === 'training') ?? nextBlocks[0];
    if (!nextTrainingBlock || thresholds.length === 0) return view;

    return {
      ...view,
      nextTargetLabel: `${formatCpd(nextTrainingBlock.condition.spatialFrequencyCpd)} cpd · 4 min`,
    };
  }, [refreshKey, sessions, settings.visionGoal, thresholds]);
  return { data, isLoading: !hydrated };
}

function formatCpd(cpd: number): string {
  return Number.isInteger(cpd) ? String(cpd) : cpd.toFixed(1);
}
