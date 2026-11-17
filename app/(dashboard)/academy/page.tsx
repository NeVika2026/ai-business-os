import Link from 'next/link';

const modules = [
  {
    title: 'Запросы к нейросетям',
    description: 'От постановки задачи до проверки ответа.',
  },
  {
    title: 'Тексты и контент',
    description: 'Посты, сценарии, структура материалов и редактура.',
  },
  {
    title: 'Изображения и видео',
    description: 'Визуальные задачи, референсы и контроль результата.',
  },
  {
    title: 'Маркетинг и продажи',
    description: 'Офферы, работа с клиентами и практические разборы.',
  },
  {
    title: 'Автоматизация',
    description: 'Связки сервисов, проверка ошибок и контроль расходов.',
  },
];

export default function AcademyPage() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8">
      <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-7">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
          Академия Бизнес-завода AI
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">ЁПТЕТЬ ДА НУ!</h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--text-secondary)]">
          Практический курс по нейросетям для работы и бизнеса. Учебные материалы готовятся. Эта
          страница показывает направления обучения, но не выдаёт их за уже открытые уроки.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/kursy-nejrosetey"
            className="rounded-full border border-[var(--border-subtle)] px-5 py-3 font-semibold"
          >
            Программа курса ↗
          </Link>
          <Link
            href="/gotovoe"
            className="rounded-full bg-[var(--text-primary)] px-5 py-3 font-semibold text-[var(--surface-0)]"
          >
            Бесплатный практикум ↗
          </Link>
        </div>
      </div>
      <section>
        <h2 className="text-2xl font-black">Направления курса</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {modules.map((module) => (
            <article
              key={module.title}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6"
            >
              <span className="text-xs font-bold uppercase text-[var(--text-secondary)]">
                Готовится
              </span>
              <h3 className="mt-3 text-xl font-bold">{module.title}</h3>
              <p className="mt-2 leading-6 text-[var(--text-secondary)]">{module.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
