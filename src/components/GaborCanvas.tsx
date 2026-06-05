import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GaborRenderer, presentStimulus } from '../core/gaborRenderer';
import type { CalibrationProfile, GaborStimulus } from '../types';

export type GaborCanvasHandle = {
  present: (stimulus: GaborStimulus) => Promise<{ onset: number; offset: number }>;
  clear: () => void;
};

type GaborCanvasProps = {
  calibration: CalibrationProfile;
};

const now = () => (globalThis.performance?.now?.() ?? Date.now());

export const GaborCanvas = forwardRef<GaborCanvasHandle, GaborCanvasProps>(({ calibration }, ref) => {
  const rendererRef = useRef<GaborRenderer | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const calibrationRef = useRef(calibration);
  const [error, setError] = useState<string | null>(null);

  calibrationRef.current = calibration;

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    return () => {
      controller.abort();
      abortRef.current = null;
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    rendererRef.current?.clear(calibration);
  }, [calibration]);

  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    setError(null);
    rendererRef.current?.dispose();
    rendererRef.current = null;
    try {
      const renderer = new GaborRenderer(gl);
      renderer.resize(calibrationRef.current);
      rendererRef.current = renderer;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to initialize stimulus renderer');
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      present: async (stimulus) => {
        if (!rendererRef.current) {
          return { onset: now(), offset: now() };
        }
        return presentStimulus(rendererRef.current, stimulus, calibration, abortRef.current?.signal);
      },
      clear: () => rendererRef.current?.clear(calibration)
    }),
    [calibration]
  );

  return (
    <View style={styles.container}>
      <GLView style={styles.canvas} onContextCreate={onContextCreate} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

GaborCanvas.displayName = 'GaborCanvas';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#808080',
    flex: 1
  },
  canvas: {
    flex: 1
  },
  error: {
    color: '#FFFFFF',
    padding: 12
  }
});
