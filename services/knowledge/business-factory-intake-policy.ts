export type BusinessFactoryIntakeDecision = 'allow' | 'review' | 'block';

export type BusinessFactoryIntakeInput = {
  title: string;
  sourceUri?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
};

export type BusinessFactoryIntakeResult = {
  decision: BusinessFactoryIntakeDecision;
  reason: string;
  matchedRules: string[];
};

const BLOCK_RULES: Array<{ id: string; pattern: RegExp }> = [
  { id: 'credentials', pattern: /(логин|парол|password|credentials?|api[_ -]?key|secret|\.env)/i },
  { id: 'identity-passport', pattern: /(паспорт|passport)/i },
  { id: 'identity-snils', pattern: /(снилс|snils)/i },
  { id: 'medical', pattern: /(медицин|пациент|диагноз|medical|health record)/i },
  { id: 'payment-secrets', pattern: /(cvv|cvc|pin[-_ ]?код|номер карты|card number)/i },
];

const REVIEW_RULES: Array<{ id: string; pattern: RegExp }> = [
  { id: 'tax-id', pattern: /(^|[^а-яa-z])(инн|inn)([^а-яa-z]|$)/i },
  { id: 'legal-document', pattern: /(договор|соглашен|претенз|суд|опек|устав|legal)/i },
  { id: 'banking', pattern: /(банк|ипотек|кредит|реквизит|платеж|payment)/i },
  { id: 'insurance-policy', pattern: /(полис|страхов)/i },
  { id: 'personal-correspondence', pattern: /(переписк|личн.*чат|private chat)/i },
];

const SAFE_MIME_PREFIXES = ['text/', 'image/'];
const SAFE_MIME_TYPES = new Set([
  'application/pdf',
  'application/zip',
  'application/json',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.spreadsheet',
  'application/vnd.google-apps.presentation',
  'video/mp4',
  'audio/mpeg',
]);

const AUTO_SIZE_LIMIT = 200 * 1024 * 1024;

function searchableValue(input: BusinessFactoryIntakeInput): string {
  return [input.title, input.sourceUri ?? ''].join(' ');
}

export function evaluateBusinessFactoryIntake(
  input: BusinessFactoryIntakeInput,
): BusinessFactoryIntakeResult {
  const value = searchableValue(input).trim();

  if (!input.title?.trim()) {
    return {
      decision: 'review',
      reason: 'У источника нет понятного названия.',
      matchedRules: ['missing-title'],
    };
  }

  const blocked = BLOCK_RULES.filter((rule) => rule.pattern.test(value)).map((rule) => rule.id);
  if (blocked.length > 0) {
    return {
      decision: 'block',
      reason: 'Источник похож на личный или секретный документ и не должен индексироваться автоматически.',
      matchedRules: blocked,
    };
  }

  const review = REVIEW_RULES.filter((rule) => rule.pattern.test(value)).map((rule) => rule.id);

  if ((input.sizeBytes ?? 0) > AUTO_SIZE_LIMIT) {
    review.push('large-file');
  }

  const mimeType = input.mimeType?.trim().toLowerCase() ?? '';
  if (
    mimeType &&
    !SAFE_MIME_TYPES.has(mimeType) &&
    !SAFE_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix))
  ) {
    review.push('unknown-mime');
  }

  if (review.length > 0) {
    return {
      decision: 'review',
      reason: 'Источник можно использовать только после ручной проверки назначения и содержания.',
      matchedRules: [...new Set(review)],
    };
  }

  return {
    decision: 'allow',
    reason: 'Источник подходит для автоматического разбора по метаданным.',
    matchedRules: [],
  };
}

export function shouldAutoIngestBusinessFactorySource(
  input: BusinessFactoryIntakeInput,
): boolean {
  return evaluateBusinessFactoryIntake(input).decision === 'allow';
}
