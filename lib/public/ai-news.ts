export type AiNewsItem = {
  slug: string;
  date: string;
  category: string;
  icon: string;
  title: string;
  summary: string;
  application: string;
  sourceName: string;
  sourceUrl: string;
};

export const aiNewsItems: AiNewsItem[] = [
  {
    slug: 'gpt-6-2-astra-sol',
    date: '17.11.2026',
    category: 'МОДЕЛИ',
    icon: '✦',
    title: 'GPT-6.2 Astra и Sol: модели для сложных и повседневных задач',
    summary:
      'OpenAI представила Astra для сложных профессиональных проектов и Sol для повседневных задач. Компания заявляет об улучшении качества и эффективности.',
    application:
      'Попробуйте сравнить результат одного задания на презентацию или бизнес-документ. Доступность зависит от тарифа и настроек.',
    sourceName: 'OpenAI',
    sourceUrl: 'https://openai.com/index/introducing-gpt-6-2-astra-sol/',
  },
  {
    slug: 'chatgpt-for-sales',
    date: '17.11.2026',
    category: 'ПРОДАЖИ',
    icon: '↗',
    title: 'ChatGPT для продаж: от поиска клиента до следующего шага по сделке',
    summary:
      'OpenAI анонсировала ChatGPT for Sales со специализированными рабочими сценариями и интеграциями с CRM и инструментами продаж.',
    application:
      'Подготовьте бриф перед звонком, вопросы клиенту и черновик последующего письма. Подключение сторонних систем требует разрешений.',
    sourceName: 'OpenAI',
    sourceUrl: 'https://openai.com/index/introducing-chatgpt-for-sales/',
  },
  {
    slug: 'images-2-6',
    date: '04.11.2026',
    category: 'ВИЗУАЛ',
    icon: '◈',
    title: 'Images 2.6: редактирование изображений и анимированные GIF',
    summary:
      'OpenAI представила обновление генерации изображений: быстрее создавать визуалы, точнее вносить правки и делать GIF.',
    application:
      'Создайте варианты рекламного креатива, сохраните фирменные детали при исправлениях или анимируйте маскота для публикации.',
    sourceName: 'OpenAI',
    sourceUrl: 'https://openai.com/ru-RU/index/introducing-images-2-6/',
  },
];
