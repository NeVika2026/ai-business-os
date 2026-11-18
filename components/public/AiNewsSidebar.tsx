import Link from 'next/link';
import { aiNewsItems } from '@/lib/public/ai-news';
import styles from '@/app/landing.module.css';

export function AiNewsSidebar() {
  return (
    <aside className={styles.newsSidebar} aria-labelledby="news-title">
      <div className={styles.newsHeader}>
        <div className={styles.newsKicker}>
          <span className={styles.newsLiveDot} aria-hidden="true" />
          РЕДАКЦИОННАЯ ЛЕНТА
        </div>
        <h2 id="news-title">
          AI<span>ПУЛЬС</span>
        </h2>
        <p>Что изменилось в нейросетях — и зачем это бизнесу.</p>
      </div>
      <div className={styles.newsItems}>
        {aiNewsItems.map((item) => (
          <article className={styles.newsCard} key={item.slug}>
            <div className={styles.newsMeta}>
              <time dateTime={item.date.split('.').reverse().join('-')}>{item.date}</time>
              <span>{item.category}</span>
            </div>
            <div className={styles.newsCardBody}>
              <span className={styles.newsIcon} aria-hidden="true">
                {item.icon}
              </span>
              <h3>{item.title}</h3>
            </div>
            <p>{item.application}</p>
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Открыть первоисточник: ${item.title}`}
            >
              Первоисточник ↗
            </a>
          </article>
        ))}
      </div>
      <Link href="/novosti-ai" className={styles.newsAllLink}>
        Все новости <span>↗</span>
      </Link>
      <p className={styles.newsDisclaimer}>
        Ручная подборка. Даты — даты публикаций источников. Автоматическое обновление отключено.
      </p>
    </aside>
  );
}
