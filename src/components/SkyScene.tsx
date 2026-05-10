import type { TimePhase } from '../types';

type SkySceneProps = {
  phase: TimePhase;
  className?: string;
};

export function SkyScene({ phase, className = '' }: SkySceneProps) {
  const skyGradient = {
    dawn: 'linear-gradient(180deg, #e8ddf0 0%, #f0d5c8 30%, #f5cca5 60%, #f0bc80 85%, #e8a860 100%)',
    afternoon: 'linear-gradient(180deg, #a8d8f0 0%, #b8e0f0 30%, #d8e8c0 60%, #f0d888 85%, #e8c860 100%)',
    night: 'linear-gradient(180deg, #0d1025 0%, #161445 40%, #1a1060 70%, #2a1878 100%)',
  }[phase];

  const mtnFills = {
    dawn: { far: 'rgba(232,200,168,0.35)', mid: 'rgba(245,230,215,0.65)', near: 'var(--scene-body)' },
    afternoon: { far: 'rgba(200,220,180,0.35)', mid: 'rgba(230,240,220,0.65)', near: 'var(--scene-body)' },
    night: { far: 'rgba(20,16,55,0.4)', mid: 'rgba(14,12,38,0.7)', near: 'var(--scene-body)' },
  }[phase];

  return (
    <div
      className={`sky-scene sky-scene--${phase} ${className}`}
      style={{ background: skyGradient }}
      aria-hidden="true"
    >
      {phase === 'night' && (
        <>
          <div className="star" style={{ top: '15%', left: '20%' }} />
          <div className="star" style={{ top: '30%', left: '55%', animationDelay: '0.7s' }} />
          <div className="star" style={{ top: '10%', left: '70%', animationDelay: '1.4s' }} />
          <div className="star" style={{ top: '40%', left: '35%', animationDelay: '0.4s' }} />
          <div className="star" style={{ top: '22%', left: '85%', animationDelay: '2.1s' }} />
          <div className="celestial moon" />
        </>
      )}
      {(phase === 'dawn' || phase === 'afternoon') && (
        <>
          <div className="cloud" style={{ top: '22%', left: '10%', width: 36 }} />
          <div className="cloud" style={{ top: '35%', left: '58%', width: 26, animationDelay: '2s' }} />
          <div className={`celestial sun sun--${phase}`} />
        </>
      )}
      <svg className="mtn-layer" style={{ zIndex: 1 }} viewBox="0 0 300 55" preserveAspectRatio="none">
        <path d="M0 55 L0 35 Q50 12 100 26 Q150 2 200 20 Q250 8 300 22 L300 55Z" fill={mtnFills.far} />
      </svg>
      <svg className="mtn-layer" style={{ zIndex: 2 }} viewBox="0 0 300 48" preserveAspectRatio="none">
        <path d="M0 48 L0 32 Q60 10 120 24 Q180 4 240 20 Q280 12 300 18 L300 48Z" fill={mtnFills.mid} />
      </svg>
      <svg className="mtn-layer" style={{ zIndex: 3 }} viewBox="0 0 300 40" preserveAspectRatio="none">
        <path d="M0 40 L0 28 Q50 8 100 20 Q150 0 200 16 Q250 6 300 14 L300 40Z" fill={mtnFills.near} />
      </svg>
    </div>
  );
}
