export type QuestParameters = {
  tGuess: number;
  tGuessSd: number;
  pThreshold: number;
  beta: number;
  delta: number;
  gamma: number;
  grain: number;
  range: number;
};

export type QuestEstimate = {
  thresholdLog10: number;
  sdLog10: number;
  ciLowLog10: number;
  ciHighLog10: number;
};

const DEFAULT_PARAMS: QuestParameters = {
  tGuess: -1,
  tGuessSd: 0.6,
  pThreshold: 0.79,
  beta: 3.5,
  delta: 0.03,
  gamma: 0.5,
  grain: 0.01,
  range: 4
};

const CLAMP_MIN = -3;
const CLAMP_MAX = Math.log10(0.9);
const MAX_GRID_POINTS = 10_000;

export class QuestStaircase {
  private readonly grid: number[];
  private readonly posterior: number[];
  private readonly thresholdScale: number;
  private trialCountValue = 0;
  private lapseCount = 0;

  private readonly params: QuestParameters;

  constructor(params: QuestParameters = DEFAULT_PARAMS) {
    this.params = Object.freeze({ ...params });
    const { tGuess, tGuessSd, pThreshold, beta, delta, gamma, grain, range } = this.params;

    if (![tGuess, tGuessSd, pThreshold, beta, delta, gamma, grain, range].every(Number.isFinite)) {
      throw new Error('Invalid QUEST params: all parameters must be finite numbers.');
    }
    if (!(tGuessSd > 0)) {
      throw new Error('Invalid QUEST params: require tGuessSd > 0.');
    }
    if (!(beta > 0)) {
      throw new Error('Invalid QUEST params: require beta > 0.');
    }
    if (!(gamma >= 0 && gamma < 1)) {
      throw new Error('Invalid QUEST params: require 0 <= gamma < 1.');
    }
    if (!(delta >= 0 && delta < 1)) {
      throw new Error('Invalid QUEST params: require 0 <= delta < 1.');
    }
    if (!(grain > 0)) {
      throw new Error('Invalid QUEST params: require grain > 0.');
    }
    if (!(range > 0)) {
      throw new Error('Invalid QUEST params: require range > 0.');
    }

    const dynamicRange = 1 - gamma - delta;
    if (!(dynamicRange > 0)) {
      throw new Error('Invalid QUEST params: require gamma + delta < 1.');
    }
    if (pThreshold <= gamma || pThreshold >= 1 - delta) {
      throw new Error('Invalid QUEST params: require gamma < pThreshold < 1 - delta.');
    }
    const thresholdProbability = (pThreshold - gamma) / dynamicRange;
    this.thresholdScale = -Math.log(1 - thresholdProbability);

    const gridMin = Math.max(tGuess - range / 2, CLAMP_MIN);
    const gridMax = Math.min(tGuess + range / 2, CLAMP_MAX);
    if (gridMin > gridMax) {
      throw new Error(
        'Invalid QUEST params: guessed threshold range does not overlap supported intensity bounds.'
      );
    }
    const gridPointCount = Math.floor((gridMax - gridMin) / grain) + 1;
    const lastSteppedPoint = gridMin + (gridPointCount - 1) * grain;
    const willAppendGridMax = Math.abs(lastSteppedPoint - gridMax) > 1e-12;
    const totalPoints = gridPointCount + (willAppendGridMax ? 1 : 0);
    if (totalPoints > MAX_GRID_POINTS) {
      throw new Error('Invalid QUEST params: grid resolution is too fine for the supported range.');
    }
    this.grid = [];
    this.posterior = [];
    const pushGridPoint = (x: number) => {
      this.grid.push(x);
      const z = (x - tGuess) / tGuessSd;
      this.posterior.push(Math.exp(-0.5 * z * z));
    };
    for (let x = gridMin; x <= gridMax; x += grain) {
      pushGridPoint(x);
    }
    const last = this.grid.at(-1);
    if (last === undefined || Math.abs(last - gridMax) > 1e-12) {
      pushGridPoint(gridMax);
    }
    this.normalize(this.posterior);
  }

  nextIntensity(): number {
    return this.clampIntensity(this.quantile(0.5));
  }

  record(intensityLog10: number, correct: boolean, catchTrial = false): void {
    this.trialCountValue += 1;
    if (catchTrial && !correct) {
      this.lapseCount += 1;
    }
    for (let i = 0; i < this.grid.length; i += 1) {
      const pCorrect = this.psychometricProbability(intensityLog10, this.grid[i]);
      this.posterior[i] *= correct ? pCorrect : 1 - pCorrect;
    }
    this.normalize(this.posterior);
  }

  estimate(): QuestEstimate {
    const thresholdLog10 = this.mean();
    const sdLog10 = this.sd(thresholdLog10);
    return {
      thresholdLog10,
      sdLog10,
      ciLowLog10: this.clampIntensity(thresholdLog10 - 1.96 * sdLog10),
      ciHighLog10: this.clampIntensity(thresholdLog10 + 1.96 * sdLog10)
    };
  }

  trialCount(): number {
    return this.trialCountValue;
  }

  lapseRate(): number {
    return this.trialCountValue === 0 ? 0 : this.lapseCount / this.trialCountValue;
  }

  private psychometricProbability(intensityLog10: number, thresholdLog10: number): number {
    const slope = Math.pow(10, this.params.beta * (intensityLog10 - thresholdLog10));
    const weibull = 1 - Math.exp(-this.thresholdScale * slope);
    return this.params.gamma + (1 - this.params.gamma - this.params.delta) * weibull;
  }

  private quantile(target: number): number {
    let cumulative = 0;
    for (let i = 0; i < this.grid.length; i += 1) {
      cumulative += this.posterior[i];
      if (cumulative >= target) {
        return this.grid[i];
      }
    }
    return this.grid.at(-1) ?? this.params.tGuess;
  }

  private mean(): number {
    return this.clampIntensity(
      this.grid.reduce((sum, value, i) => sum + value * this.posterior[i], 0)
    );
  }

  private sd(mean: number): number {
    const variance = this.grid.reduce((sum, value, i) => {
      return sum + Math.pow(value - mean, 2) * this.posterior[i];
    }, 0);
    return Math.max(0.02, Math.sqrt(variance));
  }

  private normalize(values: number[]): void {
    const total = values.reduce((sum, v) => sum + v, 0);
    if (total <= 0 || !Number.isFinite(total)) {
      values.fill(1 / values.length);
      return;
    }
    for (let i = 0; i < values.length; i += 1) {
      values[i] /= total;
    }
  }

  private clampIntensity(value: number): number {
    return Math.max(CLAMP_MIN, Math.min(CLAMP_MAX, value));
  }
}

export function contrastFromLog10(intensityLog10: number): number {
  return Math.max(0.001, Math.min(0.9, Math.pow(10, intensityLog10)));
}
