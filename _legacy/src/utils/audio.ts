let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }
  audioContext ??= new AudioContextClass();
  return audioContext;
}

export function playCorrectTone(muted: boolean): void {
  if (muted) {
    return;
  }
  playTone(880, 0.1, 0.035, 0);
}

export function playLevelUpTone(muted: boolean): void {
  if (muted) {
    return;
  }
  [440, 660, 880].forEach((frequency, index) => playTone(frequency, 0.12, 0.04, index * 0.11));
}

function playTone(frequency: number, durationSeconds: number, volume: number, delaySeconds: number): void {
  const context = getAudioContext();
  if (!context) {
    return;
  }
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startAt = context.currentTime + delaySeconds;
  const stopAt = startAt + durationSeconds;
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(stopAt + 0.02);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
