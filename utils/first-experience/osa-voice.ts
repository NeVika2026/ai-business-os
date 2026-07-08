export const OSA_PROCESS_STEPS = [
  'Слушаю внимательно',
  'Смотрю на контекст',
  'Ищу суть',
  'Собираю первый ответ',
] as const;

export const OSA_WOW_PHRASES = [
  'Картина сложилась.',
  'Кажется, главный вектор найден.',
] as const;

export const OSA_VOICE = {
  welcome: {
    presence: 'Привет. Я OSA.',
    title: 'Можно просто начать разговор',
    subtitle: 'Я спокойно разберусь в задаче и предложу, с чего начать. Без регистрации и лишних шагов.',
    cta: 'Начать',
    note: 'Аккаунт понадобится только когда захотите сохранить результат.',
  },
  intro: {
    presence: 'Рада, что вы здесь.',
    title: 'Расскажите, чем помочь',
    subtitle: 'Опишите задачу своими словами — я подготовлю первый набросок. Регистрация не нужна.',
    placeholder: 'Например: как найти первых клиентов на новостройки',
    cta: 'Посмотреть, что получится',
    note: 'Обычно отвечаю за несколько секунд.',
    processing: 'Секунду…',
  },
  home: {
    presence: 'С возвращением.',
    greetingToday: 'Чем сегодня помочь?',
    title: 'Чем займёмся?',
    subtitle: 'Напишите, что вас волнует — я разберусь и предложу, с чего начать.',
    placeholder: 'Напишите здесь…',
    cta: 'Посмотреть, что получится',
    processing: 'Думаю…',
    overviewLink: 'Все дела',
  },
  result: {
    presence: 'Готово.',
    title: 'Вот что получилось',
    subtitle: 'Можно сохранить и вернуться к этому в любой момент.',
    keyInsight: 'Главное',
    details: 'Подробнее',
    autoContinueQuestion: 'Продолжить за меня?',
    autoContinueYes: 'Да',
    autoContinueNo: 'Пока нет',
    autoContinueLoading: 'Открываю…',
    saveCta: 'Сохранить и продолжить',
    tryAnotherCta: 'Попробовать другую задачу',
    signInFooter: 'Уже есть аккаунт?',
    signInLink: 'Войти',
    errorTitle: 'Не получилось',
    errorSubtitle: 'Давайте попробуем ещё раз — сформулируйте задачу чуть иначе.',
    retryCta: 'Попробовать снова',
  },
} as const;

export function buildHomeGreeting(organizationName?: string): {
  presence: string;
  eyebrow?: string;
} {
  if (!organizationName?.trim()) {
    return { presence: OSA_VOICE.home.presence };
  }

  return {
    presence: OSA_VOICE.home.presence,
    eyebrow: organizationName.trim(),
  };
}
