import { useMemo } from 'react';

import { useAppStore } from '@/store/useAppStore';

import { derivePostSessionInsight } from './derive';
import type { Loadable, PostSessionInsightView } from './types';

export function usePostSessionInsight(sessionId: string | null): Loadable<PostSessionInsightView | null> {
  const hydrated = useAppStore((state) => state.hydrated);
  const sessions = useAppStore((state) => state.sessions);
  const thresholds = useAppStore((state) => state.thresholds);

  const data = useMemo(() => {
    const targetSessionId = sessionId ?? sessions.filter((session) => session.status === 'completed').at(-1)?.id;
    if (!targetSessionId) return null;

    return derivePostSessionInsight(sessions, thresholds, targetSessionId);
  }, [sessionId, sessions, thresholds]);

  return { data, isLoading: !hydrated };
}
