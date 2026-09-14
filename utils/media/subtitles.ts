export type SubtitleAlignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

type SubtitleCue = {
  start: number;
  end: number;
  text: string;
};

function formatSrtTime(seconds: number): string {
  const value = Math.max(0, seconds);
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const wholeSeconds = Math.floor(value % 60);
  const milliseconds = Math.round((value - Math.floor(value)) * 1000);

  return [hours, minutes, wholeSeconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':') + ',' + String(milliseconds).padStart(3, '0');
}

function buildCues(alignment: SubtitleAlignment, maxChars = 42): SubtitleCue[] {
  const length = Math.min(
    alignment.characters.length,
    alignment.character_start_times_seconds.length,
    alignment.character_end_times_seconds.length,
  );

  const cues: SubtitleCue[] = [];
  let startIndex = -1;
  let buffer = '';

  const flush = (endIndex: number) => {
    const text = buffer.trim();
    if (!text || startIndex < 0) {
      buffer = '';
      startIndex = -1;
      return;
    }

    cues.push({
      start: alignment.character_start_times_seconds[startIndex] ?? 0,
      end: alignment.character_end_times_seconds[endIndex] ?? 0,
      text,
    });
    buffer = '';
    startIndex = -1;
  };

  for (let index = 0; index < length; index += 1) {
    const char = alignment.characters[index] ?? '';

    if (startIndex < 0 && char.trim()) {
      startIndex = index;
    }

    buffer += char;

    const punctuationBreak = /[.!?]/.test(char) && buffer.trim().length >= 18;
    const lengthBreak =
      buffer.trim().length >= maxChars &&
      (char === ' ' || index === length - 1 || /[,;:!?]/.test(char));

    if (punctuationBreak || lengthBreak || index === length - 1) {
      flush(index);
    }
  }

  return cues;
}

export function buildSrtFromAlignment(
  alignment: SubtitleAlignment | null | undefined,
): string {
  if (!alignment) return '';

  return buildCues(alignment)
    .map(
      (cue, index) =>
        String(index + 1) +
        '\n' +
        formatSrtTime(cue.start) +
        ' --> ' +
        formatSrtTime(cue.end) +
        '\n' +
        cue.text,
    )
    .join('\n\n');
}
