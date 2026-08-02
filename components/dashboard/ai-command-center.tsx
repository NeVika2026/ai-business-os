'use client';

import type { ReactNode } from 'react';

const metrics = [
  {
    title: 'AI Navigator',
    value: '548',
    caption: 'сервисов в системе',
    detail: '+12 новых сегодня',
    tone: 'violet',
    icon: '✦',
  },
  {
    title: 'AI-агенты',
    value: '18',
    caption: 'агентов в команде',
    detail: '7 работают сейчас',
    tone: 'cyan',
    icon: '◉',
  },
  {
    title: 'Автоматизации',
    value: '42',
    caption: 'активных процесса',
    detail: '3 требуют внимания',
    tone: 'blue',
    icon: '⌁',
  },
  {
    title: 'Проекты',
    value: '7',
    caption: 'в работе',
    detail: '94% общий прогресс',
    tone: 'green',
    icon: '◇',
  },
] as const;

const activity = [
  { time: '12:03', title: 'Добавлен AI-сервис', detail: 'Cursor Agent' },
  { time: '11:54', title: 'Запущена автоматизация', detail: 'Telegram → CRM' },
  { time: '10:11', title: 'Новый клиент', detail: 'Заявка из каталога' },
] as const;

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18" fill="none">
      <path d="M4 10h11M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MetricCard({
  title,
  value,
  caption,
  detail,
  tone,
  icon,
}: (typeof metrics)[number]) {
  return (
    <article className="glass-panel glass-panel-interactive command-metric-card" data-tone={tone}>
      <div className="command-metric-topline">
        <span className="command-metric-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="command-card-link">
          Открыть <ArrowIcon />
        </span>
      </div>
      <div>
        <p className="command-eyebrow">{title}</p>
        <div className="command-metric-value">{value}</div>
        <p className="command-metric-caption">{caption}</p>
      </div>
      <div className="command-metric-detail">
        <span className="status-dot" />
        {detail}
      </div>
    </article>
  );
}

function QuickAction({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <button className="command-quick-action glass-panel-interactive" type="button">
      <span className="command-quick-icon" aria-hidden="true">
        {icon}
      </span>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <ArrowIcon />
    </button>
  );
}

export function AiCommandCenter() {
  return (
    <main className="premium-grid command-center-shell">
      <div className="ambient-orb command-orb-one" aria-hidden="true" />
      <div className="ambient-orb command-orb-two" aria-hidden="true" />

      <section className="command-center-content">
        <header className="command-topbar">
          <div>
            <p className="command-brand-kicker">БИЗНЕС-ЗАВОД</p>
            <h1>AI Command Center</h1>
          </div>
          <div className="command-system-status glass-panel">
            <span className="status-dot" />
            Все системы работают
          </div>
        </header>

        <section className="command-hero glass-panel">
          <div className="command-hero-copy">
            <p className="command-eyebrow">Операционная система бизнеса</p>
            <h2>
              Доброе утро, Виктория.
              <span> Бизнес работает стабильно.</span>
            </h2>
            <p>
              AI-команда контролирует процессы, находит новые инструменты и показывает, где требуется ваше решение.
            </p>
            <div className="command-hero-actions">
              <button className="liquid-button" type="button">
                Запустить AI
                <ArrowIcon />
              </button>
              <button className="command-secondary-button" type="button">
                Посмотреть рекомендации
              </button>
            </div>
          </div>

          <div className="command-health-orbit" aria-label="Готовность AI Navigator 98 процентов">
            <div className="command-health-ring">
              <div>
                <strong>98%</strong>
                <span>AI Navigator</span>
              </div>
            </div>
            <div className="command-orbit-chip command-orbit-chip-one">18 новых AI</div>
            <div className="command-orbit-chip command-orbit-chip-two">7 агентов онлайн</div>
            <div className="command-orbit-chip command-orbit-chip-three">42 сценария</div>
          </div>
        </section>

        <section className="command-metrics-grid" aria-label="Ключевые показатели">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </section>

        <section className="command-lower-grid">
          <div className="glass-panel command-assistant-panel">
            <div className="command-panel-heading">
              <div>
                <p className="command-eyebrow">AI-помощница</p>
                <h3>Что важно сегодня</h3>
              </div>
              <span className="command-live-badge"><span className="status-dot" />LIVE</span>
            </div>
            <p className="command-assistant-message">
              Найдено 23 новых AI-инструмента. Пять сервисов требуют проверки, а три автоматизации можно улучшить без дополнительных расходов.
            </p>
            <div className="command-quick-list">
              <QuickAction icon="✦" title="Проверить новые AI" description="23 рекомендации" />
              <QuickAction icon="⌁" title="Оптимизировать процессы" description="3 точки роста" />
              <QuickAction icon="◇" title="Открыть план дня" description="7 приоритетов" />
            </div>
          </div>

          <div className="glass-panel command-activity-panel">
            <div className="command-panel-heading">
              <div>
                <p className="command-eyebrow">Активность</p>
                <h3>Система в движении</h3>
              </div>
              <button className="command-text-button" type="button">Вся история</button>
            </div>
            <div className="command-activity-list">
              {activity.map((item) => (
                <div className="command-activity-row" key={`${item.time}-${item.title}`}>
                  <time>{item.time}</time>
                  <span className="command-activity-marker" aria-hidden="true" />
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
