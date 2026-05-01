import { Gauge, Ruler, Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { CalibrationProfile } from '../types';
import { createBrowserCalibration, estimateRefreshRate, pixelsPerDegree } from '../core/displayCalibration';

type CalibrationPanelProps = {
  calibration: CalibrationProfile;
  onSave: (profile: CalibrationProfile) => Promise<void>;
};

type NumericCalibrationKey = 'viewingDistanceCm' | 'dpi' | 'gamma' | 'backgroundLuminanceCdM2';

export function CalibrationPanel({ calibration, onSave }: CalibrationPanelProps) {
  const [draft, setDraft] = useState(calibration);
  const [measuring, setMeasuring] = useState(false);
  const pxPerDeg = useMemo(() => pixelsPerDegree(draft), [draft]);

  const updateNumber = (key: NumericCalibrationKey, value: string) => {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      setDraft((current) => ({ ...current, [key]: parsed }));
    }
  };

  const measureRefresh = async () => {
    setMeasuring(true);
    const refreshRateHz = await estimateRefreshRate();
    setDraft((current) => ({ ...current, refreshRateHz }));
    setMeasuring(false);
  };

  return (
    <section className="panel calibration-panel" aria-labelledby="calibration-heading">
      <div className="section-heading">
        <Ruler size={20} />
        <div>
          <h2 id="calibration-heading">Display Calibration</h2>
          <span>Screen-to-vision profile</span>
        </div>
      </div>

      <div className="calibration-grid">
        <label>
          Viewing distance
          <span>
            <input
              type="number"
              min="30"
              max="120"
              value={draft.viewingDistanceCm}
              onChange={(event) => updateNumber('viewingDistanceCm', event.target.value)}
            />
            cm
          </span>
        </label>
        <label>
          Screen DPI
          <span>
            <input
              type="number"
              min="50"
              max="300"
              value={draft.dpi}
              onChange={(event) => updateNumber('dpi', event.target.value)}
            />
            dpi
          </span>
        </label>
        <label>
          Display response
          <span>
            <input
              type="number"
              min="1"
              max="3"
              step="0.1"
              value={draft.gamma}
              onChange={(event) => updateNumber('gamma', event.target.value)}
            />
          </span>
        </label>
        <label>
          Background luminance
          <span>
            <input
              type="number"
              min="5"
              max="120"
              value={draft.backgroundLuminanceCdM2}
              onChange={(event) => updateNumber('backgroundLuminanceCdM2', event.target.value)}
            />
            cd/m2
          </span>
        </label>
      </div>

      <div className="calibration-summary">
        <span>{pxPerDeg.toFixed(1)} px/degree</span>
        <span>{draft.refreshRateHz} Hz refresh</span>
        <span>{draft.screenWidthPx} x {draft.screenHeightPx}px screen</span>
      </div>

      <div className="button-row">
        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            setDraft(
              createBrowserCalibration({
                viewingDistanceCm: draft.viewingDistanceCm,
                dpi: draft.dpi,
                gamma: draft.gamma,
                backgroundLuminanceCdM2: draft.backgroundLuminanceCdM2
              })
            )
          }
        >
          <Gauge size={16} />
          Detect Screen
        </button>
        <button type="button" className="secondary-button" onClick={measureRefresh} disabled={measuring}>
          <Gauge size={16} />
          {measuring ? 'Measuring' : 'Measure Hz'}
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={() => onSave({ ...draft, id: `cal-${crypto.randomUUID()}`, createdAt: new Date().toISOString() })}
        >
          <Save size={16} />
          Save Profile
        </button>
      </div>
    </section>
  );
}
