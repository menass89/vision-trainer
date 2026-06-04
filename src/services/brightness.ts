import * as Brightness from 'expo-brightness';
import { Platform } from 'react-native';

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export async function applyBrightness(value: number): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Brightness.setBrightnessAsync(clamp01(value));
  } catch {}
}

export async function getCurrentBrightness(): Promise<number | null> {
  if (Platform.OS === 'web') return null;
  try {
    return await Brightness.getBrightnessAsync();
  } catch {
    return null;
  }
}

export async function restoreSystemBrightness(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Brightness.restoreSystemBrightnessAsync();
  } catch {}
}
