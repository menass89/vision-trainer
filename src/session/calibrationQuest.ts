import type { QuestParameters } from '@/psychophysics/quest';

export const FIRST_VISIBLE_STIM_DURATION_MS = 650;
export const SECOND_VISIBLE_STIM_DURATION_MS = 450;

const MAX_VISIBLE_CONTRAST_LOG10 = Math.log10(0.9);

export const FIRST_SESSION_QUEST_PARAMS: QuestParameters[] = [
  {
    tGuess: MAX_VISIBLE_CONTRAST_LOG10,
    tGuessSd: 0.22,
    pThreshold: 0.79,
    beta: 3.5,
    delta: 0.03,
    gamma: 0.5,
    grain: 0.01,
    range: 0.9,
  },
  {
    tGuess: -0.12,
    tGuessSd: 0.26,
    pThreshold: 0.79,
    beta: 3.5,
    delta: 0.03,
    gamma: 0.5,
    grain: 0.01,
    range: 1,
  },
];
