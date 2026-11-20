import Link from 'next/link';

const moduleActions: Record<number, { proof: string; tiny: string; next: string }> = {
  1: { proof: 'У тебя уже есть рабочие запросы, критерии готовности и правила проверки.', tiny: 'Возьми одну задачу, напиши цель и критерий готовности. Остальное можно добавить потом.', next: 'Применить один запрос в реальной работе' },
  2: { proof: 'У тебя есть собственные истории, живые формулировки и экспертная позиция.', tiny: 'Возьми одну сохранённую фразу из голосового и допиши к ней три предложения.', next: 'Подготовить один короткий пост своим голосом' },
  3: { proof: 'Ты собрал темы, рубрики и систему подготовки публикаций.', tiny: 'Выбери одну тему из контент-банка и сделай первый абзац, не весь пост.', next: 'Опубликовать один проверенный материал' },
  4: { proof: 'Ты умеешь создавать визуалы по брифу и поддерживать единый стиль.', tiny: 'Выбери лучший из созданных вариантов и запиши одну конкретную правку.', next: 'Собрать одну готовую обложку' },
  5: { proof: 'Ты разобрал путь от идеи до короткого ролика.', tiny: 'Напиши первую фразу ролика и один кадр, который её покажет.', next: 'Довести один ролик до финального экспорта' },
  6: { proof: 'Ты описал задачу приложения и путь пользователя.', tiny: 'Оставь в MVP только одну функцию, без которой оно не имеет смысла.', next: 'Протестировать один пользовательский сценарий' },
  7: { proof: 'Ты научился отличать чат, workflow и агента и ставить границы.', tiny: 'Выбери одно повторяемое действие и опиши три шага без автоматизации.', next: 'Проверить один безопасный сценарий' },
  8: { proof: 'Ты видишь свою работу как систему с проверками и ограничениями.', tiny: 'Отметь один шаг процесса, который чаще всего отнимает время.', next: 'Улучшить один шаг и измерить эффект' },
  9: { proof: 'Ты собрал основу собственного цифрового продукта.', tiny: 'Напиши, кому он нужен и какую одну задачу решает.', next: 'Показать один рабочий образец пользователю' },
  10: { proof: 'Ты умеешь работать с брифом, стоимостью, границами и сдачей заказа.', tiny: 'Сформулируй одну услугу и один проверяемый результат для клиента.', next: 'Подготовить одно конкретное предложение' },
};

export function ModuleMomentum({
  moduleId,
  complete = false,
  completedLessons,
  totalLessons,
  practiceHref,
}: {
  moduleId: number;
  complete?: boolean;
  completedLessons?: number;
  totalLessons?: number;
  practiceHref?: string;
}) {
  const item = moduleActions[moduleId];
  if (!item) return null;
  const hasProgress = typeof completedLessons === 'number' && typeof totalLessons === 'number';
  return (
    <section aria-label={`Антипрокрастинация: завершение модуля ${moduleId}`} className="overflow-hidden rounded-[1.8rem] border border-[#d6b4f0] bg-[#241b35] p-6 text-white md:p-9">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffbc8e]">Финиш блока · действие важнее идеала</p>
      <h2 className="mt-3 text-2xl font-black leading-tight md:text-3xl">
        {complete ? 'Это не просто просмотр. У тебя есть результат.' : 'Не жди, пока появится настроение.'}
      </h2>
      <p className="mt-4 max-w-3xl leading-7 text-white/85">{complete ? item.proof : 'Не нужно доделывать всё за один вечер. Прокрастинация любит огромные задачи. Мы оставим ей всего пять минут.'}</p>
      {hasProgress && <p className="mt-3 text-sm font-bold text-[#ffd4ae]">Практика: {completedLessons} из {totalLessons} уроков. {complete ? 'Все задания и отзыв заполнены.' : 'Следующая маленькая попытка важнее идеального плана.'}</p>}
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-white/10 p-5">
          <p className="text-xs font-black uppercase tracking-wide text-[#ffbc8e]">Твой шаг на 5 минут</p>
          <p className="mt-3 text-sm leading-7">{item.tiny}</p>
        </div>
        <div className="rounded-2xl bg-white/10 p-5">
          <p className="text-xs font-black uppercase tracking-wide text-[#ffbc8e]">Применение вне курса</p>
          <p className="mt-3 text-sm leading-7">{item.next}. Не обязательно идеально — важно сделать и проверить.</p>
        </div>
      </div>
      <p className="mt-5 text-sm leading-7 text-white/75">Если сегодня трудно — сократи задачу, а не обесценивай уже сделанное. Можно продолжить завтра. Твой прогресс определяется работой, а не скоростью.</p>
      {practiceHref && <Link href={practiceHref} className="mt-6 inline-flex rounded-full bg-[#ff9e67] px-6 py-3 font-black text-[#251b2e] hover:bg-[#ffb58b]">Сделать один маленький шаг ↗</Link>}
    </section>
  );
}
