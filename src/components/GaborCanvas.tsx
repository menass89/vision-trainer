import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { CalibrationProfile, GaborStimulus } from '../types';
import { GaborRenderer, presentStimulus } from '../core/gaborRenderer';

export type GaborCanvasHandle = {
  present: (stimulus: GaborStimulus) => Promise<{ onset: number; offset: number }>;
  clear: () => void;
};

type GaborCanvasProps = {
  calibration: CalibrationProfile;
};

export const GaborCanvas = forwardRef<GaborCanvasHandle, GaborCanvasProps>(({ calibration }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<GaborRenderer | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    try {
      rendererRef.current = new GaborRenderer(canvas);
      rendererRef.current.clear(calibration);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to initialize stimulus renderer');
    }

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      rendererRef.current?.resize({ width: bounds.width, height: bounds.height });
      rendererRef.current?.clear(calibration);
    };
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener('resize', resize);
    return () => {
      controller.abort();
      abortRef.current = null;
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [calibration]);

  useImperativeHandle(
    ref,
    () => ({
      present: async (stimulus) => {
        if (!rendererRef.current) {
          return { onset: performance.now(), offset: performance.now() };
        }
        return presentStimulus(rendererRef.current, stimulus, calibration, abortRef.current?.signal);
      },
      clear: () => rendererRef.current?.clear(calibration)
    }),
    [calibration]
  );

  return (
    <div className="stimulus-frame">
      <canvas ref={canvasRef} className="stimulus-canvas" aria-label="Calibrated Gabor stimulus canvas" />
      {error ? <div className="stimulus-error">{error}</div> : null}
    </div>
  );
});

GaborCanvas.displayName = 'GaborCanvas';
