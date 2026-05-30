import { Activity, ArrowRight, Eye, Glasses, Zap } from 'lucide-react';
import { useState } from 'react';
import type { GoalType } from '../types';

type GoalSelectionProps = {
  onSelect: (goal: GoalType, monocular: boolean, eye: 'left' | 'right', name: string) => void | Promise<void>;
};

const GOALS: Array<{ type: GoalType; icon: typeof Eye; label: string; tagline: string; details: string[] }> = [
  {
    type: 'myopia',
    icon: Eye,
    label: 'Myopia',
    tagline: 'See sharper at a distance',
    details: [
      'Trains fine-detail detection',
      'Flanker patterns filter visual noise',
      '30 sessions · ~25 min each',
    ],
  },
  {
    type: 'presbyopia',
    icon: Glasses,
    label: 'Presbyopia',
    tagline: 'Read clearly without squinting',
    details: [
      'Targets mid-range detail for reading',
      'Gentle pace, slower stimuli',
      '30 sessions · ~25 min each',
    ],
  },
  {
    type: 'sports-vision',
    icon: Zap,
    label: 'Sports Vision',
    tagline: 'React faster, see more',
    details: [
      'Full range, coarse to fine detail',
      'Fast flashes train reaction speed',
      '30 sessions · ~20 min each',
    ],
  },
];

export function GoalSelection({ onSelect }: GoalSelectionProps) {
  const [name, setName] = useState('');
  const [monocular, setMonocular] = useState(false);
  const [monocularEye, setMonocularEye] = useState<'left' | 'right'>('right');
  const [selectedGoal, setSelectedGoal] = useState<GoalType | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const handleSelect = async (type: GoalType) => {
    if (isPending) return;
    setIsPending(true);
    setSelectionError(null);
    try {
      await onSelect(type, monocular, monocularEye, name.trim() || 'Friend');
    } catch (err) {
      console.error('Failed to set goal', err);
      setSelectionError('Unable to save your program. Please try again.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <section className="goal-selection" aria-labelledby="goal-heading">
      <div className="goal-selection__bleed" aria-hidden="true" />
      <div className="goal-selection__wordmark">
        <Activity size={15} />
        <span>Vision Trainer</span>
      </div>
      <h1 id="goal-heading" className="goal-selection__heading">
        <span>Train your sight.</span>
        <strong>Measure the gain.</strong>
      </h1>
      <p className="goal-selection__subtitle">Start with a focused training program.</p>

      <input
        type="text"
        className="name-input glass-card"
        aria-label="First name"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isPending}
        autoFocus
      />

      <p className="goal-selection__section-label">Choose your focus</p>

      <div className="goal-cards">
        {GOALS.map(({ type, icon: Icon, label, tagline, details }) => (
          <button
            key={type}
            type="button"
            className={`goal-card ${selectedGoal === type ? 'goal-card--selected' : ''}`}
            onClick={() => setSelectedGoal(type)}
            aria-pressed={selectedGoal === type}
            disabled={isPending}
          >
            <Icon size={28} />
            <h3>{label}</h3>
            <p className="goal-card__tagline">{tagline}</p>
            <ul className="goal-card__details">
              {details.map((d) => <li key={d}>{d}</li>)}
            </ul>
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
          aria-label={monocular ? 'Disable monocular training' : 'Enable monocular training'}
          disabled={isPending}
        />
      </div>

      {selectionError && <p role="alert" className="form-error">{selectionError}</p>}

      {monocular && (
        <div className="eye-picker glass-card">
          <span className="eye-picker__label">Which eye is weaker?</span>
          <div className="eye-picker__buttons">
            <button
              type="button"
              className={`eye-picker__btn ${monocularEye === 'left' ? 'eye-picker__btn--active' : ''}`}
              onClick={() => setMonocularEye('left')}
              aria-pressed={monocularEye === 'left'}
              disabled={isPending}
            >
              Left Eye
            </button>
            <button
              type="button"
              className={`eye-picker__btn ${monocularEye === 'right' ? 'eye-picker__btn--active' : ''}`}
              onClick={() => setMonocularEye('right')}
              aria-pressed={monocularEye === 'right'}
              disabled={isPending}
            >
              Right Eye
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="start-btn goal-selection__cta wide"
        onClick={() => { if (selectedGoal) void handleSelect(selectedGoal); }}
        disabled={!selectedGoal || isPending}
      >
        {isPending ? 'Saving Program' : 'Continue'}
        <ArrowRight size={18} />
      </button>
    </section>
  );
}
