export type IntegrationStatus = 'connected' | 'missing' | 'built_in' | 'planned';

export type IntegrationCategory = 'infrastructure' | 'ai' | 'media' | 'publishing' | 'local';

export type IntegrationDefinition = {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  capabilities: string[];
  envKeys?: string[];
  builtIn?: boolean;
  planned?: boolean;
};

export type IntegrationStatusView = {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  capabilities: string[];
  status: IntegrationStatus;
};

export const INTEGRATION_CATALOG: IntegrationDefinition[] = [
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Авторизация, данные проектов и рабочее хранилище.',
    category: 'infrastructure',
    capabilities: ['Авторизация', 'База данных', 'Проекты'],
    envKeys: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
  },
  {
    id: 'brave-search',
    name: 'Brave Search',
    description: 'Актуальный веб-поиск для цехов «Найти» и «Проанализировать».',
    category: 'infrastructure',
    capabilities: ['Веб-поиск', 'Актуальные источники', 'Исследование'],
    envKeys: ['BRAVE_SEARCH_API_KEY'],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Текстовые задачи, анализ и AI-оркестрация.',
    category: 'ai',
    capabilities: ['Текст', 'Анализ', 'Планирование'],
    envKeys: ['OPENAI_API_KEY'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Текстовые и сложные аналитические задачи.',
    category: 'ai',
    capabilities: ['Текст', 'Анализ', 'Код'],
    envKeys: ['ANTHROPIC_API_KEY'],
  },
  {
    id: 'google-ai',
    name: 'Google AI',
    description: 'Мультимодальные и длинные контекстные задачи.',
    category: 'ai',
    capabilities: ['Текст', 'Мультимодальность', 'Длинный контекст'],
    envKeys: ['GOOGLE_AI_API_KEY'],
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Быстрые текстовые задачи через совместимые модели.',
    category: 'ai',
    capabilities: ['Текст', 'Быстрые ответы'],
    envKeys: ['GROQ_API_KEY'],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Маршрутизация к дополнительным AI-моделям.',
    category: 'ai',
    capabilities: ['Модели', 'Резервный маршрут'],
    envKeys: ['OPENROUTER_API_KEY'],
  },
  {
    id: 'fugu',
    name: 'Fugu',
    description: 'Дополнительный AI-провайдер платформы.',
    category: 'ai',
    capabilities: ['Текст', 'Резервный маршрут'],
    envKeys: ['FUGU_API_KEY'],
  },
  {
    id: 'ollama',
    name: 'Ollama',
    description: 'Локальные модели на компьютере или сервере.',
    category: 'local',
    capabilities: ['Локальный AI', 'Приватный режим'],
    envKeys: ['OLLAMA_BASE_URL'],
  },
  {
    id: 'heygen',
    name: 'HeyGen',
    description: 'Говорящие аватары, перевод видео и multilingual lip-sync.',
    category: 'media',
    capabilities: ['Аватары', 'Lip-sync', 'Перевод видео', 'Дубляж'],
    planned: true,
  },
  {
    id: 'higgsfield',
    name: 'Higgsfield',
    description: 'UGC-видео, выразительные аватары и lip-sync для коротких рекламных роликов.',
    category: 'media',
    capabilities: ['UGC', 'Lip-sync', 'Аватары'],
    planned: true,
  },
  {
    id: 'voicyfy',
    name: 'Voicyfy',
    description: 'Исходящие AI-звонки, расшифровка разговора и запись.',
    category: 'media',
    capabilities: ['Телефония', 'AI-звонки', 'Расшифровка', 'Запись'],
    envKeys: ['VOICYFY_ASSISTANT_ID'],
  },
  {
    id: 'runway',
    name: 'Runway',
    description: 'Генерация и обработка видеосцен.',
    category: 'media',
    capabilities: ['Видео', 'Сцены'],
    envKeys: ['RUNWAYML_API_SECRET'],
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'Озвучка и синтез естественной речи.',
    category: 'media',
    capabilities: ['Озвучка', 'Голос'],
    envKeys: ['ELEVENLABS_API_KEY'],
  },
  {
    id: 'remotion',
    name: 'Remotion',
    description: 'Сборка сцен, титров, субтитров и финального видео.',
    category: 'media',
    capabilities: ['Монтаж', 'Субтитры', 'Рендер'],
    builtIn: true,
  },
  {
    id: 'httpsms',
    name: 'httpSMS',
    description: 'Отправка и получение SMS через Android-телефон как SMS-шлюз.',
    category: 'publishing',
    capabilities: ['SMS', 'Android gateway', 'Webhooks'],
    envKeys: ['HTTPSMS_API_KEY', 'HTTPSMS_FROM_PHONE'],
  },
  {
    id: 'evolution-go',
    name: 'Evolution Go',
    description: 'WhatsApp API: текст, медиа, QR-подключение и события.',
    category: 'publishing',
    capabilities: ['WhatsApp', 'Текст', 'Медиа', 'Webhooks'],
    envKeys: ['EVOLUTION_GO_BASE_URL', 'EVOLUTION_GO_INSTANCE_TOKEN'],
  },
  {
    id: 'scout',
    name: 'Scout',
    description: 'Поиск профилей и обогащение лидов с email verification и lead score.',
    category: 'infrastructure',
    capabilities: ['Lead scraping', 'Email enrichment', 'Lead score', 'CSV'],
    envKeys: ['SCOUT_API_URL'],
  },
  {
    id: 'telegram-publish',
    name: 'Telegram',
    description: 'Публикация готовых материалов в канал или чат.',
    category: 'publishing',
    capabilities: ['Посты', 'Каналы', 'Прямая отправка'],
    envKeys: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'],
  },
  {
    id: 'vk-publish',
    name: 'ВКонтакте',
    description: 'Публикация текстовых постов на стену или в сообщество.',
    category: 'publishing',
    capabilities: ['Посты', 'Сообщество', 'Прямая отправка'],
    envKeys: ['VK_ACCESS_TOKEN', 'VK_OWNER_ID'],
  },
  {
    id: 'dzen-publish',
    name: 'Дзен',
    description: 'Передача подготовленных публикаций и материалов.',
    category: 'publishing',
    capabilities: ['Статьи', 'Посты', 'Видео'],
    planned: true,
  },
  {
    id: 'youtube-publish',
    name: 'YouTube',
    description: 'Прямая публикация видео и Shorts через Google OAuth.',
    category: 'publishing',
    capabilities: ['Видео', 'Shorts', 'Описание', 'Прямая отправка'],
    envKeys: [
      'GOOGLE_OAUTH_CLIENT_ID',
      'GOOGLE_OAUTH_CLIENT_SECRET',
      'YOUTUBE_REFRESH_TOKEN',
    ],
  },
  {
    id: 'tiktok-publish',
    name: 'TikTok',
    description: 'Публикация коротких видео после подключения аккаунта.',
    category: 'publishing',
    capabilities: ['Видео', 'Подпись'],
    planned: true,
  },
  {
    id: 'max-publish',
    name: 'MAX',
    description: 'Публикация адаптированных материалов в канал.',
    category: 'publishing',
    capabilities: ['Посты', 'Канал'],
    planned: true,
  },
];

export function resolveIntegrationStatuses(
  env: Record<string, string | undefined>,
): IntegrationStatusView[] {
  return INTEGRATION_CATALOG.map((integration) => {
    let status: IntegrationStatus = 'missing';

    if (integration.builtIn) {
      status = 'built_in';
    } else if (integration.planned) {
      status = 'planned';
    } else if (
      integration.envKeys?.length &&
      integration.envKeys.every((key) => Boolean(env[key]?.trim()))
    ) {
      status = 'connected';
    }

    return {
      id: integration.id,
      name: integration.name,
      description: integration.description,
      category: integration.category,
      capabilities: [...integration.capabilities],
      status,
    };
  });
}
