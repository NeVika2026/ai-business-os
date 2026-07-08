import { OSA_WOW_PHRASES } from '@/utils/first-experience/osa-voice';

export const FIRST_RESULT_WOW_PHRASES = OSA_WOW_PHRASES;

export type FirstResultPresentation = {
  wowPhrase: string;
  summaryLines: string[];
  body: string;
};

function nonEmptyLines(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function pickFirstResultWowPhrase(content: string): string {
  const seed = nonEmptyLines(content).join('').length;
  return OSA_WOW_PHRASES[seed % OSA_WOW_PHRASES.length] ?? OSA_WOW_PHRASES[0];
}

export function buildFirstResultPresentation(content: string): FirstResultPresentation {
  const lines = nonEmptyLines(content);
  const summaryLines = lines.slice(0, 2);
  const bodyLines = lines.slice(2);

  return {
    wowPhrase: pickFirstResultWowPhrase(content),
    summaryLines,
    body: bodyLines.length > 0 ? bodyLines.join('\n') : '',
  };
}
