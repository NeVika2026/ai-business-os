export const VOICE_WELCOME_TEXT =
  'Привет, друг. Если ты уже здесь — значит, ты уже на шаг впереди. Сейчас не нужно разбираться в нейросетях, промптах и сложных инструментах. Просто скажи, какой результат хочешь получить для своего бизнеса сегодня. Остальное я помогу собрать.';

export const VOICE_WELCOME_BUTTON_LABEL = 'Включить приветствие';
export const VOICE_WELCOME_STOP_LABEL = 'Остановить';

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance !== 'undefined'
  );
}

export function stopWelcomeSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function speakWelcomeText(
  text: string,
  callbacks: {
    onEnd?: () => void;
    onError?: () => void;
  } = {},
): SpeechSynthesisUtterance | null {
  if (!isSpeechSynthesisSupported()) {
    return null;
  }

  stopWelcomeSpeech();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ru-RU';
  utterance.rate = 0.94;
  utterance.pitch = 1;

  if (callbacks.onEnd) {
    utterance.onend = callbacks.onEnd;
  }

  if (callbacks.onError) {
    utterance.onerror = callbacks.onError;
  }

  window.speechSynthesis.speak(utterance);

  return utterance;
}
