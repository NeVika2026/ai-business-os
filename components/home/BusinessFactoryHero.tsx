'use client';

import Link from 'next/link';

import styles from './BusinessFactoryHero.module.css';

const CHAPLIN_CLIP_START = 4;
const CHAPLIN_CLIP_END = 12;
const CHAPLIN_WEBM_URL = '/api/media/chaplin';
const VISUAL_PORTRAIT_URL =
  'https://upload.wikimedia.org/wikipedia/commons/1/18/African_American_woman%2C_studio_portrait.jpg';
const VISUAL_INTERIOR_URL =
  'https://upload.wikimedia.org/wikipedia/commons/4/48/Interior_view_of_tearoom_in_Chinatown%2C_New_York_City%2C_N.Y._LCCN2003668345.jpg';
const VISUAL_PRODUCT_URL =
  'https://upload.wikimedia.org/wikipedia/commons/7/7a/Apache-still-life_restored.jpg';

type BusinessFactoryHeroProps = {
  active?: boolean;
  thinking?: boolean;
  currentTask?: string;
  agentName?: string | null;
  agentRole?: string | null;
  activity?: string | null;
  progress?: number | null;
};

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
  const task = currentTask.trim();
  const status = thinking ? 'ПРОИЗВОДСТВО ИДЁТ' : active ? 'ЗАДАЧА ПРИНЯТА' : 'ЗАВОД ГОТОВ';

  return (
    <section
      className={[styles.shell, active ? styles.active : '', thinking ? styles.thinking : '']
        .filter(Boolean)
        .join(' ')}
      aria-label="Интерактивный AI-завод OSA"
    >
      <div className={styles.backGlow} aria-hidden="true" />
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.lightningA} aria-hidden="true" />
      <div className={styles.lightningB} aria-hidden="true" />

      <div className={styles.topbar}>
        <div>
          <small>OSA FACTORY</small>
          <strong>Производственный центр</strong>
        </div>
        <span className={styles.online}><i /> {status}</span>
      </div>

      <div className={styles.stage}>
        <div className={styles.floor} aria-hidden="true" />

        <div className={styles.coreRig} aria-hidden="true">
          <div className={styles.orbitOuter}><i /><b /></div>
          <div className={styles.orbitTilt} />
          <div className={styles.orbitInner} />
          <div className={styles.core}>
            <span className={styles.coreLens} />
            <span className={styles.coreSpark} />
            <strong>OSA</strong>
            <small>AI CORE</small>
          </div>
          <div className={styles.coreBeam} />
        </div>

        <Link href="/modules/create/studio?mode=video" className={[styles.module, styles.videoModule].join(' ')}>
          <span className={styles.moduleLabel}><b>ВИДЕОЦЕХ</b><em>1915 · PUBLIC DOMAIN</em></span>
          <span className={styles.chaplinVideoFrame}>
            <video
              className={styles.chaplinVideo}
              autoPlay
              muted
              playsInline
              preload="auto"
              aria-label="Чёрно-белый фрагмент фильма Чарли Чаплина The Champion, 1915"
              onLoadedMetadata={(event) => {
                event.currentTarget.currentTime = CHAPLIN_CLIP_START;
              }}
              onTimeUpdate={(event) => {
                if (event.currentTarget.currentTime >= CHAPLIN_CLIP_END) {
                  event.currentTarget.currentTime = CHAPLIN_CLIP_START;
                  void event.currentTarget.play().catch(() => undefined);
                }
              }}
            >
              <source src={CHAPLIN_WEBM_URL} type="video/webm" />
            </video>
            <span className={styles.filmVignette} aria-hidden="true" />
            <span className={styles.filmGrain} aria-hidden="true" />
            <span className={styles.filmScratches} aria-hidden="true" />
            <span className={styles.perforationTop} aria-hidden="true" />
            <span className={styles.perforationBottom} aria-hidden="true" />
          </span>
          <span className={styles.moduleAction}>Настоящий Чаплин · открыть видео →</span>
        </Link>

        <Link href="/modules/create/studio?mode=image" className={[styles.module, styles.visualModule].join(' ')}>
          <span className={styles.moduleLabel}><b>ВИЗУАЛ</b><em>MONO LAB</em></span>
          <span className={styles.photoDeck} aria-hidden="true">
            <span className={styles.photoHero}>
              <img src={VISUAL_PORTRAIT_URL} alt="" loading="eager" referrerPolicy="no-referrer" />
              <span>ПОРТРЕТ</span>
            </span>
            <span className={styles.photoSide}>
              <span>
                <img src={VISUAL_INTERIOR_URL} alt="" loading="eager" referrerPolicy="no-referrer" />
                <b>ИНТЕРЬЕР</b>
              </span>
              <span>
                <img src={VISUAL_PRODUCT_URL} alt="" loading="eager" referrerPolicy="no-referrer" />
                <b>ПРОДУКТ</b>
              </span>
            </span>
          </span>
          <span className={styles.moduleAction}>Создать визуал →</span>
        </Link>

        <Link href="/modules/create/studio?mode=voice" className={[styles.module, styles.voiceModule].join(' ')}>
          <span className={styles.moduleLabel}><b>ГОЛОС</b><em>WAVE</em></span>
          <span className={styles.wave} aria-hidden="true">
            {Array.from({ length: 12 }).map((_, index) => <i key={index} />)}
          </span>
          <span className={styles.moduleAction}>Озвучить →</span>
        </Link>

        <Link href="/modules/sell" className={[styles.module, styles.salesModule].join(' ')}>
          <span className={styles.moduleLabel}><b>ПРОДАЖИ</b><em>FUNNEL</em></span>
          <span className={styles.funnel} aria-hidden="true"><i /><i /><i /><b /></span>
          <span className={styles.moduleAction}>Запустить продажи →</span>
        </Link>

        <Link href="/modules/analyze" className={[styles.module, styles.dataModule].join(' ')}>
          <span className={styles.moduleLabel}><b>АНАЛИТИКА</b><em>DATA</em></span>
          <span className={styles.bars} aria-hidden="true">
            {Array.from({ length: 6 }).map((_, index) => <i key={index} />)}
          </span>
          <span className={styles.moduleAction}>Разобрать данные →</span>
        </Link>

        <div className={styles.energyDots} aria-hidden="true">
          {Array.from({ length: 20 }).map((_, index) => <i key={index} />)}
        </div>
      </div>

      <div className={styles.statusPanel}>
        <div>
          <small>{status}</small>
          <b>{thinking ? agentName ?? 'OSA собирает производственную линию' : task || 'Напиши задачу — OSA соберёт нужные цеха'}</b>
          <p>{activity ?? agentRole ?? 'Видео, визуал, голос, продажи и аналитика подключаются автоматически.'}</p>
        </div>
        <strong>{thinking ? `${progressValue}%` : 'ONLINE'}</strong>
      </div>

      {thinking ? (
        <div className={styles.progress} aria-label={`Прогресс: ${progressValue}%`}>
          <i style={{ width: `${progressValue}%` }} />
        </div>
      ) : null}
    </section>
  );
}
