export type SpeechRecognitionWindowLike = {
  SpeechRecognition?: unknown;
  webkitSpeechRecognition?: unknown;
};

export function normalizeSpeechTranscript(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function appendSpeechTranscript(current: string, transcript: string): string {
  const left = normalizeSpeechTranscript(current);
  const right = normalizeSpeechTranscript(transcript);

  if (!left) return right;
  if (!right) return left;

  return `${left} ${right}`;
}

export function canUseSpeechRecognition(windowLike: SpeechRecognitionWindowLike): boolean {
  return Boolean(windowLike.SpeechRecognition || windowLike.webkitSpeechRecognition);
}
