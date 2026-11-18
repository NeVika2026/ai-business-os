import type { Metadata } from 'next';
import Link from 'next/link';

import { AiNewsSidebar } from '@/components/public/AiNewsSidebar';

import styles from './landing.module.css';

export const metadata: Metadata = {
  title: 'Бизнес-завод AI — нейросети для работы, бизнеса и заработка',
  description:
    'Нейросети для бизнеса без воды: бесплатные AI-инструменты, готовые решения, автоматизация, маркетинг, продажи и практическое обучение.',
  openGraph: {
    title: 'Бизнес-завод AI — от идеи до результата',
    description:
      'Попробуйте AI-инструменты, изучайте реальные сценарии и собирайте собственные решения.',
    type: 'website',
    locale: 'ru_RU',
  },
};

const workshops = [
  {
    index: '01',
    symbol: '✳',
    title: 'Контент и визуал',
    copy: 'Идеи, тексты, изображения, видео и упаковка бренда в одном рабочем процессе.',
    href: '/gotovoe',
  },
  {
    index: '02',
    symbol: '↗',
    title: 'Маркетинг и продажи',
    copy: 'Офферы, изучение аудитории, работа с возражениями и привлечение клиентов.',
    href: '/ii-dlya-prodazh',
  },
  {
    index: '03',
    symbol: '⌘',
    title: 'Автоматизация',
    copy: 'Меньше повторяющихся действий. Больше времени на решения и развитие бизнеса.',
    href: '/avtomatizaciya-biznesa',
  },
  {
    index: '04',
    symbol: '◈',
    title: 'AI-сотрудники',
    copy: 'Сценарии для цифровых помощников и инструментов, работающих под конкретные задачи.',
    href: '/ii-agenty',
  },
];

const tasks = [
  ['Сделать продающий текст', '/gotovoe'],
  ['Собрать презентацию', '/gotovoe'],
  ['Автоматизировать заявки', '/avtomatizaciya-biznesa'],
  ['Создать AI-сотрудника', '/ii-agenty'],
  ['Найти клиентов', '/ii-dlya-prodazh'],
  ['Выйти в первые деньги', '/vyyti-v-dengi'],
] as const;

export default function PublicHomePage() {
  return (
    <main className={styles.site}>
      <div className={styles.noise} aria-hidden="true" />
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Бизнес-завод AI — главная">
          <span className={styles.brandIcon}>БЗ</span>
          <span>
            БИЗНЕС-ЗАВОД <b>AI</b>
          </span>
        </Link>
        <nav className={styles.nav} aria-label="Основная навигация">
          <Link href="/gotovoe">Инструменты</Link>
          <Link href="/kursy-nejrosetey">Курс</Link>
          <Link href="/novosti-ai">Новости AI</Link>
          <Link href="/vyyti-v-dengi">Заработок</Link>
        </nav>
        <Link className={styles.navCta} href="/login">
          Личный кабинет <span>↗</span>
        </Link>
      </header>

      <div className={styles.heroWithNews}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>
              <span className={styles.dot} /> ПЛАТФОРМА ПРАКТИЧЕСКОГО ИИ
            </div>
            <h1>
              ХВАТИТ
              <br />
              ИЗУЧАТЬ <em>ИИ.</em>
              <br />
              <span>ПОРА НА НЁМ</span>
              <br />
              РАБОТАТЬ.
            </h1>
            <p className={styles.lead}>
              Нейросети для тех, кто делает бизнес, продаёт, создаёт контент и хочет получать
              результат, а не коллекционировать промпты.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primary} href="/gotovoe">
                Попробовать бесплатно <span>↗</span>
              </Link>
              <Link className={styles.secondary} href="/vyyti-v-dengi">
                Путь к заработку ↗
              </Link>
            </div>
            <div className={styles.heroNote}>
              <span>НЕ МАГИЯ.</span> ИНСТРУМЕНТЫ, КОТОРЫЕ МОЖНО ПРИМЕНИТЬ.
            </div>
          </div>
          <div className={styles.heroArt} aria-label="Визуализация AI-завода">
            <div className={styles.orbitOne} />
            <div className={styles.orbitTwo} />
            <div className={styles.factoryPanel}>
              <div className={styles.panelTop}>
                <span>AI / WORKSHOP 01</span>
                <span className={styles.live}>● SYSTEM ONLINE</span>
              </div>
              <div className={styles.factorySymbol}>
                AI<span>⚙</span>
              </div>
              <div className={styles.panelBottom}>
                <span>ИДЕЯ</span>
                <b>→</b>
                <span>ДЕЙСТВИЕ</span>
                <b>→</b>
                <span>РЕЗУЛЬТАТ</span>
              </div>
            </div>
            <span className={styles.floatingA}>CONTENT.EXE / READY</span>
            <span className={styles.floatingB}>AUTOMATE ↗</span>
            <div className={styles.heroCaption}>НОВАЯ ПРОИЗВОДИТЕЛЬНОСТЬ / 2026</div>
          </div>
        </section>
        <AiNewsSidebar />
      </div>

      <section className={styles.tasks}>
        <div className={styles.sectionTop}>
          <span>00 / НАЧНИТЕ С ЗАДАЧИ</span>
          <span>НЕ НУЖНО ЗНАТЬ НАЗВАНИЯ ВСЕХ НЕЙРОСЕТЕЙ</span>
        </div>
        <h2>ЧТО ХОТИТЕ СДЕЛАТЬ?</h2>
        <div className={styles.taskGrid}>
          {tasks.map(([task, href]) => (
            <Link href={href} key={task} className={styles.taskLink}>
              {task} <span>↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section id="workshops" className={styles.workshops}>
        <div className={styles.sectionTop}>
          <span>01 / ЦЕХА ЗАВОДА</span>
          <span>ПОСТРОЕНО ВОКРУГ РЕАЛЬНЫХ ЗАДАЧ</span>
        </div>
        <div className={styles.sectionTitle}>
          <h2>
            ЗДЕСЬ ИДЕИ
            <br />
            <i>СТАНОВЯТСЯ ДЕЛОМ.</i>
          </h2>
          <p>Не нужно разбираться во всём сразу. Выберите задачу, а затем подходящий инструмент.</p>
        </div>
        <div className={styles.grid}>
          {workshops.map((item) => (
            <Link className={styles.workshop} key={item.index} href={item.href}>
              <div className={styles.cardTop}>
                <span>ЦЕХ / {item.index}</span>
                <span className={styles.cardSymbol}>{item.symbol}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
              <div className={styles.cardLine} />
            </Link>
          ))}
        </div>
      </section>

      <section id="course" className={styles.course}>
        <div className={styles.courseInfo}>
          <span className={styles.courseTag}>СКОРО / ПРАКТИЧЕСКОЕ ОБУЧЕНИЕ</span>
          <h2>
            ЁПТЕТЬ
            <br />
            <strong>ДА НУ!</strong>
          </h2>
          <p>
            Авторский практический курс о том, как применять ИИ в работе и бизнесе. Контент,
            изображения, видео, продажи и автоматизация — с реальными заданиями, а не только
            теорией.
          </p>
          <span className={styles.courseStatus}>ПРОГРАММА В РАЗРАБОТКЕ · ПРОДАЖИ НЕ ОТКРЫТЫ</span>
          <Link className={styles.courseLink} href="/kursy-nejrosetey">
            Посмотреть раздел курсов ↗
          </Link>
        </div>
        <div className={styles.courseDisplay} aria-hidden="true">
          <span>01 / УЗНАЛ</span>
          <span>02 / ПОПРОБОВАЛ</span>
          <span>03 / СДЕЛАЛ</span>
          <div className={styles.burst}>!</div>
        </div>
      </section>

      <section id="about" className={styles.about}>
        <span>БЕСПЛАТНЫЕ ИНСТРУМЕНТЫ · ГОТОВЫЕ РЕШЕНИЯ · КУРСЫ</span>
        <h2>
          МЕНЬШЕ ШУМА.
          <br />
          <i>БОЛЬШЕ ПОЛЬЗЫ.</i>
        </h2>
        <p>
          «Бизнес-завод AI» — место, где нейросети превращаются из новостей в работу. Выберите
          задачу, попробуйте инструмент, создайте результат и решайте, какие возможности нужны
          дальше.
        </p>
        <Link href="/gotovoe" className={styles.primary}>
          Выбрать бесплатный инструмент ↗
        </Link>
      </section>

      <footer className={styles.footer}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandIcon}>БЗ</span>
          <span>
            БИЗНЕС-ЗАВОД <b>AI</b>
          </span>
        </Link>
        <span>© {new Date().getFullYear()} · НЕЙРОСЕТИ ДЛЯ РЕАЛЬНЫХ ЗАДАЧ</span>
        <Link href="/login">Вход в кабинет ↗</Link>
      </footer>
    </main>
  );
}
