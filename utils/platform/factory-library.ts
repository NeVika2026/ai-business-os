import type { CreateStudioModeId } from '@/utils/platform/create-studio';

export type FactoryToolId =
  | 'video'
  | 'image'
  | 'stories'
  | 'voice'
  | 'site'
  | 'presentation'
  | 'document'
  | 'product-ad'
  | 'product-ugc'
  | 'product-campaign'
  | 'ad-localization'
  | 'multi-shot'
  | 'lip-sync'
  | 'upscale'
  | 'upscale-video'
  | 'remove-bg'
  | 'object-remove'
  | 'avatar'
  | 'motion'
  | 'music'
  | 'sfx'
  | 'video-edit'
  | 'video-expand';

export type FactoryTool = {
  id: FactoryToolId;
  title: string;
  description: string;
  status: 'live' | 'planned';
  mode?: CreateStudioModeId;
  href?: string;
  prompt?: string;
  mark: string;
};

export const FACTORY_TOOLS: FactoryTool[] = [
  { id:'video', title:'Видео', description:'Рекламные ролики, Reels, Shorts и сцены.', status:'live', mode:'video', mark:'▶' },
  { id:'image', title:'Изображения', description:'Баннеры, постеры, рекламные визуалы и референсы.', status:'live', mode:'image', mark:'◇' },
  { id:'stories', title:'Stories', description:'Серия сторис с хуком, визуалом и CTA.', status:'live', mode:'stories', mark:'▤' },
  { id:'voice', title:'Озвучка', description:'Голосовая дорожка под ролик, презентацию или рекламу.', status:'live', mode:'voice', mark:'◉' },
  { id:'site', title:'Сайт', description:'Готовый адаптивный лендинг под задачу.', status:'live', mode:'site', mark:'◈' },
  { id:'presentation', title:'Презентация', description:'Структура, тексты и готовая логика слайдов.', status:'live', mode:'presentation', mark:'▥' },
  { id:'document', title:'Документы', description:'Коммерческие предложения, инструкции и рабочие материалы.', status:'live', mode:'document', mark:'▱' },
  { id:'product-ad', title:'Товарный рекламный ролик', description:'Фото продукта → cinematic-реклама без съёмочной команды.', status:'live', href:'/modules/create/campaign?kind=product_ad', mark:'◆' },
  { id:'product-ugc', title:'UGC-реклама', description:'Персонаж + фото товара → живой UGC-ролик с продуктом в кадре.', status:'live', href:'/modules/create/campaign?kind=product_ugc', mark:'◎' },
  { id:'product-campaign', title:'Товарная кампания', description:'Фото продукта → серия рекламных campaign-визуалов.', status:'live', href:'/modules/create/campaign?kind=product_campaign', mark:'▦' },
  { id:'ad-localization', title:'Локализация рекламы', description:'Адаптация текста рекламного креатива под другой язык с сохранением макета.', status:'live', href:'/modules/create/campaign?kind=ad_localization', mark:'文' },
  { id:'multi-shot', title:'Multi-shot видео', description:'Несколько связанных сцен → один цельный рекламный ролик.', status:'live', href:'/modules/create/campaign?kind=multi_shot', mark:'≋' },
  { id:'lip-sync', title:'Липсинк', description:'Синхронизация губ с новой озвучкой.', status:'planned', mark:'◌' },
  { id:'upscale', title:'Upscale изображения', description:'Увеличить разрешение фото в 2×, 4×, 8× или 16×.', status:'live', href:'/modules/create/upscale?kind=image', mark:'↗' },
  { id:'upscale-video', title:'Upscale видео', description:'Поднять разрешение ролика до 720p, 1K, 2K или 4K.', status:'live', href:'/modules/create/upscale?kind=video', mark:'⇧' },
  { id:'remove-bg', title:'Удаление фона', description:'Очистить фон вокруг объекта и подготовить визуал под рекламу или карточку.', status:'live', href:'/modules/create/image-cleanup?mode=remove-bg', mark:'□' },
  { id:'object-remove', title:'Удаление объекта', description:'Убрать лишний предмет и естественно восстановить фон.', status:'live', href:'/modules/create/image-cleanup?mode=object-remove', mark:'⌫' },
  { id:'avatar', title:'AI-аватар', description:'Говорящий персонаж под сценарий и голос.', status:'planned', mark:'◎' },
  { id:'motion', title:'Копирование движения', description:'Перенос движения из референса в новый ролик.', status:'planned', mark:'≈' },
  { id:'music', title:'Музыка', description:'Фон, джингл, атмосферный bed или полноценный трек под кампанию и ролик.', status:'live', href:'/modules/create/music', mark:'♪' },
  { id:'sfx', title:'Звуковые эффекты', description:'Фоли, атмосферы, whoosh, удары и UI-звуки под сцену или ролик.', status:'live', href:'/modules/create/sound-effects', mark:'≋' },
  { id:'video-edit', title:'Редактирование видео', description:'Точечно изменить объект, цвет, фон, свет или стиль, сохранив остальной ролик.', status:'live', href:'/modules/create/video-edit?mode=edit', mark:'✎' },
  { id:'video-expand', title:'Расширить кадр видео', description:'Перевести ролик в 9:16, 16:9 или другой формат без обычного crop.', status:'live', href:'/modules/create/video-edit?mode=expand', mark:'↔' },
];

export type FactoryRecipe = {
  id: string;
  title: string;
  description: string;
  prompt: string;
  outputs: string[];
  mark: string;
};

export const FACTORY_RECIPES: FactoryRecipe[] = [
  {
    id:'real-estate-launch',
    title:'Запуск объекта недвижимости',
    description:'Reels + 5 Stories + баннер + пост + Telegram.',
    prompt:'Запусти рекламную кампанию объекта недвижимости: сделай Reels, 5 сторис, рекламный баннер, продающий пост и короткий текст для Telegram. Все материалы должны быть частью одной кампании и вести к заявке.',
    outputs:['Reels','5 Stories','Баннер','Пост','Telegram'],
    mark:'🏢',
  },
  {
    id:'service-launch',
    title:'Запуск услуги',
    description:'Оффер + визуал + короткий ролик + пост + сообщения.',
    prompt:'Собери полный запуск услуги: сильный оффер, рекламный визуал, короткий ролик, пост для соцсетей и короткое сообщение для клиента. Сохраняй одну идею и один CTA.',
    outputs:['Оффер','Визуал','Видео','Пост','Сообщение'],
    mark:'⚡',
  },
  {
    id:'seven-day-warmup',
    title:'Прогрев на 7 дней',
    description:'Контент-логика, Stories, посты и финальный CTA.',
    prompt:'Собери прогрев на 7 дней: тема каждого дня, пост, сторис и логика перехода к заявке. Не повторяй формулировки и усиливай интерес к финалу.',
    outputs:['7 дней','Посты','Stories','CTA'],
    mark:'🔥',
  },
  {
    id:'product-campaign',
    title:'Карточка товара + Reels + Stories',
    description:'Единая товарная кампания под соцсети.',
    prompt:'Собери товарную кампанию: главный рекламный визуал, короткий Reels, 5 сторис и текст карточки товара. Стиль и продукт должны быть одинаковыми во всех материалах.',
    outputs:['Визуал','Reels','5 Stories','Карточка'],
    mark:'◆',
  },
  {
    id:'expert-video',
    title:'Экспертный ролик',
    description:'Сценарий + визуальная подача + озвучка.',
    prompt:'Сделай экспертный короткий ролик: сильный хук, сценарий, визуальные сцены, текст озвучки и финальный CTA. Тон — уверенный, без канцелярщины.',
    outputs:['Хук','Сценарий','Видео','Озвучка'],
    mark:'🎙',
  },
  {
    id:'property-premium-video',
    title:'Премиальный ролик из фото квартиры',
    description:'Сценарий, последовательность кадров, музыка и CTA.',
    prompt:'Из фотографий квартиры собери премиальный рекламный ролик: продумай порядок кадров, короткие титры, музыку, ритм монтажа и финальный CTA. Не меняй реальные характеристики объекта.',
    outputs:['Сценарий','Видео','Титры','Музыка'],
    mark:'✦',
  },
];
