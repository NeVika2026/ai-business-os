export type MiniAiKind = 'image' | 'video';

export const MINI_AI_PRICING = {
  image: {
    model: 'gen4_image',
    credits: 8,
    dollars: '0.08',
    description: '1 изображение Gen-4, 1080p',
  },
  video: {
    model: 'gen4.5',
    credits: 60,
    dollars: '0.60',
    description: '1 видео Gen-4.5, 5 секунд',
  },
} as const;

// This operator-reviewed quote must be rechecked before paid launch.
// https://docs.dev.runwayml.com/guides/pricing/
export const PRICING_REVIEW_VERSION = '2026-11-19';

export function isPaidAiConfigured(env: Record<string, string | undefined>) {
  return (
    env.BZA_RUNWAY_PAID_ENABLED === 'true' &&
    env.BZA_RUNWAY_PRICING_REVIEWED === PRICING_REVIEW_VERSION &&
    Boolean(env.RUNWAYML_API_SECRET?.trim()) &&
    Boolean(env.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&
    Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim())
  );
}

export function validatePaidAiStart(
  input: { kind: string; approved: boolean; quotedCredits: number; prompt: string },
  enabled: boolean,
) {
  if (!enabled) return 'Платная AI-генерация отключена владельцем платформы.';
  if (input.kind !== 'image' && input.kind !== 'video') return 'Неподдерживаемый тип генерации.';
  const price = MINI_AI_PRICING[input.kind];
  if (!input.approved) return 'Подтвердите стоимость перед запуском.';
  if (input.quotedCredits !== price.credits)
    return 'Тариф изменился. Обновите страницу и подтвердите сумму заново.';
  if (input.prompt.trim().length < 5 || input.prompt.trim().length > 700) {
    return 'Опишите результат от 5 до 700 символов.';
  }
  return null;
}
