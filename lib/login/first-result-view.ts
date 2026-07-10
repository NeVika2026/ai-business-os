import { buildFirstResultFallbackPlan } from '@/lib/login/first-result-plan';

export type FirstResultSource = 'ai' | 'fallback';

export type LoginFirstResultView = {
  source: FirstResultSource;
  devNotice: string | null;
  headline: string;
  blocker: string | null;
  firstAction: string | null;
  plan: string[];
  nextStep: string | null;
};

export type LoginFirstResultInput = {
  task: string;
  content: string;
  usedFallback?: boolean;
  failureReason?: string | null;
};

const FALLBACK_OPENING = 'Начнём с простого.';

function nonEmptyLines(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function cleanTask(task: string): string {
  return task.replace(/^undefined/i, '').trim();
}

function extractNumberedItems(lines: string[]): string[] {
  return lines
    .filter((line) => /^\d+[\.\)]\s/.test(line))
    .map((line) => line.replace(/^\d+[\.\)]\s*/, '').trim());
}

export function isKnownFallbackContent(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith(FALLBACK_OPENING)) {
    return true;
  }

  return trimmed === buildFirstResultFallbackPlan('').trim() || trimmed.includes(FALLBACK_OPENING);
}

export function resolveFirstResultSource(input: LoginFirstResultInput): FirstResultSource {
  if (input.usedFallback === true) {
    return 'fallback';
  }

  if (input.usedFallback === false) {
    return 'ai';
  }

  return isKnownFallbackContent(input.content) ? 'fallback' : 'ai';
}

export function buildFirstResultDevNotice(source: FirstResultSource): string | null {
  if (source === 'ai') {
    return null;
  }

  return 'AI provider is not configured. Fallback result shown.';
}

function buildHeadlineFromTask(task: string): string {
  const cleaned = cleanTask(task);

  if (!cleaned) {
    return 'Нужно выбрать один первый шаг.';
  }

  return cleaned;
}

function parseFallbackView(task: string, content: string): LoginFirstResultView {
  const lines = nonEmptyLines(content);
  const numbered = extractNumberedItems(lines);
  const prose = lines.filter((line) => !/^\d+[\.\)]\s/.test(line));
  const blocker = prose.find((line) => line !== FALLBACK_OPENING) ?? null;
  const closing = prose.find((line) => /готовы|продолжите/i.test(line)) ?? null;

  return {
    source: 'fallback',
    devNotice: buildFirstResultDevNotice('fallback'),
    headline: buildHeadlineFromTask(task),
    blocker,
    firstAction: numbered[0] ?? null,
    plan: numbered.slice(1, -1),
    nextStep: numbered.at(-1) ?? closing,
  };
}

function parseAiView(task: string, content: string): LoginFirstResultView {
  const lines = nonEmptyLines(content);
  const numbered = extractNumberedItems(lines);
  const prose = lines.filter((line) => !/^\d+[\.\)]\s/.test(line));

  const headline = prose[0] ?? buildHeadlineFromTask(task);
  const blocker = prose[1] ?? null;
  const firstAction = numbered[0] ?? prose[2] ?? null;
  const plan = numbered.length > 1 ? numbered.slice(1, -1) : prose.slice(3);
  const nextStep =
    numbered.length > 0
      ? (numbered.at(-1) ?? prose.at(-1) ?? null)
      : (prose.at(-1) ?? null);

  return {
    source: 'ai',
    devNotice: null,
    headline,
    blocker: blocker && blocker !== headline ? blocker : null,
    firstAction: firstAction && firstAction !== headline ? firstAction : null,
    plan: plan.filter((line) => line !== firstAction && line !== nextStep),
    nextStep: nextStep && nextStep !== headline && nextStep !== firstAction ? nextStep : null,
  };
}

export function buildLoginFirstResultView(input: LoginFirstResultInput): LoginFirstResultView {
  const source = resolveFirstResultSource(input);
  const view = source === 'fallback' ? parseFallbackView(input.task, input.content) : parseAiView(input.task, input.content);

  return {
    ...view,
    source,
    devNotice: buildFirstResultDevNotice(source),
  };
}

export function buildDevSourceLabel(source: FirstResultSource): string {
  return source === 'ai' ? 'AI response' : 'Fallback';
}
