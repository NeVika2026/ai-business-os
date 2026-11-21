import type { Metadata } from 'next';
import Link from 'next/link';

import { aiNewsItems } from '@/lib/public/ai-news';

import styles from './simple-home.module.css';

export const metadata: Metadata = {
  title: 'Бизнес-завод AI — что вы хотите создать?',
  description:
    'Выберите одну задачу: текст, картинка или видео. Бизнес-завод AI поможет начать без сложных меню. Практические инструменты, новости и один курс «ЁПТЕТЬ ДА НУ!».',
  openGraph: {
    title: 'Бизнес-завод AI — выберите задачу и начните',
    description: 'Никаких сложных меню. Выберите текст, картинку или видео — и начните.',
    locale: 'ru_RU',
    type: 'website',
  },
};

const choices = [
  {
    tag: '01 / ПРОСТО',
    title: 'Написать текст',
    hint: 'Пост, сообщение или контент-план',
    note: 'Бесплатно, без регистрации',
    href: '/sozdat/tekst',
    kind: 'text',
    action: 'Начать с текста',
  },
  {
    tag: '02 / ТВОРЧЕСТВО',
    title: 'Сделать обложку',
    hint: 'Красивая обложка с вашим текстом',
    note: 'Работает без регистрации',
    href: '/sozdat/kartinka',
    kind: 'image',
    action: 'Создать обложку',
  },
  {
    tag: '03 / ДВИЖЕНИЕ',
    title: 'Оживить фото',
    hint: 'Короткая анимированная заставка',
    note: 'Короткое видео бесплатно',
    href: '/sozdat/video',
    kind: 'video',
    action: 'Оживить фотографию',
  },
] as const;

export default function SimpleHomePage() {
  return (
    <main className={styles.page}>
      <div className={styles.grain} aria-hidden="true" />
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Бизнес-завод AI — главная">
          <span className={styles.brandIcon}>БЗ</span>
          <span>
            БИЗНЕС-ЗАВОД <b>AI</b>
          </span>
        </Link>
        <Link href="/login/sign-in" className={styles.enter}>
          Войти <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroText}>
          <p className={styles.kicker}>
            <span className={styles.liveDot} /> ВАША МАСТЕРСКАЯ ИИ
          </p>
          <h1 id="hero-title">
            Что хочешь <em>создать?</em>
          </h1>
          <p className={styles.description}>
            Текст? Картинку? Видео? Выбери одно. Мы покажем, что делать дальше.
          </p>
          <a href="#choice" className={styles.mainAction}>
            Выбрать, что сделать <span aria-hidden="true">↓</span>
          </a>
          <p className={styles.mainHint}>Не нужно знать названия нейросетей.</p>
        </div>

        <div className={styles.chaplinStage}>
          <div className={styles.halo} aria-hidden="true" />
          <div className={styles.filmCard}>
            <div className={styles.cardTop}>
              <span className={styles.reelIcon} aria-hidden="true">
                ◉
              </span>
              <span>ВИДЕОЦЕХ / КИНО ИЗ БУДУЩЕГО</span>
              <span className={styles.playStatus}>● КИНО ИДЁТ</span>
            </div>
            <div className={styles.filmWrap}>
              <div className={styles.filmTop} aria-hidden="true" />
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className={styles.chaplinVideo}
                aria-label="Чёрно-белый фрагмент фильма Чарли Чаплина «The Champion»"
              >
                <source src="/media/chaplin-loop.mp4" type="video/mp4" />
              </video>
              <div className={styles.filmBottom} aria-hidden="true" />
            </div>
            <div className={styles.cardBottom}>
              <span>Настоящий чёрно-белый фильм</span>
              <span>1915 / PUBLIC DOMAIN</span>
            </div>
          </div>
          <div className={styles.floatSticker} aria-hidden="true">
            <span>AI</span>
            <small>ИДЕЯ → РЕЗУЛЬТАТ</small>
          </div>
        </div>
      </section>

      <section id="choice" className={styles.choiceSection} aria-labelledby="choice-title">
        <div className={styles.choiceHeading}>
          <p className={styles.sectionMarker}>ВСЕГО ОДИН ВЫБОР</p>
          <h2 id="choice-title">С чего начнём?</h2>
          <p>Нажми на картинку с тем, что хочешь сделать.</p>
        </div>
        <div className={styles.choices}>
          {choices.map((choice) => (
            <Link
              key={choice.kind}
              href={choice.href}
              className={styles.choiceCard}
              data-kind={choice.kind}
            >
              <div className={styles.choiceTop}>
                <span>{choice.tag}</span>
                <span className={styles.cardArrow} aria-hidden="true">
                  ↗
                </span>
              </div>
              <div className={styles.visual} aria-hidden="true">
                {choice.kind === 'text' ? (
                  <div className={styles.paper}>
                    <span />
                    <span />
                    <span />
                    <span />
                    <b>Аа</b>
                  </div>
                ) : choice.kind === 'image' ? (
                  <div className={styles.picture}>
                    <div className={styles.sun} />
                    <div className={styles.mountains} />
                    <span>✦</span>
                  </div>
                ) : (
                  <div className={styles.videoIcon}>
                    <span className={styles.videoRing} />
                    <span className={styles.videoPlay}>▶</span>
                    <i />
                  </div>
                )}
              </div>
              <h3>{choice.title}</h3>
              <p>{choice.hint}</p>
              <div className={styles.choiceFooter}>
                <span>{choice.note}</span>
                <strong>{choice.action} ↗</strong>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.extras} aria-label="Новости и обучение">
        <div className={styles.newsSection}>
          <div className={styles.extrasTitle}>
            <div>
              <p className={styles.sectionMarker}>КОРОТКО И ПО ДЕЛУ</p>
              <h2>AI-ПУЛЬС</h2>
            </div>
            <Link href="/novosti-ai">Все новости ↗</Link>
          </div>
          <div className={styles.newsList}>
            {aiNewsItems.slice(0, 2).map((item) => (
              <Link key={item.slug} href={`/novosti-ai#${item.slug}`} className={styles.newsRow}>
                <span className={styles.newsVisual} aria-hidden="true">
                  {item.icon}
                </span>
                <span className={styles.newsBody}>
                  <small>
                    {item.date} · {item.category}
                  </small>
                  <strong>{item.title}</strong>
                </span>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.courseBlock}>
          <p className={styles.sectionMarker}>НАШ ЕДИНСТВЕННЫЙ КУРС</p>
          <h2>
            ЁПТЕТЬ <span>ДА НУ!</span>
          </h2>
          <p>Нейросети на практике. Можно начать с настоящего первого урока.</p>
          <Link href="/kursy-nejrosetey/probnyj-urok">Смотреть бесплатный урок ↗</Link>
          <small>Полный курс ещё готовится.</small>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>БИЗНЕС-ЗАВОД AI · {new Date().getFullYear()}</span>
        <Link href="/login/sign-in">Войти в кабинет ↗</Link>
      </footer>
    </main>
  );
}
