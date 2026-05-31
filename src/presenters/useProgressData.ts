import { useMemo } from 'react';

import { useAppStore } from '@/store/useAppStore';
import { now } from '@/utils/clock';

import { deriveProgressView } from './derive';
import type { Loadable, ProgressView } from './types';

export function useProgressData(): Loadable<ProgressView> {
  const hydrated = useAppStore((state) => state.hydrated);
  const sessions = useAppStore((state) => state.sessions);
  const thresholds = useAppStore((state) => state.thresholds);
  const data = useMemo(() => deriveProgressView(sessions, thresholds, now()), [sessions, thresholds]);
  return { data, isLoading: !hydrated };
}
