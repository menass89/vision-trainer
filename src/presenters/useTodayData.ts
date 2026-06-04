import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { useAppStore } from '@/store/useAppStore';
import { now } from '@/utils/clock';

import { deriveTodayView } from './derive';
import type { Loadable, TodayView } from './types';

export function useTodayData(): Loadable<TodayView> {
  const hydrated = useAppStore((state) => state.hydrated);
  const sessions = useAppStore((state) => state.sessions);
  const thresholds = useAppStore((state) => state.thresholds);
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((key) => key + 1);
    }, [])
  );

  const data = useMemo(() => deriveTodayView(sessions, thresholds, now()), [refreshKey, sessions, thresholds]);
  return { data, isLoading: !hydrated };
}
