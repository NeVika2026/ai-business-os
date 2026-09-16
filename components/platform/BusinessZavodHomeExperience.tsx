import Link from 'next/link';

import {
  BUSINESS_ZAVOD_MODULES,
  BUSINESS_ZAVOD_TASKS,
} from '@/utils/platform/business-zavod-config';

const SCENARIO_IDS = [
  'create-video',
  'create-stories',
  'marketing-pack',
  'find-clients',
  'analyze-competitors',
  'automate-leads',
] as const;

const AI_TEAM = [
  { name: 'AI-маркетолог', role: 'Офферы, реклама, контент и продвижение', mark: 'M' },
  { name: 'AI-продажник', role: 'Скрипты, возражения и воронки', mark: 'S' },
  { name: 'AI-контентмейкер', role: 'Видео, сторис, посты и креативы', mark: 'C' },
  { name: 'AI-аналитик', role: 'Конкуренты, цифры и решения', mark: 'A' },
  { name: 'AI-юрист', role: 'Документы, риски и проверки', mark: 'L' },
  { name: 'AI-финансист', role: 'Модели, расчёты и экономика', mark: 'F' },
] as const;

const STORE_ITEMS = [
  { title: 'Навыки', description: 'Готовые способности для OSA', href: '/marketplace', mark: '✦' },
  { title: 'Интеграции', description: 'Сервисы, AI-движки и коннекторы', href: '/settings', mark: '⌘' },
  { title: 'Автоматизации', description: 'Цепочки, триггеры и повторяющиеся задачи', href: '/modules/automate', mark: '⚡' },
  { title: 'Медиа', description: 'Видео, изображения, голос и сборка', href: '/modules/create/studio', mark: '▶' },
] as const;

function taskHref(task: (typeof BUSINESS_ZAVOD_TASKS)[number]) {
  return task.href ?? `/home?prompt=${encodeURIComponent(task.prompt)}`;
}

const cardClass =
  'group relative overflow-hidden rounded-[24px] border border-white/[0.11] bg-white/[0.045] p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#e7b952]/30 hover:bg-white/[0.055] hover:shadow-[0_24px_70px_-40px_rgba(231,185,82,.35)]';

export function BusinessZavodHomeExperience() {
  const scenarios = BUSINESS_ZAVOD_TASKS.filter((task) =>
    SCENARIO_IDS.includes(task.id as (typeof SCENARIO_IDS)[number]),
  );

  return (
    <div className="mx-auto mt-14 w-full max-w-[1160px] space-y-10 pb-16 text-[#f7f2e8]">
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-[0.22em] text-[#e7b952]">
              Цеха Бизнес-Завода
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#fff8e7] sm:text-4xl">
              Выберите направление — или просто поставьте задачу выше
            </h2>
          </div>
          <Link
            href="/marketplace"
            className="text-base font-semibold text-[#a9f2f7] transition hover:text-white"
          >
            Все возможности ↗
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BUSINESS_ZAVOD_MODULES.map((module, index) => (
            <Link
              key={module.id}
              href={`/modules/${module.id}`}
              className={cardClass}
            >
              <div
                aria-hidden="true"
                className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(231,185,82,.13),transparent_68%)] transition duration-300 group-hover:scale-125"
              />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e7b952]/20 bg-[#e7b952]/[0.08] text-xl text-[#f4d77f]">
                    {module.icon}
                  </div>
                  <span className="text-[10px] font-bold tracking-[0.16em] text-white/25">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[#fff8e7]">
                  {module.label}
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  {module.description}
                </p>
                <span className="mt-5 inline-flex text-sm font-semibold text-[#f2c963]">
                  Открыть цех →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018))] p-5 shadow-[0_28px_90px_-55px_rgba(0,0,0,.8)] backdrop-blur-2xl sm:p-7">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-[0.22em] text-[#58dbe8]">
              Готовые производственные линии
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#fff8e7]">
              Запуск в один клик
            </h2>
            <p className="mt-2 text-base leading-7 text-white/68">
              OSA сама разложит задачу на этапы и подключит нужных специалистов.
            </p>
          </div>
          <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-1.5 text-[12px] font-bold text-emerald-200/90">
            ● Оркестратор онлайн
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {scenarios.map((task, index) => (
            <Link
              key={task.id}
              href={taskHref(task)}
              className="group relative min-h-40 overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#070a10]/65 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#58dbe8]/25 hover:bg-[#0b1018]"
            >
              <div
                aria-hidden="true"
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(88,219,232,.14),transparent_68%)] transition duration-300 group-hover:scale-125"
              />
              <div className="relative">
                <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#58dbe8]/65">
                  LINE {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-[#fff8e7]">
                  {task.title}
                </h3>
                <p className="mt-2 text-base leading-7 text-white/68">
                  {task.description}
                </p>
                <span className="mt-4 inline-flex text-base font-semibold text-[#a9f2f7]">
                  Запустить →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.18fr_.82fr]">
        <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[12px] font-extrabold uppercase tracking-[0.22em] text-[#e7b952]">
                AI-сотрудники
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#fff8e7]">
                Команда уже на смене
              </h2>
            </div>
            <Link
              href="/ai-employees"
              className="text-base font-semibold text-[#a9f2f7] transition hover:text-white"
            >
              Все сотрудники ↗
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {AI_TEAM.map((agent) => (
              <Link
                key={agent.name}
                href="/ai-employees"
                className="group flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-black/15 p-3 transition hover:border-[#e7b952]/20 hover:bg-white/[0.035]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e7b952]/20 bg-[linear-gradient(145deg,rgba(231,185,82,.13),rgba(88,219,232,.08))] text-sm font-bold text-[#f4d77f]">
                  {agent.mark}
                </span>
                <span>
                  <span className="block text-base font-semibold text-[#fff8e7]">
                    {agent.name}
                  </span>
                  <span className="mt-0.5 block text-sm leading-6 text-white/65">
                    {agent.role}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-[#e7b952]/15 bg-[radial-gradient(circle_at_100%_0%,rgba(231,185,82,.12),transparent_42%),linear-gradient(145deg,rgba(231,185,82,.045),rgba(88,219,232,.025))] p-5 sm:p-6">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.22em] text-[#e7b952]">
            Mission Control
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#fff8e7]">
            Продолжить производство
          </h2>
          <p className="mt-3 text-base leading-7 text-white/68">
            Возвращайтесь к проектам и текущим задачам. OSA сохраняет рабочий контекст.
          </p>

          <div className="mt-6 grid gap-3">
            <Link
              href="/projects"
              className="rounded-2xl border border-white/[0.07] bg-black/20 p-4 transition hover:border-[#e7b952]/22 hover:bg-black/30"
            >
              <span className="text-base font-semibold text-[#fff8e7]">Мои проекты</span>
              <span className="mt-1 block text-sm text-white/62">Все активные рабочие пространства</span>
            </Link>
            <Link
              href="/home/mission-control"
              className="rounded-2xl border border-white/[0.07] bg-black/20 p-4 transition hover:border-[#58dbe8]/22 hover:bg-black/30"
            >
              <span className="text-base font-semibold text-[#fff8e7]">Все задачи</span>
              <span className="mt-1 block text-sm text-white/62">Что в работе и что требует внимания</span>
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.22em] text-[#58dbe8]">
            Расширение производства
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#fff8e7]">
            Добавляйте новые мощности
          </h2>
          <p className="mt-2 text-base leading-7 text-white/68">
            Навыки, интеграции, автоматизации и медиа подключаются без перегрузки главного экрана.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STORE_ITEMS.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={cardClass}
            >
              <span className="text-lg text-[#8fe8ef]" aria-hidden="true">
                {item.mark}
              </span>
              <h3 className="mt-4 text-base font-semibold text-[#fff8e7]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/65">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
