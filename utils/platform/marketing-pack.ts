export const MARKETING_CHANNELS = [
  'VK',
  'Telegram',
  'WhatsApp',
  'Instagram',
  'YouTube',
  'Авито',
  'Сайт',
  'Reels',
] as const;

export type MarketingChannel = (typeof MARKETING_CHANNELS)[number];

export type MarketingPackBrief = {
  product: string;
  audience: string;
  channels: string[];
};

export function buildMarketingPackPrompt(input: MarketingPackBrief): string {
  const product = input.product.trim();
  const audience = input.audience.trim();
  const channels = input.channels.map((item) => item.trim()).filter(Boolean);

  return [
    'Создай полный маркетинговый комплект. Нужен готовый рабочий результат, а не общие рекомендации.',
    '',
    `Продукт / услуга: ${product}`,
    `Целевая аудитория: ${audience}`,
    `Каналы: ${channels.length > 0 ? channels.join(', ') : 'подбери сам'}`,
    '',
    'Собери единый комплект:',
    '1. Оффер: сильный заголовок, подзаголовок, почему актуально сейчас, 5 выгод и CTA.',
    '2. Анализ аудитории: 5 сегментов — горячие, сомневающиеся, откладывающие, сравнивающие и аудитория для прогрева.',
    '3. Контент-план на 7 дней: тема, цель, хук, структура и CTA каждого дня.',
    '4. 10 идей коротких роликов/Reels: хук первых 3 секунд, сцена, текст на экране и CTA.',
    '5. Минимум 5 рекламных объявлений, адаптированных под выбранные каналы.',
    '6. Полный скрипт продаж: первое сообщение, интерес, молчание, дорого, подумаю, закрытие на следующий шаг.',
    '7. Анализ конкурентов: как продают, где теряют внимание, как отстроиться, углы для контента и сильный месседж.',
    '',
    'Пиши живо, конкретно, без воды и канцелярщины. Все блоки должны быть готовы к использованию сегодня.',
  ].join('\n');
}
