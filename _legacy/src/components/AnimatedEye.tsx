import { useId } from 'react';
import type { TimePhase } from '../types';

type AnimatedEyeProps = {
  phase: TimePhase;
};

export function AnimatedEye({ phase }: AnimatedEyeProps) {
  const instanceId = useId().replace(/:/g, '');
  const sclera = phase === 'night' ? '#4a4268' : '#f0ecf4';
  const lidStroke = phase === 'night' ? 'rgba(180,175,210,0.22)' : 'rgba(60,50,80,0.2)';
  const lidStrokeLower = phase === 'night' ? 'rgba(180,175,210,0.1)' : 'rgba(60,50,80,0.1)';
  const creaseStroke = phase === 'night' ? 'rgba(180,175,210,0.06)' : 'rgba(60,50,80,0.05)';
  const limbalStroke = phase === 'night' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.18)';
  const reflectionOpacity = phase === 'night' ? 0.5 : 0.7;
  const clipId = `eye-clip-${phase}-${instanceId}`;
  const irisDepthId = `iris-depth-${phase}-${instanceId}`;

  const openPath = 'M4,35 C20,12 45,3 80,3 C115,3 140,12 156,35 C140,58 115,67 80,67 C45,67 20,58 4,35 Z';
  const closedPath = 'M4,35 C20,34 45,33.5 80,33.5 C115,33.5 140,34 156,35 C140,36 115,36.5 80,36.5 C45,36.5 20,36 4,35 Z';
  const blinkValues = `${openPath};${openPath};${closedPath};${openPath};${openPath}`;
  const blinkTimes = '0; 0.87; 0.91; 0.95; 1';
  const blinkSplines = '0.4 0 0.2 1; 0.25 0 0.25 1; 0.25 0 0.25 1; 0.4 0 0.2 1';

  const openUpper = 'M4,35 C20,12 45,3 80,3 C115,3 140,12 156,35';
  const closedUpper = 'M4,35 C20,34 45,33.5 80,33.5 C115,33.5 140,34 156,35';
  const upperValues = `${openUpper};${openUpper};${closedUpper};${openUpper};${openUpper}`;

  const openLower = 'M156,35 C140,58 115,67 80,67 C45,67 20,58 4,35';
  const closedLower = 'M156,35 C140,36 115,36.5 80,36.5 C45,36.5 20,36 4,35';
  const lowerValues = `${openLower};${openLower};${closedLower};${openLower};${openLower}`;

  const openCrease = 'M10,33 C25,9 48,0 80,0 C112,0 135,9 150,33';
  const closedCrease = 'M10,34 C25,31 48,30 80,30 C112,30 135,31 150,34';
  const creaseValues = `${openCrease};${openCrease};${closedCrease};${openCrease};${openCrease}`;

  return (
    <div className="eye-wrap" aria-hidden="true">
      <div className={`eye-glow eye-glow--${phase}`} />
      <svg className="eye-svg" viewBox="0 0 160 70">
        <defs>
          <clipPath id={clipId}>
            <path>
              <animate
                attributeName="d" dur="4s" repeatCount="indefinite"
                keyTimes={blinkTimes} keySplines={blinkSplines}
                calcMode="spline" values={blinkValues}
              />
            </path>
          </clipPath>
          <radialGradient id={irisDepthId} cx="42%" cy="38%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="45%" stopColor="transparent" />
            <stop offset="80%" stopColor="rgba(0,0,0,0.1)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.28)" />
          </radialGradient>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          <ellipse cx={80} cy={35} rx={78} ry={34} fill={sclera} />
          <circle cx={80} cy={35} r={33}>
            <animate
              attributeName="fill" dur="20s" repeatCount="indefinite"
              calcMode="discrete"
              keyTimes="0; 0.184; 0.384; 0.584; 0.784"
              values="#4a80c0; #4a9848; #b08830; #7858a8; #389080"
            />
          </circle>
          <circle cx={80} cy={35} r={33} fill={`url(#${irisDepthId})`} />
          <circle cx={80} cy={35} r={33} fill="none" stroke={limbalStroke} strokeWidth={1.2} />
          <circle cx={80} cy={35} r={12} fill="#030308" />
          <ellipse cx={72} cy={28} rx={5} ry={4} fill={`rgba(255,255,255,${reflectionOpacity})`} transform="rotate(-12 72 28)" />
          <circle cx={89} cy={43} r={2} fill="rgba(255,255,255,0.14)" />
        </g>

        {/* Upper lid contour */}
        <path fill="none" stroke={lidStroke} strokeWidth={1.2} strokeLinecap="round">
          <animate attributeName="d" dur="4s" repeatCount="indefinite" keyTimes={blinkTimes} keySplines={blinkSplines} calcMode="spline" values={upperValues} />
        </path>
        {/* Lower lid contour */}
        <path fill="none" stroke={lidStrokeLower} strokeWidth={0.8} strokeLinecap="round">
          <animate attributeName="d" dur="4s" repeatCount="indefinite" keyTimes={blinkTimes} keySplines={blinkSplines} calcMode="spline" values={lowerValues} />
        </path>
        {/* Crease */}
        <path fill="none" stroke={creaseStroke} strokeWidth={0.6} strokeLinecap="round">
          <animate attributeName="d" dur="4s" repeatCount="indefinite" keyTimes={blinkTimes} keySplines={blinkSplines} calcMode="spline" values={creaseValues} />
        </path>
      </svg>
    </div>
  );
}
