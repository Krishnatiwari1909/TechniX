/**
 * On-Device Native Speech Synthesis Utility
 * 100% client-side, zero cloud API dependency, offline capable.
 */

export const getBestNaturalVoice = (): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Priority list of premium natural-sounding voices across OS platforms (macOS/iOS, Chrome/Android, Windows)
  const preferredNames = [
    'Google UK English Female',
    'Google US English',
    'Samantha',
    'Karen',
    'Moira',
    'Tessa',
    'Victoria',
    'Daniel',
    'Microsoft Jenny Online (Natural) - English (United States)',
    'Microsoft Aria Online (Natural) - English (United States)',
    'Microsoft Guy Online (Natural) - English (United States)',
    'Microsoft Zira - English (United States)',
    'Microsoft David - English (United States)'
  ];

  for (const name of preferredNames) {
    const found = voices.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
    if (found) return found;
  }

  // Fallback 1: Any English voice with "Natural", "Neural", or "Premium" in name
  const naturalEnglish = voices.find(
    v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Premium'))
  );
  if (naturalEnglish) return naturalEnglish;

  // Fallback 2: Any Google English voice
  const googleEnglish = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'));
  if (googleEnglish) return googleEnglish;

  // Fallback 3: Any English voice
  const defaultEnglish = voices.find(v => v.lang.startsWith('en'));
  if (defaultEnglish) return defaultEnglish;

  return voices[0] || null;
};

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (e: any) => void;
}

export const speakNativeAlert = (text: string, options: SpeakOptions = {}): boolean => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis API is not supported on this device/browser');
    options.onError?.('Not supported');
    return false;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending or ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    const bestVoice = getBestNaturalVoice();

    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = bestVoice.lang || 'en-US';
    } else {
      utterance.lang = 'en-US';
    }

    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      options.onError?.(e);
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('SpeechSynthesis execution failed:', err);
    options.onError?.(err);
    return false;
  }
};

export const cancelNativeSpeech = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

