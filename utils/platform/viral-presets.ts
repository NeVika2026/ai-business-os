import {
  buildCreateStudioHref,
  type CreateStudioModeId,
} from '@/utils/platform/create-studio';

export type ViralPresetStatus = 'ready' | 'connector';

export type ViralPreset = {
  id: string;
  title: string;
  description: string;
  category: 'visual' | 'video' | 'ugc' | 'voice' | 'business';
  status: ViralPresetStatus;
  badge: string;
  mode?: CreateStudioModeId;
  goal?: string;
  format?: string;
  context?: string;
  href?: string;
};

export const VIRAL_PRESETS: ViralPreset[] = [
  {
    id: 'exploded-view',
    title: '/explodedview',
    description: 'Разобрать предмет на детали в премиальный exploded-view.',
    category: 'visual',
    status: 'ready',
    badge: 'VIRAL',
    mode: 'image',
    goal: 'Преобразуй исходный объект в премиальную exploded-view визуализацию: аккуратно разнеси реальные части по оси сборки, сохрани материалы, форму и узнаваемость предмета.',
    format: 'Вертикальный рекламный визуал 9:16, чистый фон, техническая эстетика.',
    context: 'Если добавлен референс, он является главным объектом. Без выдуманных логотипов и характеристик.',
  },
  {
    id: 'blueprint',
    title: '/blueprint',
    description: 'Технический чертёж предмета с чистой инженерной эстетикой.',
    category: 'visual',
    status: 'ready',
    badge: 'VIRAL',
    mode: 'image',
    goal: 'Сделай технический blueprint исходного объекта: ортографическая/изометрическая подача, тонкие линии, сетка, конструктивная логика, аккуратные выноски без выдуманных числовых характеристик.',
    format: 'Вертикальный 9:16, тёмно-синий blueprint или светлый инженерный лист.',
  },
  {
    id: 'cutaway',
    title: '/cutaway',
    description: 'Показать предмет в разрезе и раскрыть внутреннюю структуру.',
    category: 'visual',
    status: 'ready',
    badge: 'VIRAL',
    mode: 'image',
    goal: 'Создай cutaway-разрез исходного объекта: внешняя оболочка частично удалена, внутренние элементы видны аккуратно и правдоподобно, без выдуманных технических утверждений.',
    format: 'Премиальная техническая иллюстрация 9:16.',
  },
  {
    id: 'anatomy',
    title: '/anatomy',
    description: 'Разложить объект на понятные функциональные зоны.',
    category: 'visual',
    status: 'ready',
    badge: 'TREND',
    mode: 'image',
    goal: 'Сделай визуальную anatomy-схему исходного объекта: выдели основные визуально различимые части и покажи их как понятную инфографику.',
    format: 'Чистая редакционная инфографика, 9:16.',
  },
  {
    id: 'turnaround',
    title: '/360view',
    description: 'Показать продукт сразу с нескольких ракурсов.',
    category: 'visual',
    status: 'ready',
    badge: 'E-COM',
    mode: 'image',
    goal: 'Создай product turnaround: один и тот же объект показан с 4–6 согласованных ракурсов, одинаковые материалы, цвет и пропорции.',
    format: 'Каталожная сетка, premium product photography, 9:16.',
  },
  {
    id: 'packshot',
    title: '/packshot',
    description: 'Студийная карточка товара без дорогой фотосессии.',
    category: 'visual',
    status: 'ready',
    badge: 'E-COM',
    mode: 'image',
    goal: 'Сделай премиальный packshot исходного продукта: студийный свет, чистый фон, реалистичные материалы, точные края, мягкая естественная тень.',
    format: 'Коммерческая предметная фотография 4:5/9:16.',
  },
  {
    id: 'lifestyle',
    title: '/lifestyle',
    description: 'Поместить товар в естественную продающую сцену.',
    category: 'visual',
    status: 'ready',
    badge: 'ADS',
    mode: 'image',
    goal: 'Помести исходный продукт в реалистичную lifestyle-сцену его использования. Сохрани сам продукт узнаваемым и визуально неизменным.',
    format: 'Нативная рекламная фотография для Reels/Stories, 9:16.',
  },
  {
    id: 'interior',
    title: '/interiormakeover',
    description: 'Переделать интерьер в выбранном стиле.',
    category: 'visual',
    status: 'ready',
    badge: 'DESIGN',
    mode: 'image',
    goal: 'Сделай редизайн исходного интерьера, сохрани геометрию помещения, окна, двери и основные конструктивные элементы. Измени отделку, свет, мебель и декор.',
    format: 'Фотореалистичный интерьерный рендер.',
  },
  {
    id: 'fashion-campaign',
    title: '/fashioncampaign',
    description: 'Превратить фото одежды в рекламную fashion-кампанию.',
    category: 'visual',
    status: 'ready',
    badge: 'FASHION',
    mode: 'image',
    goal: 'Преобразуй исходный образ или вещь в премиальную fashion campaign: редакционный свет, сильная композиция, современная коммерческая стилизация.',
    format: 'Instagram fashion campaign, 4:5 или 9:16.',
  },
  {
    id: 'action-figure',
    title: 'Фигурка в упаковке',
    description: 'Вирусный collectible/action-figure формат.',
    category: 'visual',
    status: 'ready',
    badge: 'VIRAL',
    mode: 'image',
    goal: 'Создай из исходного персонажа коллекционную фигурку в премиальной blister-pack упаковке. Сохрани узнаваемые черты, добавь 3 тематических аксессуара без чужих брендов.',
    format: 'Фотореалистичная предметная съёмка игрушки в упаковке, 4:5.',
  },
  {
    id: 'retro-film',
    title: 'Ретро / плёнка',
    description: 'Намеренно живой, несовершенный плёночный образ.',
    category: 'visual',
    status: 'ready',
    badge: '2026',
    mode: 'image',
    goal: 'Преобразуй исходное фото в эмоциональный плёночный кадр: естественное зерно, лёгкие засветки, мягкая оптика, живые несовершенства без пластикового AI-вида.',
    format: 'Соцсети, 4:5.',
  },
  {
    id: 'product-video',
    title: 'Фото товара → ролик',
    description: 'Оживить один продуктовый кадр в рекламное видео.',
    category: 'video',
    status: 'ready',
    badge: 'HOT',
    mode: 'video',
    goal: 'Сделай короткий рекламный ролик из исходного продуктового кадра: плавное движение камеры, правдоподобная физика, сильный первый кадр, фокус на товаре.',
    format: 'Reels/Shorts 9:16, 5–10 секунд.',
    context: 'Используй референс-кадр как первый кадр. Не меняй форму, упаковку и ключевые детали товара.',
  },
  {
    id: 'cinematic-hook',
    title: 'Cinematic hook',
    description: 'Сильный 5–10 секундный кинематографичный хук.',
    category: 'video',
    status: 'ready',
    badge: 'REELS',
    mode: 'video',
    goal: 'Сделай кинематографичный vertical hook для Reels: одно яркое действие, выразительная камера, физически правдоподобное движение, визуальный сюрприз в первые 2 секунды.',
    format: '9:16, 5–10 секунд.',
  },
  {
    id: 'poster-to-video',
    title: 'Постер → видео',
    description: 'Оживить готовый баннер, афишу или дизайн.',
    category: 'video',
    status: 'ready',
    badge: 'MOTION',
    mode: 'video',
    goal: 'Оживи исходный постер или рекламный визуал: деликатный параллакс, движение света, деталей и камеры, сохрани композицию и основной объект.',
    format: '9:16, 5 секунд.',
  },
  {
    id: 'ugc-ad',
    title: 'AI UGC реклама',
    description: 'Фото человека + фото продукта → готовый creator-style рекламный ролик.',
    category: 'ugc',
    status: 'ready',
    badge: 'HOT',
    href: '/modules/create/ugc',
  },
  {
    id: 'talking-avatar',
    title: 'Говорящий аватар',
    description: 'Аватар с естественным lip-sync и мимикой.',
    category: 'ugc',
    status: 'connector',
    badge: 'NEXT',
    href: '/settings',
  },
  {
    id: 'multilingual-dub',
    title: 'Перевод видео + lip-sync',
    description: 'Один ролик на нескольких языках с сохранением подачи.',
    category: 'ugc',
    status: 'connector',
    badge: 'NEXT',
    href: '/settings',
  },
  {
    id: 'voiceover',
    title: 'Естественная озвучка',
    description: 'Готовая голосовая дорожка для ролика.',
    category: 'voice',
    status: 'ready',
    badge: 'VOICE',
    mode: 'voice',
    goal: 'Подготовь естественную живую озвучку без дикторского пафоса. Разговорная подача, правильные паузы, акцент на ключевых словах.',
    format: 'Русская озвучка для короткого вертикального видео.',
  },
  {
    id: 'voice-clone',
    title: 'Клон голоса',
    description: 'Собственный голос для массовой генерации контента.',
    category: 'voice',
    status: 'connector',
    badge: 'NEXT',
    href: '/settings',
  },
  {
    id: 'ai-caller',
    title: 'AI звонит клиенту',
    description: 'Голосовой агент ведёт настоящий телефонный разговор.',
    category: 'business',
    status: 'ready',
    badge: 'NEW',
    href: '/modules/voice-agent/studio',
  },
  {
    id: 'website',
    title: 'AI-сайт',
    description: 'Готовый HTML-лендинг с предпросмотром.',
    category: 'business',
    status: 'ready',
    badge: 'LIVE',
    mode: 'site',
    goal: 'Собери готовый современный лендинг под мой бизнес.',
    format: 'Адаптивный одностраничный сайт.',
  },
];

export const VIRAL_CATEGORY_LABELS = {
  visual: 'Вирусные визуалы',
  video: 'Видео и движение',
  ugc: 'UGC и аватары',
  voice: 'Голос',
  business: 'AI для бизнеса',
} as const;


const SHORTCUT_ALIASES: Record<string, string> = {
  '/explodedview': 'exploded-view',
  '/exploded': 'exploded-view',
  '/blueprint': 'blueprint',
  '/cutaway': 'cutaway',
  '/anatomy': 'anatomy',
  '/360view': 'turnaround',
  '/turnaround': 'turnaround',
  '/packshot': 'packshot',
  '/proshot': 'packshot',
  '/lifestyle': 'lifestyle',
  '/interiormakeover': 'interior',
  '/fashioncampaign': 'fashion-campaign',
  '/retrofilm': 'retro-film',
  '/actionfigure': 'action-figure',
  '/productvideo': 'product-video',
  '/cinematichook': 'cinematic-hook',
  '/ugc': 'ugc-ad',
  '/call': 'ai-caller',
};

export function getViralPresetByShortcut(input: string): ViralPreset | null {
  const normalized = input.trim().toLowerCase();
  const firstToken = normalized.split(/\s+/)[0] || '';
  const id = SHORTCUT_ALIASES[firstToken];
  return id ? VIRAL_PRESETS.find((item) => item.id === id) ?? null : null;
}

export function buildViralPresetHref(preset: ViralPreset, extraText = ''): string {
  if (preset.href) return preset.href;
  if (!preset.mode || !preset.goal) return '/modules/create/viral';

  const extra = extraText.trim();
  return buildCreateStudioHref(preset.mode, preset.goal, {
    format: preset.format,
    context: [preset.context, extra ? 'Дополнение пользователя: ' + extra : '']
      .filter(Boolean)
      .join('\n'),
  });
}
