import Link from 'next/link';
import { ModuleMomentum } from '@/components/public/ModuleMomentum';
import { courseModules, courseDraftNote } from '@/lib/course/yoptet-program';

export function YoptetCourseProgram() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 md:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-[#261d32] px-6 py-9 text-white md:px-10 md:py-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ffc38f]">Программа курса · Нейробунт</p>
        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">От первой задачи до своей AI-системы</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-white/80">Десять модулей основной программы. Изучайте уроки по порядку, закрепляйте навык на собственной задаче и сохраняйте результат. Отдельный бесплатный мини-курс пока не запускается.</p>
        <div className="mt-7 flex flex-wrap gap-3 text-sm font-bold">
          <span className="rounded-full bg-white/15 px-4 py-2">10 модулей</span>
          <span className="rounded-full bg-white/15 px-4 py-2">77 уроков основной программы</span>
          <span className="rounded-full bg-white/15 px-4 py-2">59 шаблонов в исходных материалах</span>
        </div>
        <Link href="/kursy-nejrosetey/probnyj-urok" className="mt-8 inline-flex rounded-full bg-[#ff9147] px-6 py-3 font-black text-[#291721] hover:bg-[#ffae7a]">Посмотреть уже записанный урок ↗</Link>
      </section>
      <section aria-labelledby="course-modules" className="space-y-5">
        <h2 id="course-modules" className="text-2xl font-black md:text-3xl">Программа по модулям</h2>
        <p className="max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">Откройте любой модуль, чтобы посмотреть все названия уроков, цель, срок закрепления и возможное применение навыка. Это предварительный просмотр программы: карточки не заменяют готовые видеоуроки.</p>
        {courseModules.map((module) => (
          <details key={module.id} id={`module-${module.id}`} className="group overflow-hidden rounded-[1.5rem] border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-sm">
            <summary className="flex cursor-pointer list-none items-start gap-4 p-5 md:p-7 [&::-webkit-details-marker]:hidden">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#ffdfc7] text-lg font-black text-[#7b3810]">{module.id}</span>
              <span className="min-w-0 flex-1"><span className="block text-lg font-black md:text-xl">{module.title}</span><span className="mt-2 block text-sm text-[var(--text-secondary)]">{module.lessons.length} уроков · На закрепление ориентировочно {module.duration}</span></span>
              <span className="mt-2 text-2xl font-bold text-[#ad5b28] group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <div className="space-y-6 border-t border-[var(--border-subtle)] px-5 pb-7 pt-5 md:px-7">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-[#fff0e5] p-5 text-[#3e2830]"><h3 className="font-black">Зачем изучать и закреплять</h3><p className="mt-2 text-sm leading-7">{module.goal} Переходите дальше, когда можете выполнить основное задание самостоятельно.</p></div>
                <div className="rounded-2xl bg-[#ede9ff] p-5 text-[#2c254d]"><h3 className="font-black">Как применять и на чём можно заработать</h3><p className="mt-2 text-sm leading-7">{module.income} Это варианты услуг, а не гарантия заработка.</p></div>
              </div>
              <div className="rounded-2xl border border-[#edc5a6] bg-[#fff6ee] p-5"><h3 className="font-black">Рабочая тетрадь</h3><p className="mt-2 text-sm leading-7">{module.id === "1" || module.id === "2" ? "Заполняйте задания на сайте, проверяйте себя и сохраняйте результаты. Интерактивные тетради доступны для первых двух модулей." : "К модулям 3–10 подготовлена общая редактируемая тетрадь в Google Docs: упражнения со ссылкой на номер урока, промпты, самопроверка и обратная связь. Ответы в ней пока не сохраняются на платформе."}</p>{module.id === "1" || module.id === "2" ? <Link href={`/kursy-nejrosetey/tetrad-modul-${module.id}`} className="mt-4 inline-flex rounded-full bg-[#35243a] px-5 py-3 font-bold text-white">Открыть рабочую тетрадь ↗</Link> : <a href="https://docs.google.com/document/d/1dTsYJ7AXlLx2DZkbkMt7fIPtr6ndkaQgKGtKUQwWYO4/edit" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex rounded-full bg-[#35243a] px-5 py-3 font-bold text-white">Открыть тетрадь к модулям 3–10 ↗</a>}</div>
              <div className="rounded-2xl border border-[var(--border-subtle)] p-5"><h3 className="font-black">Сколько стоит практика</h3><p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">Начинайте с бесплатных лимитов подходящих сервисов. Подписку покупайте только при регулярной необходимости; цены и доступность проверяйте на официальных сайтах перед оплатой.</p></div>
              <div><h3 className="mb-4 text-lg font-black">Уроки модуля</h3><ol className="space-y-2">{module.lessons.map((lesson) => <li key={lesson.id} className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] px-4 py-3"><span className="min-w-12 font-bold text-[#b85f27]">{lesson.id}</span><span className="min-w-0 flex-1 text-sm leading-6">{lesson.id === "1.1" ? <Link href="/kursy-nejrosetey/urok-1-1" className="font-bold text-[#a04e22] underline underline-offset-4 hover:text-[#713219]">{lesson.title} ↗</Link> : lesson.title}</span><span className="shrink-0 text-xs text-[var(--text-secondary)]">{lesson.id === "1.1" ? "Открыть" : "В программе"}</span></li>)}</ol></div>
              <ModuleMomentum moduleId={Number(module.id)} practiceHref={module.id === "1" || module.id === "2" ? `/kursy-nejrosetey/tetrad-modul-${module.id}` : undefined} />
              <div className="rounded-2xl bg-[var(--surface-2)] p-5"><h3 className="font-black">Итог блока и обратная связь</h3><p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">Выполните практику, сохраните свою работу, ответьте «Что получилось?», «Чего не хватило?» и оставьте отзыв. Следующий модуль должен открываться после сохранения этих ответов. Серверное сохранение и блокировка ещё не подключены.</p></div>
            </div>
          </details>
        ))}
      </section>
      <p className="rounded-2xl border border-[var(--border-subtle)] p-5 text-sm leading-7 text-[var(--text-secondary)]">{courseDraftNote} Исходный учебный план также содержит пять вводных уроков, выпуск которых отложен.</p>
    </div>
  );
}
