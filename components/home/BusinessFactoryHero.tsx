'use client';

import styles from './BusinessFactoryHero.module.css';

type BusinessFactoryHeroProps = {
  active?: boolean;
  thinking?: boolean;
  currentTask?: string;
  agentName?: string | null;
  agentRole?: string | null;
  activity?: string | null;
  progress?: number | null;
};

type FactoryNode = {
  id: string;
  label: string;
  index: string;
  x: number;
  y: number;
  keywords: string[];
};

const nodes: FactoryNode[] = [
  { id: 'strategy', label: 'STRATEGY', index: '01', x: 18, y: 24, keywords: ['стратег', 'план', 'позиционир'] },
  { id: 'data', label: 'DATA', index: '02', x: 50, y: 11, keywords: ['данн', 'таблиц', 'аналит', 'расч'] },
  { id: 'research', label: 'RESEARCH', index: '03', x: 82, y: 23, keywords: ['рынок', 'конкур', 'исслед', 'анализ'] },
  { id: 'media', label: 'MEDIA', index: '04', x: 90, y: 53, keywords: ['видео', 'ролик', 'reels', 'рилс', 'картин', 'баннер', 'сторис', 'мульт', 'визуал'] },
  { id: 'voice', label: 'VOICE', index: '05', x: 72, y: 83, keywords: ['озвуч', 'голос', 'voice', 'аудио'] },
  { id: 'automation', label: 'AUTOMATE', index: '06', x: 50, y: 91, keywords: ['автомат', 'crm', 'воронк', 'интеграц', 'сценар'] },
  { id: 'sales', label: 'SALES', index: '07', x: 25, y: 82, keywords: ['продаж', 'лид', 'клиент', 'заявк'] },
  { id: 'web', label: 'WEB', index: '08', x: 9, y: 53, keywords: ['сайт', 'лендинг', 'прилож', 'web'] },
];

const floatingBadges = [
  { id: 'video', icon: '▶', label: 'ВИДЕО' },
  { id: 'visual', icon: '▧', label: 'ВИЗУАЛ' },
  { id: 'voice', icon: '◉', label: 'ГОЛОС' },
  { id: 'sales', icon: '₽', label: 'ПРОДАЖИ' },
  { id: 'data', icon: 'Σ', label: 'ДАННЫЕ' },
] as const;

const crossLinks: Array<[string, string]> = [
  ['strategy', 'data'],
  ['data', 'research'],
  ['research', 'media'],
  ['media', 'voice'],
  ['voice', 'automation'],
  ['automation', 'sales'],
  ['sales', 'web'],
  ['web', 'strategy'],
  ['strategy', 'sales'],
  ['data', 'automation'],
];

function clampProgress(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function nodeIsActive(node: FactoryNode, task: string, active: boolean, thinking: boolean) {
  if (!task) return false;
  const normalized = task.toLowerCase().replace(/ё/g, 'е');
  if (node.keywords.some((keyword) => normalized.includes(keyword))) return true;
  if ((active || thinking) && ['strategy', 'data'].includes(node.id)) return true;
  return false;
}

export function BusinessFactoryHero({
  active = false,
  thinking = false,
  currentTask = '',
  agentName = null,
  agentRole = null,
  activity = null,
  progress = null,
}: BusinessFactoryHeroProps) {
  const progressValue = clampProgress(progress);
  const stateLabel = thinking
    ? agentName ?? 'OSA работает'
    : active
      ? 'Задача принята'
      : 'Сеть готова';
  const taskLabel = currentTask.trim();
  const showRuntime = thinking || Boolean(agentName) || Boolean(taskLabel);
  const activeNodeIds = new Set(
    nodes.filter((node) => nodeIsActive(node, taskLabel, active, thinking)).map((node) => node.id),
  );

  const getNode = (id: string) => nodes.find((node) => node.id === id)!;

  return (
    <section
      className={[styles.shell, active ? styles.active : '', thinking ? styles.thinking : '']
        .filter(Boolean)
        .join(' ')}
      aria-label="Живая AI-сеть Бизнес-Завода"
    >
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.aurora} aria-hidden="true" />
      <div className={styles.flare} aria-hidden="true" />
      <div className={styles.scanline} aria-hidden="true" />

      <div className={styles.header}>
        <div>
          <small>BUSINESS ZAVOD · OSA NETWORK</small>
          <strong>Live Intelligence Map</strong>
        </div>
        <span className={styles.live}><i /> {stateLabel}</span>
      </div>

      <div className={styles.scene}>
        <div className={styles.floor} aria-hidden="true" />

        <svg className={styles.graph} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="bz-core-line" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(94,227,255,.08)" />
              <stop offset="45%" stopColor="rgba(94,227,255,.75)" />
              <stop offset="100%" stopColor="rgba(255,199,90,.62)" />
            </linearGradient>
            <filter id="bz-line-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.55" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {nodes.map((node) => {
            const nodeActive = activeNodeIds.has(node.id);
            return (
              <line
                key={'core-' + node.id}
                x1="50"
                y1="50"
                x2={node.x}
                y2={node.y}
                className={[styles.link, nodeActive ? styles.linkActive : ''].filter(Boolean).join(' ')}
                filter={nodeActive ? 'url(#bz-line-glow)' : undefined}
              />
            );
          })}

          {crossLinks.map(([a, b]) => {
            const from = getNode(a);
            const to = getNode(b);
            const linkActive = activeNodeIds.has(a) && activeNodeIds.has(b);
            return (
              <line
                key={a + '-' + b}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className={[styles.crossLink, linkActive ? styles.linkActive : ''].filter(Boolean).join(' ')}
              />
            );
          })}
        </svg>

        <div className={styles.reactor}>
          <div className={styles.ringOuter} aria-hidden="true"><i /><b /></div>
          <div className={styles.ringTiltA} aria-hidden="true" />
          <div className={styles.ringTiltB} aria-hidden="true" />
          <div className={styles.ringMid} aria-hidden="true" />
          <div className={styles.energyDisc} aria-hidden="true" />
          <div className={styles.coreSphere}>
            <div className={styles.coreGlass} />
            <div className={styles.coreHot} />
            <div className={styles.coreLabel}>
              <span>OSA</span>
              <b>CORE</b>
            </div>
          </div>
          <div className={styles.energyBeam} aria-hidden="true" />
        </div>

        <div className={styles.nodeField} aria-hidden="true">
          {nodes.map((node) => {
            const nodeActive = activeNodeIds.has(node.id);
            return (
              <div
                key={node.id}
                className={[styles.node, nodeActive ? styles.nodeActive : ''].filter(Boolean).join(' ')}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                <span>{node.index}</span>
                <b>{node.label}</b>
                <i />
              </div>
            );
          })}
        </div>

        <div className={styles.floatingBadges} aria-hidden="true">
          {floatingBadges.map((badge) => (
            <div
              key={badge.id}
              className={[styles.floatingBadge, styles[`badge_${badge.id}`]].join(' ')}
            >
              <span className={styles.badgeOrb}>{badge.icon}</span>
              <b>{badge.label}</b>
              <i />
            </div>
          ))}
        </div>

        <div className={styles.energyParticles} aria-hidden="true">
          {Array.from({ length: 18 }).map((_, index) => <i key={index} />)}
        </div>
      </div>

      {showRuntime ? (
        <div className={styles.runtime} aria-live="polite">
          <div className={styles.runtimeTop}>
            <span>
              <small>{thinking ? 'ПРОИЗВОДСТВО ИДЁТ' : 'ЗАДАЧА ПРИНЯТА'}</small>
              <b>{agentName ?? (thinking ? 'OSA строит рабочий маршрут' : 'Готово к запуску')}</b>
            </span>
            {thinking ? <strong>{progressValue}%</strong> : null}
          </div>

          {agentRole || activity ? (
            <p>{activity ?? agentRole}</p>
          ) : taskLabel ? (
            <p>{taskLabel}</p>
          ) : null}

          {thinking ? (
            <div className={styles.progressTrack} aria-label={`Прогресс: ${progressValue}%`}>
              <i style={{ width: `${progressValue}%` }} />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={styles.footer}>
        <span>INPUT</span><i>→</i><span>OSA</span><i>→</i><span>LIVE GRAPH</span><i>→</i><span>RESULT</span>
      </div>
    </section>
  );
}
