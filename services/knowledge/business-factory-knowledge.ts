export type BusinessFactoryKnowledgeCategory =
  | 'prompting'
  | 'content'
  | 'editing'
  | 'marketing'
  | 'brand'
  | 'audience'
  | 'sales'
  | 'funnel'
  | 'video';

export type BusinessFactoryFreshness = 'stable' | 'time-sensitive';

export type BusinessFactoryKnowledgeSource = {
  id: string;
  title: string;
  aliases: string[];
  freshness: BusinessFactoryFreshness;
  notes?: string;
};

export type BusinessFactoryKnowledgeMethod = {
  id: string;
  title: string;
  category: BusinessFactoryKnowledgeCategory;
  summary: string;
  whenToUse: string;
  agentIds: string[];
  tags: string[];
  keywords: string[];
  sourceIds: string[];
  guardrails?: string[];
};

export const BUSINESS_FACTORY_KNOWLEDGE_SOURCES: BusinessFactoryKnowledgeSource[] = [
  {
    id: 'nagornova-artur',
    title: 'Артур / Контент-план 100+ тем',
    aliases: ['Артур.pdf', 'Артур(1).pdf'],
    freshness: 'stable',
  },
  {
    id: 'llm-instruction-principles',
    title: 'Принципы хорошей инструкции для LLM',
    aliases: ['instruction-quality-principles.pdf', 'instruction_quality_principles.md'],
    freshness: 'stable',
  },
  {
    id: 'anti-llm-editor',
    title: 'STYLE__ANTI_LLM_CLICHE_EDITOR',
    aliases: ['STYLE__ANTI_LLM_CLICHE_EDITOR.md'],
    freshness: 'stable',
  },
  {
    id: 'viral-formats',
    title: '50 форматов удивительного SMM',
    aliases: ['50 форматов.pdf'],
    freshness: 'stable',
  },
  {
    id: 'subbotnik-2',
    title: 'Субботник №2 — 60 вирусных идей',
    aliases: ['СУББОТНИК.pdf'],
    freshness: 'stable',
  },
  {
    id: 'subbotnik-3',
    title: 'Субботник №3 — огонь-контент',
    aliases: ['Субботник №3.pdf'],
    freshness: 'stable',
  },
  {
    id: 'subbotnik-6',
    title: 'Субботник №6 — упаковка и вирусная воронка',
    aliases: ['Субботник №6.pdf'],
    freshness: 'stable',
  },
  {
    id: 'buyer-persona',
    title: 'Buyer Persona — пример глубокой сегментации',
    aliases: ['Байер персона биолокация.docx', 'Байер персона биолокация(1).docx'],
    freshness: 'stable',
    notes: 'Использовать как структурный пример анализа ЦА, а не как универсальные факты о других нишах.',
  },
  {
    id: 'sales-ai',
    title: 'Секретный код продаж: ИИ в продажах',
    aliases: ['Презентация Нагорнова Н..pdf'],
    freshness: 'stable',
  },
  {
    id: 'fourteen-days-funnel',
    title: '14 дней: блог → воронка → заявки',
    aliases: ['14days.md'],
    freshness: 'stable',
  },
  {
    id: 'mental-triggers',
    title: '31 ментальный триггер',
    aliases: ['31 триггер.pdf'],
    freshness: 'stable',
  },
  {
    id: 'sugarman-triggers',
    title: 'Triggers by Joe Sugarman',
    aliases: ['Triggers-by-Joe-Sugarman.pdf'],
    freshness: 'stable',
  },
  {
    id: 'veo3-template',
    title: 'VEO 3 — универсальный JSON-шаблон и инструкция',
    aliases: ['video_shablon.json', 'промпт - системный.txt'],
    freshness: 'stable',
  },
  {
    id: 'video-tools-2026',
    title: 'AI-видео: доступные сервисы и open-source модели',
    aliases: [
      'Бесплатная_генерация_видео_ИИ_что_осталось_после_закрытия_Sora.pdf',
      'Бесплатная_генерация_видео_ИИ_что_осталось_после_закрытия_Sora(1).pdf',
      'бесплатно_генерировать_фото_и_видео_.pdf',
      'бесплатно_генерировать_фото_и_видео_(1).pdf',
    ],
    freshness: 'time-sensitive',
    notes:
      'Лимиты, цены и доступность всегда перепроверять. Не использовать инструкции по обходу лимитов, созданию фиктивных платёжных данных или удалению чужих водяных знаков.',
  },
];

export const BUSINESS_FACTORY_KNOWLEDGE_METHODS: BusinessFactoryKnowledgeMethod[] = [
  {
    id: 'prompt-constructor-light',
    title: 'Промпт-конструктор LIGHT',
    category: 'prompting',
    summary:
      'Собирает задачу в проверяемую инструкцию: роль, цель, контекст, ЦА, формат, стиль, ограничения, структуру и ожидаемый эффект.',
    whenToUse:
      'Когда пользователь формулирует идею обычными словами, а OSA должна превратить её в точное ТЗ для ИИ-сотрудника или генератора.',
    agentIds: ['business-manager', 'knowledge-manager', 'content', 'marketing'],
    tags: ['промпт', 'инструкция', 'роль', 'контекст', 'формат', 'ограничения'],
    keywords: [
      'промпт',
      'prompt',
      'инструкция',
      'системный промпт',
      'настрой агента',
      'создай агента',
      'gpt',
      'llm',
    ],
    sourceIds: ['nagornova-artur', 'llm-instruction-principles'],
  },
  {
    id: 'human-marker',
    title: 'Маркер души',
    category: 'editing',
    summary:
      'Добавляет индивидуальный голос: внутренний диалог, сомнения, живой ритм, эмоции, самоиронию и разговорные детали без имитации канцелярского AI-стиля.',
    whenToUse:
      'Для постов, сторис, сценариев и писем, когда текст звучит стерильно, одинаково или слишком машинно.',
    agentIds: ['content', 'marketing'],
    tags: ['человеческий текст', 'гуманайзер', 'стиль', 'ритм', 'эмоции'],
    keywords: [
      'по-человечески',
      'человеческий текст',
      'живой текст',
      'гуманайзер',
      'как человек',
      'не как ии',
      'эмоции',
    ],
    sourceIds: ['nagornova-artur'],
  },
  {
    id: 'anti-llm-editor',
    title: 'Анти-LLM редактор',
    category: 'editing',
    summary:
      'Чистит шаблонные противопоставления, пустые усилители, одинаковый синтаксис и другие узнаваемые LLM-клише, сохраняя смысл и голос автора.',
    whenToUse:
      'Финальная редактура любого текста перед публикацией, особенно экспертного, рекламного и длинного.',
    agentIds: ['content', 'marketing', 'knowledge-manager'],
    tags: ['редактура', 'анти-клише', 'чистка текста', 'llm'],
    keywords: [
      'убери клише',
      'редактируй',
      'редактура',
      'машинный текст',
      'ии стиль',
      'шаблонный текст',
      'канцелярщина',
    ],
    sourceIds: ['anti-llm-editor'],
  },
  {
    id: 'berserk-hedgehog',
    title: 'Бешеный ёжик',
    category: 'content',
    summary:
      'Генерирует три эмоциональных режима одной темы: сдержанный, взрывной и пробивающий в сердце, сохраняя конкретику и ритм.',
    whenToUse:
      'Когда нужен эмоциональный контент с разными уровнями интенсивности и выбором подходящей подачи.',
    agentIds: ['content', 'marketing'],
    tags: ['эмоции', 'три версии', 'пост', 'сторис', 'тон'],
    keywords: [
      'бешеный ёжик',
      'эмоциональный пост',
      'эмоциональный текст',
      'три варианта',
      'дерзкий текст',
      'взрывной текст',
    ],
    sourceIds: ['nagornova-artur'],
  },
  {
    id: 'viral-format-engine',
    title: 'Двигатель вирусных форматов',
    category: 'content',
    summary:
      'Подбирает формат под задачу: ньюсджекинг, мем, короткий инсайт, карусель, прожарка, fake-product, комикс, шок-реклама, реалити и другие механики.',
    whenToUse:
      'Когда нужен контент-план, серия публикаций, идеи для сторис/Reels/Telegram или необычная подача обычной темы.',
    agentIds: ['content', 'marketing'],
    tags: ['вирусный контент', 'форматы', 'smm', 'сторис', 'reels', 'telegram'],
    keywords: [
      'контент-план',
      'идеи контента',
      'вирусный',
      'сторис',
      'stories',
      'reels',
      'рилс',
      'посты',
      'smm',
      'карусель',
      'мем',
    ],
    sourceIds: ['viral-formats', 'subbotnik-2', 'nagornova-artur'],
  },
  {
    id: 'reverse-storytelling',
    title: 'Обратный сторителлинг',
    category: 'content',
    summary:
      'Строит знакомое развитие истории, затем ломает ожидание неожиданным поворотом и завершает точным выводом или вызовом.',
    whenToUse:
      'Для экспертных историй, кейсов и коротких сценариев, которым не хватает удержания внимания.',
    agentIds: ['content', 'marketing'],
    tags: ['сторителлинг', 'поворот', 'история', 'хук'],
    keywords: [
      'сторителлинг',
      'история',
      'неожиданный поворот',
      'обратный сторителлинг',
      'сюжет',
      'хук',
    ],
    sourceIds: ['subbotnik-3', 'nagornova-artur'],
  },
  {
    id: 'product-29-wrappers',
    title: 'Голый шик и 29 фантиков',
    category: 'brand',
    summary:
      'Проверяет упаковку продукта слоями: сырьё, ЦА, инсайт, бренд, позиционирование, голос, оффер, линейка, доказательства, возражения, гарантии, контент, каналы и контроль качества.',
    whenToUse:
      'Когда продукт уже существует, но его сложно объяснить, запомнить, отличить от конкурентов или уверенно продавать.',
    agentIds: ['marketing', 'sales', 'content', 'business-manager'],
    tags: ['упаковка', 'позиционирование', 'оффер', 'бренд', 'продукт'],
    keywords: [
      'упаковать продукт',
      'упаковка',
      'позиционирование',
      'утп',
      'оффер',
      'бренд',
      'продуктовая линейка',
      'чем отличаемся',
    ],
    sourceIds: ['subbotnik-6'],
  },
  {
    id: 'audience-matryoshka',
    title: 'Матрешка ЦА',
    category: 'audience',
    summary:
      'Идёт от макросегментов к микросегментам, ищет пересечения, скрытые группы, потенциально активируемые аудитории и будущие сегменты.',
    whenToUse:
      'Для исследования ЦА, поиска новых ниш, гиперсегментации и подготовки разных офферов по сегментам.',
    agentIds: ['marketing', 'analyst', 'sales'],
    tags: ['целевая аудитория', 'сегментация', 'jtbd', 'микросегменты', 'исследование'],
    keywords: [
      'целевая аудитория',
      'ца',
      'сегментация',
      'сегменты',
      'портрет клиента',
      'аудитория',
      'кто покупатель',
      'гиперсегментация',
    ],
    sourceIds: ['subbotnik-6'],
  },
  {
    id: 'buyer-persona-deep-dive',
    title: 'Buyer Persona: боль → ценность → выгода',
    category: 'audience',
    summary:
      'Структурирует персону по ценностям, целям, проблемам, поведению, каналам, барьерам, вопросам перед покупкой и связке «боль → ценность → выгода».',
    whenToUse:
      'Когда нужны конкретные персонажи для офферов, рекламы, контента, интервью и проверки продуктовых гипотез.',
    agentIds: ['marketing', 'sales', 'analyst', 'content'],
    tags: ['buyer persona', 'боли', 'ценности', 'выгоды', 'барьеры'],
    keywords: [
      'buyer persona',
      'персона',
      'боли клиента',
      'ценности клиента',
      'выгоды',
      'барьеры',
      'портрет покупателя',
    ],
    sourceIds: ['buyer-persona'],
  },
  {
    id: 'sales-ai-system',
    title: 'ИИ-система продаж',
    category: 'sales',
    summary:
      'Покрывает цикл продаж: анализ ЦА, коммерческое предложение, воронка, техника продаж, скрипты, возражения, мотивация, контроль, обучение, анализ звонков и чат-боты.',
    whenToUse:
      'Для построения или усиления отдела продаж, подготовки скриптов, обучения менеджеров и CRM-сценариев.',
    agentIds: ['sales', 'crm', 'marketing', 'analyst'],
    tags: ['продажи', 'скрипты', 'воронка', 'возражения', 'crm', 'звонки'],
    keywords: [
      'продажи',
      'скрипт продаж',
      'возражения',
      'воронка продаж',
      'коммерческое предложение',
      'менеджер продаж',
      'анализ звонков',
      'crm',
    ],
    sourceIds: ['sales-ai'],
  },
  {
    id: 'fourteen-day-funnel',
    title: '14 дней: блог → воронка → заявки',
    category: 'funnel',
    summary:
      'Последовательно собирает сегмент, позиционирование, продуктовую лестницу, упаковку канала, лид-магнит, бот, контент, трафик, скрипт продаж, дожим и метрики.',
    whenToUse:
      'Когда блог или канал есть, но нет устойчивой цепочки от внимания до заявки и оплаты.',
    agentIds: ['marketing', 'sales', 'crm', 'content', 'analyst'],
    tags: ['воронка', 'telegram', 'лид-магнит', 'трафик', 'дожим', 'метрики'],
    keywords: [
      'нет заявок',
      'воронка',
      'лид-магнит',
      'телеграм канал',
      'telegram',
      'прогрев',
      'дожим',
      'трафик',
      'заявки',
    ],
    sourceIds: ['fourteen-days-funnel'],
  },
  {
    id: 'ethical-trigger-check',
    title: 'Триггеры продаж — с проверкой на честность',
    category: 'sales',
    summary:
      'Подбирает уместные психологические механики: история, авторитет, детали, гарантия, любопытство, предвкушение, простота, социальное доказательство и другие.',
    whenToUse:
      'Для лендингов, офферов, рекламы и скриптов, когда нужно усилить понятность и мотивацию без обмана.',
    agentIds: ['sales', 'marketing', 'content'],
    tags: ['триггеры', 'продажи', 'оффер', 'копирайтинг'],
    keywords: [
      'триггеры продаж',
      'триггер',
      'психология продаж',
      'усилить оффер',
      'продающий текст',
      'конверсия',
    ],
    sourceIds: ['mental-triggers', 'sugarman-triggers'],
    guardrails: [
      'Не создавать ложный дефицит, фальшивые гарантии, поддельный авторитет или вымышленные доказательства.',
    ],
  },
  {
    id: 'veo3-director',
    title: 'VEO 3 режиссёр',
    category: 'video',
    summary:
      'Разбивает идею на сцены и собирает техническое ТЗ: длительность, разрешение, стиль, план, движение камеры, локацию, свет, настроение, динамику, звук и развитие сцены.',
    whenToUse:
      'Для text-to-video и image-to-video задач, особенно когда нужно получить воспроизводимый структурированный промпт по сценам.',
    agentIds: ['content', 'marketing'],
    tags: ['veo', 'видео', 'json', 'сцена', 'камера', 'свет', 'звук'],
    keywords: [
      'veo',
      'сгенерировать видео',
      'видео',
      'ролик',
      'сцена',
      'камера',
      'image to video',
      'text to video',
      'json промпт',
    ],
    sourceIds: ['veo3-template'],
  },
  {
    id: 'video-provider-router',
    title: 'Роутер AI-видео сервисов',
    category: 'video',
    summary:
      'Выбирает класс инструмента по задаче: облачная генерация, open-source, аватарное видео, длинный AI-монтаж или русскоязычный сервис без VPN.',
    whenToUse:
      'Когда нужно подобрать способ генерации по качеству, длительности, наличию аудио, коммерческому использованию, VPN и бюджету.',
    agentIds: ['content', 'marketing', 'business-manager'],
    tags: ['видео', 'генераторы', 'open-source', 'без vpn', 'провайдер'],
    keywords: [
      'какой генератор видео',
      'генератор видео',
      'без vpn',
      'бесплатное видео',
      'kling',
      'runway',
      'seedance',
      'wan',
      'veo',
      'hailuo',
      'vidu',
    ],
    sourceIds: ['video-tools-2026'],
    guardrails: [
      'Перед рекомендацией перепроверять текущие цены, лимиты, лицензии и геодоступность.',
      'Не предлагать обход лимитов, фиктивные платёжные данные или удаление чужих водяных знаков.',
    ],
  },
];

const SOURCE_BY_ID = new Map(
  BUSINESS_FACTORY_KNOWLEDGE_SOURCES.map((source) => [source.id, source]),
);

export function getBusinessFactoryKnowledgeSource(
  sourceId: string,
): BusinessFactoryKnowledgeSource | undefined {
  return SOURCE_BY_ID.get(sourceId);
}

export function listBusinessFactoryKnowledgeSources(): BusinessFactoryKnowledgeSource[] {
  return BUSINESS_FACTORY_KNOWLEDGE_SOURCES.map((source) => ({
    ...source,
    aliases: [...source.aliases],
  }));
}

export function listBusinessFactoryKnowledgeMethods(): BusinessFactoryKnowledgeMethod[] {
  return BUSINESS_FACTORY_KNOWLEDGE_METHODS.map((method) => ({
    ...method,
    agentIds: [...method.agentIds],
    tags: [...method.tags],
    keywords: [...method.keywords],
    sourceIds: [...method.sourceIds],
    guardrails: method.guardrails ? [...method.guardrails] : undefined,
  }));
}

export function resolveBusinessFactorySourceId(fileName: string): string | null {
  const normalized = fileName.trim().toLocaleLowerCase('ru-RU');

  for (const source of BUSINESS_FACTORY_KNOWLEDGE_SOURCES) {
    if (
      source.title.toLocaleLowerCase('ru-RU') === normalized ||
      source.aliases.some((alias) => alias.toLocaleLowerCase('ru-RU') === normalized)
    ) {
      return source.id;
    }
  }

  return null;
}
