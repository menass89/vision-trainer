import { CheckCircle2, CircleDashed } from 'lucide-react';

const modules = [
  ['Gabor Rendering Engine', 'active'],
  ['Task Paradigm Library', 'active'],
  ['Adaptive Staircase Controller', 'active'],
  ['Cross-Session Progression Planner', 'active'],
  ['Dichoptic Training Module', 'active'],
  ['Calibration & Display Profiling', 'active'],
  ['Progress Dashboard', 'active'],
  ['Gamification & Adherence Layer', 'active'],
  ['Local-First Data Store', 'active'],
  ['Clinician / Researcher Portal', 'planned'],
  ['Assessment & Outcome Module', 'active'],
  ['Platform Shell (PWA)', 'active']
] as const;

export function ModuleStatus() {
  return (
    <section className="panel module-panel" aria-labelledby="module-heading">
      <div className="section-heading compact">
        <CircleDashed size={20} />
        <h2 id="module-heading">12-Component Architecture</h2>
      </div>
      <div className="module-grid">
        {modules.map(([label, status]) => (
          <div key={label} className={`module-item ${status}`}>
            {status === 'planned' ? <CircleDashed size={16} /> : <CheckCircle2 size={16} />}
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
