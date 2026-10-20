/**
 * Audio Utility
 * Click and UI micro-interaction sounds are disabled for a clean desktop experience.
 */

export function playSound(
  _type?: 'click' | 'open' | 'correct' | 'wrong' | 'levelUp' | 'toggle' | 'flip' | 'bubble' | 'spark' | 'whoosh',
  _enabled = false
): void {
  // Intentionally silent: click sounds removed per user preference
}

/**
 * Speech synthesis helper for explicit element pronunciation
 */
export function speakText(text: string, enabled = true): void {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  } catch {
    // Speech synthesis gracefully degraded
  }
}


