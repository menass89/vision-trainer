import { Eye, Glasses, Zap } from 'lucide-react';
import type { GoalType } from '../types';

type GoalSelectionProps = {
  onSelect: (goal: GoalType) => void;
};

const GOALS: Array<{ type: GoalType; icon: typeof Eye; label: string; description: string }> = [
  {
    type: 'myopia',
    icon: Eye,
    label: 'Myopia',
    description: 'Improve distance vision clarity by training high spatial frequency contrast sensitivity.'
  },
  {
    type: 'presbyopia',
    icon: Glasses,
    label: 'Presbyopia',
    description: 'Enhance near vision for reading by training mid-range spatial frequencies at close distance.'
  },
  {
    type: 'sports-vision',
    icon: Zap,
    label: 'Sports Vision',
    description: 'Boost visual processing speed and ultra-fine discrimination for athletic performance.'
  }
];

export function GoalSelection({ onSelect }: GoalSelectionProps) {
  return (
    <section className="panel goal-selection" aria-labelledby="goal-heading">
      <h2 id="goal-heading">What is your training goal?</h2>
      <p className="goal-subtitle">
        This determines which visual functions we target and how difficulty progresses over 30 sessions.
      </p>
      <div className="goal-cards">
        {GOALS.map(({ type, icon: Icon, label, description }) => (
          <button
            key={type}
            type="button"
            className="goal-card"
            onClick={() => onSelect(type)}
          >
            <Icon size={32} />
            <h3>{label}</h3>
            <p>{description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
