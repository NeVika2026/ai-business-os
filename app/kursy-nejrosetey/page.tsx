import type { Metadata } from 'next';
import Link from 'next/link';

import { SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: 'Курсы по нейросетям и ИИ: практическое обучение с нуля | Бизнес-завод',
  description:
    'Практический курс по нейросетям, ИИ-агентам и автоматизации. Бесплатный пробный урок и программа обучения «ЁПТЕТЬ ДА НУ!».',
};

const topics = [
  'Как разговаривать с AI так, чтобы получать результат',
  'Контент, визуалы, тексты и презентации',
  'ИИ-агенты и цифровые сотрудники',
  'Make, автоматизации и связки между сервисами',
  'Практические задания и готовые сценарии',
  'Сборка собственной AI-системы для работы',
];

export default function Page() {
  return (
    <SeoPage
      eyebrow="Обучение"
      title="Курс по нейросетям «ЁПТЕТЬ ДА НУ!»"
      description="От первых рабочих запросов до цифровых помощников и автоматизации. Полная программа курса в разработке, а первый пробный урок уже можно пройти."
    >
      <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
        <div className="rounded-[2rem] border border-[#f0c7a6] bg-[#251c1a] p-7 text-white lg:p-11">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffa96c]">
            Открытый практикум
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight lg:text-4xl">
            Бесплатный урок: соберите первый рабочий запрос к ИИ
          </h2>
          <p className="mt-4 max-w-3xl leading-7 text-white/75">
            Короткое объяснение, пример, упражнение и готовый запрос для копирования. Вход и оплата
            не нужны. Это настоящий интерактивный пробный урок, а не ссылка на регистрацию.
          </p>
          <Link
            href="/kursy-nejrosetey/probnyj-urok"
            className="mt-7 inline-flex rounded-full bg-[#ff7418] px-7 py-3.5 font-black text-[#201610]"
          >
            Пройти урок бесплатно ↗
          </Link>
        </div>

        <div className="mt-10 rounded-[2rem] border border-black/10 bg-white p-8 lg:p-12">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#9a470d]">
            Направления полного курса · программа в разработке
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {topics.map((topic) => (
              <div key={topic} className="rounded-2xl bg-[#f6f0ea] p-4 font-semibold">
                {topic}
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm leading-6 text-[#666872]">
            Полный курс пока не продаётся. Доступность будущих уроков и сроки запуска будут
            объявлены отдельно.
          </p>
          <Link
            href="/gotovoe"
            className="mt-7 inline-flex rounded-full border border-black/20 px-6 py-3 font-bold text-[#1f2430]"
          >
            Другие бесплатные инструменты ↗
          </Link>
        </div>
      </section>
    </SeoPage>
  );
}
