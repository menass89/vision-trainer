import type { QuestParameters } from '@/psychophysics/quest';

export const FIRST_VISIBLE_STIM_DURATION_MS = 650;
export const SECOND_VISIBLE_STIM_DURATION_MS = 450;

export const FIRST_SESSION_QUEST_PARAMS: QuestParameters[] = [
  {
    tGuess: 0.25,
    tGuessSd: 0.45,
    pThreshold: 0.79,
    beta: 3.5,
    delta: 0.03,
    gamma: 0.5,
    grain: 0.01,
    range: 1.6,
  },
  {
    tGuess: 0.1,
    tGuessSd: 0.45,
    pThreshold: 0.79,
    beta: 3.5,
    delta: 0.03,
    gamma: 0.5,
    grain: 0.01,
    range: 1.6,
  },
];
