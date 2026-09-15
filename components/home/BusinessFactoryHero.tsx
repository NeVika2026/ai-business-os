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

const nodes = [
  ['STRATEGY', '01'],
  ['MEDIA', '02'],
  ['SALES', '03'],
  ['DATA', '04'],
] as const;

function clampProgress(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
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
      : 'Реактор готов';
  const taskLabel = currentTask.trim();
  const showRuntime = thinking || Boolean(agentName) || Boolean(taskLabel);

  return (
    <section
      className={[styles.shell, active ? styles.active : '', thinking ? styles.thinking : '']
        .filter(Boolean)
        .join(' ')}
      aria-label="AI-реактор Бизнес-Завода"
    >
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.aurora} aria-hidden="true" />
      <div className={styles.flare} aria-hidden="true" />
      <div className={styles.scanline} aria-hidden="true" />

      <div className={styles.header}>
        <div>
          <small>BUSINESS ZAVOD · OSA CORE</small>
          <strong>AI Reactor</strong>
        </div>
        <span className={styles.live}><i /> {stateLabel}</span>
      </div>

      <div className={styles.scene}>
        <div className={styles.floor} aria-hidden="true" />

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
          {nodes.map(([label, number], index) => (
            <div key={label} className={[styles.node, styles['node' + (index + 1)]].join(' ')}>
              <span>{number}</span>
              <b>{label}</b>
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
              <b>{agentName ?? (thinking ? 'OSA собирает нужный цех' : 'Готово к запуску')}</b>
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
        <span>INPUT</span><i>→</i><span>OSA</span><i>→</i><span>FACTORY</span><i>→</i><span>RESULT</span>
      </div>
    </section>
  );
}
