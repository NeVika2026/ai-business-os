import Link from 'next/link';

export default function AcademyPage() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-7 px-4 py-8">
      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-7">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
          Один курс · Академия Бизнес-завода AI
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">ЁПТЕТЬ ДА НУ!</h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--text-secondary)]">
          Здесь собирается единый существующий курс. Открытый первый урок взят из оригинальных
          материалов. Остальные уроки добавляются только после сверки с подготовленными сценариями и
          видео.
        </p>
      </section>
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6">
        <p className="text-xs font-bold uppercase text-[var(--text-secondary)]">
          Первый бесплатный урок
        </p>
        <h2 className="mt-3 text-2xl font-black">Хватит смотреть на пустой пост. Сделаем свой</h2>
        <p className="mt-3 leading-7 text-[var(--text-secondary)]">
          В уроке показываем пример семейного фотографа, составляем запрос к ИИ, проверяем
          полученный пост, правим текст и сохраняем собственный результат.
        </p>
        <Link
          href="/kursy-nejrosetey/probnyj-urok"
          className="mt-5 inline-flex rounded-full bg-[var(--text-primary)] px-6 py-3 font-bold text-[var(--surface-0)]"
        >
          Открыть урок ↗
        </Link>
      </section>
      <p className="text-sm text-[var(--text-secondary)]">
        Полная программа ещё в подготовке. Здесь не создаются дополнительные курсы-дубли.
      </p>
    </main>
  );
}
