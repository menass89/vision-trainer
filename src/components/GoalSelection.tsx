import { Eye, Glasses, Zap } from 'lucide-react';
import { useState } from 'react';
import type { GoalType } from '../types';

type GoalSelectionProps = {
  onSelect: (goal: GoalType, monocular: boolean, eye: 'left' | 'right') => void;
};

const GOALS: Array<{ type: GoalType; icon: typeof Eye; label: string; description: string }> = [
  {
    type: 'myopia',
    icon: Eye,
    label: 'Myopia',
    description: 'Sharpen distance vision through contrast training',
  },
  {
    type: 'presbyopia',
    icon: Glasses,
    label: 'Presbyopia',
    description: 'Enhance near-focus clarity for reading',
  },
  {
    type: 'sports-vision',
    icon: Zap,
    label: 'Sports Vision',
    description: 'Faster visual processing & reaction time',
  },
];

export function GoalSelection({ onSelect }: GoalSelectionProps) {
  const [monocular, setMonocular] = useState(false);
  const [monocularEye, setMonocularEye] = useState<'left' | 'right'>('right');

  return (
    <section className="goal-selection" aria-labelledby="goal-heading">
      <h2 id="goal-heading" className="goal-selection__heading">Welcome to Vision Trainer</h2>
      <p className="goal-selection__subtitle">What would you like to improve?</p>

      <div className="goal-cards">
        {GOALS.map(({ type, icon: Icon, label, description }) => (
          <button
            key={type}
            type="button"
            className="goal-card glass-card"
            onClick={() => onSelect(type, monocular, monocularEye)}
          >
            <Icon size={28} />
            <h3>{label}</h3>
            <p>{description}</p>
          </button>
        ))}
      </div>

      <div className="mono-toggle glass-card">
        <div className="mono-toggle__text">
          <span className="mono-toggle__label">Monocular Training</span>
          <span className="mono-toggle__sub">Train each eye separately</span>
        </div>
        <button
          type="button"
          className={`toggle ${monocular ? 'toggle--on' : 'toggle--off'}`}
          onClick={() => setMonocular(!monocular)}
          aria-pressed={monocular}
        />
      </div>

      {monocular && (
        <div className="eye-picker glass-card">
          <span className="eye-picker__label">Which eye is weaker?</span>
          <div className="eye-picker__buttons">
            <button
              type="button"
              className={`eye-picker__btn ${monocularEye === 'left' ? 'eye-picker__btn--active' : ''}`}
              onClick={() => setMonocularEye('left')}
            >
              Left Eye
            </button>
            <button
              type="button"
              className={`eye-picker__btn ${monocularEye === 'right' ? 'eye-picker__btn--active' : ''}`}
              onClick={() => setMonocularEye('right')}
            >
              Right Eye
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
