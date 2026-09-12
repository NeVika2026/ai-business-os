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
  {
    name: 'AI-маркетолог',
    role: 'Офферы, реклама, контент и продвижение',
    mark: 'M',
  },
  {
    name: 'AI-продажник',
    role: 'Скрипты, возражения и воронки',
    mark: 'S',
  },
  {
    name: 'AI-контентмейкер',
    role: 'Видео, сторис, посты и креативы',
    mark: 'C',
  },
  {
    name: 'AI-аналитик',
    role: 'Конкуренты, цифры и решения',
    mark: 'A',
  },
  {
    name: 'AI-юрист',
    role: 'Документы, риски и проверки',
    mark: 'L',
  },
  {
    name: 'AI-финансист',
    role: 'Модели, расчёты и экономика',
    mark: 'F',
  },
] as const;

const STORE_ITEMS = [
  {
    title: 'Навыки',
    description: 'Готовые рабочие способности для OSA',
    href: '/marketplace',
    mark: '✦',
  },
  {
    title: 'Интеграции',
    description: 'Подключённые сервисы и AI-движки',
    href: '/settings',
    mark: '⌘',
  },
  {
    title: 'Автоматизации',
    description: 'Цепочки, повторяющиеся задачи и триггеры',
    href: '/modules/automate',
    mark: '⚡',
  },
  {
    title: 'Медиа',
    description: 'Видео, изображения, голос и сборка',
    href: '/modules/create/studio',
    mark: '▶',
  },
] as const;

function taskHref(task: (typeof BUSINESS_ZAVOD_TASKS)[number]) {
  return task.href ?? `/home?prompt=${encodeURIComponent(task.prompt)}`;
}

export function BusinessZavodHomeExperience() {
  const scenarios = BUSINESS_ZAVOD_TASKS.filter((task) =>
    SCENARIO_IDS.includes(task.id as (typeof SCENARIO_IDS)[number]),
  );

  return (
    <div className="mx-auto mt-10 w-full max-w-[1120px] space-y-8 pb-10">
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--osa-home-purple)]/70">
              Возможности
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-[var(--osa-home-graphite)]">
              Что можно запустить
            </h2>
          </div>
          <Link
            href="/marketplace"
            className="text-sm font-medium text-[var(--osa-home-purple)]"
          >
            Открыть магазин →
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BUSINESS_ZAVOD_MODULES.map((module) => (
            <Link
              key={module.id}
              href={`/modules/${module.id}`}
              className="group rounded-[22px] border border-black/[0.06] bg-white/70 p-4 shadow-[0_18px_45px_-36px_rgba(63,56,110,.45)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(91,96,255,.12),rgba(195,91,255,.10))] text-lg text-[var(--osa-home-purple)]">
                {module.icon}
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[var(--osa-home-graphite)]">
                {module.label}
              </h3>
              <p className="mt-1 text-xs leading-5 text-black/50">
                {module.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[30px] border border-black/[0.06] bg-white/55 p-5 shadow-[0_22px_60px_-46px_rgba(71,64,117,.45)] backdrop-blur-md sm:p-6">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--osa-home-purple)]/70">
            В один клик
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[var(--osa-home-graphite)]">
            Готовые сценарии
          </h2>
          <p className="mt-1 text-sm text-black/45">
            Выбери основу — OSA сама разложит работу на этапы.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {scenarios.map((task, index) => (
            <Link
              key={task.id}
              href={taskHref(task)}
              className="group relative overflow-hidden rounded-[22px] border border-black/[0.06] bg-white p-4 transition hover:-translate-y-0.5"
            >
              <div
                aria-hidden="true"
                className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(112,119,255,.18),transparent_68%)] transition group-hover:scale-125"
              />
              <div className="relative">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/35">
                  0{index + 1}
                </span>
                <h3 className="mt-2 text-base font-semibold text-[var(--osa-home-graphite)]">
                  {task.title}
                </h3>
                <p className="mt-1 text-sm leading-5 text-black/50">
                  {task.description}
                </p>
                <span className="mt-4 inline-flex text-sm font-medium text-[var(--osa-home-purple)]">
                  Запустить →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-[30px] border border-black/[0.06] bg-white/60 p-5 backdrop-blur-md sm:p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--osa-home-purple)]/70">
                Специалисты
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[var(--osa-home-graphite)]">
                AI-команда
              </h2>
            </div>
            <Link href="/ai-employees" className="text-sm font-medium text-[var(--osa-home-purple)]">
              Все специалисты →
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {AI_TEAM.map((agent) => (
              <Link
                key={agent.name}
                href="/ai-employees"
                className="flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-white/80 p-3 transition hover:bg-white"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,#eef0ff,#f9edff)] text-sm font-bold text-[var(--osa-home-purple)]">
                  {agent.mark}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-[var(--osa-home-graphite)]">
                    {agent.name}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-black/45">
                    {agent.role}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-black/[0.06] bg-[linear-gradient(145deg,rgba(241,243,255,.88),rgba(255,247,253,.88))] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--osa-home-purple)]/70">
            Продолжение
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--osa-home-graphite)]">
            Продолжить работу
          </h2>
          <p className="mt-2 text-sm leading-6 text-black/50">
            Вернись к проектам, результатам и незавершённым задачам — контекст OSA сохранит.
          </p>

          <div className="mt-5 grid gap-3">
            <Link
              href="/projects"
              className="rounded-2xl border border-black/[0.06] bg-white/80 p-4 transition hover:bg-white"
            >
              <span className="text-sm font-semibold text-[var(--osa-home-graphite)]">
                Мои проекты
              </span>
              <span className="mt-1 block text-xs text-black/45">
                Все активные рабочие пространства
              </span>
            </Link>
            <Link
              href="/home/mission-control"
              className="rounded-2xl border border-black/[0.06] bg-white/80 p-4 transition hover:bg-white"
            >
              <span className="text-sm font-semibold text-[var(--osa-home-graphite)]">
                Все дела
              </span>
              <span className="mt-1 block text-xs text-black/45">
                Что в работе и что требует внимания
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--osa-home-purple)]/70">
            Расширения
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--osa-home-graphite)]">
            Магазин возможностей
          </h2>
          <p className="mt-1 text-sm text-black/45">
            Подключай новые способности платформы без перегрузки главной страницы.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STORE_ITEMS.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-[22px] border border-black/[0.06] bg-white/70 p-4 transition hover:-translate-y-0.5 hover:bg-white"
            >
              <span className="text-lg text-[var(--osa-home-purple)]" aria-hidden="true">
                {item.mark}
              </span>
              <h3 className="mt-3 text-sm font-semibold text-[var(--osa-home-graphite)]">
                {item.title}
              </h3>
              <p className="mt-1 text-xs leading-5 text-black/45">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
