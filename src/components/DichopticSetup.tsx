import { Glasses, Save } from 'lucide-react';
import type { DichopticSettings } from '../types';

type DichopticSetupProps = {
  settings: DichopticSettings;
  onChange: (settings: DichopticSettings) => Promise<void>;
};

export function DichopticSetup({ settings, onChange }: DichopticSetupProps) {
  const update = (patch: Partial<DichopticSettings>) => {
    void onChange({
      ...settings,
      ...patch,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="dichoptic-setup">
      <div className="section-heading compact">
        <Glasses size={18} />
        <div>
          <h2>Red-cyan glasses setup</h2>
          <span>Required for two-eye training</span>
        </div>
      </div>

      <div className="segmented-control">
        <button
          type="button"
          className={settings.dominantEye === 'left' ? 'selected' : ''}
          onClick={() => update({ dominantEye: 'left' })}
        >
          Left eye dominant
        </button>
        <button
          type="button"
          className={settings.dominantEye === 'right' ? 'selected' : ''}
          onClick={() => update({ dominantEye: 'right' })}
        >
          Right eye dominant
        </button>
      </div>

      <div className="anaglyph-check">
        <span className="red-patch">Red</span>
        <span className="cyan-patch">Cyan</span>
      </div>

      <div className="contrast-ratio">
        <label>
          Stronger-eye contrast
          <input
            type="range"
            min="50"
            max="90"
            value={Math.round(settings.dominantContrast * 100)}
            onChange={(event) => {
              const dominantContrast = Number(event.target.value) / 100;
              update({ dominantContrast, nonDominantContrast: 1 - dominantContrast });
            }}
          />
          <span>{Math.round(settings.dominantContrast * 100)}%</span>
        </label>
        <label>
          Weaker-eye contrast
          <span>{Math.round(settings.nonDominantContrast * 100)}%</span>
        </label>
      </div>

      <button
        type="button"
        className="primary-button wide"
        onClick={() => update({ setupCompleted: true })}
      >
        <Save size={16} />
        Setup Complete
      </button>
    </div>
  );
}
