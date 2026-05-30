import type { TimePhase } from '../types';
import { SkyScene } from './SkyScene';

type SceneHeaderProps = {
  phase: TimePhase;
  title: string;
};

export function SceneHeader({ phase, title }: SceneHeaderProps) {
  return (
    <header className="scene-header">
      <SkyScene phase={phase} />
      <h2 className="scene-header__title">{title}</h2>
    </header>
  );
}
