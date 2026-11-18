import type { Metadata } from 'next';
import Link from 'next/link';
import { aiNewsItems } from '@/lib/public/ai-news';
import { NewsVisual } from '@/components/public/NewsVisual';
import { SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: 'Новости нейросетей и ИИ для бизнеса | Бизнес-завод AI',
  description:
    'Проверенные новости нейросетей с датами, ссылками на первоисточники и практической пользой для бизнеса.',
};

export default function AiNewsPage() {
  return (
    <SeoPage
      eyebrow="AI-ПУЛЬС / Редакционная лента"
      title="Новости нейросетей без шума"
      description="Отбираем новости, проверяем первоисточники и переводим анонсы на язык практических задач. Материалы добавляются после проверки."
    >
      <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
        <div className="grid gap-5">
          {aiNewsItems.map((item) => (
            <article
              key={item.slug}
              id={item.slug}
              className="rounded-[2rem] border border-black/10 bg-white p-7 shadow-sm md:p-10"
            >
              <div className="flex flex-wrap items-center gap-3 text-xs font-black tracking-wider text-[#a14c13]">
                <time dateTime={item.date.split('.').reverse().join('-')}>{item.date}</time>
                <span>•</span>
                <span>{item.category}</span>
              </div>
              <div className="mt-5 max-w-lg overflow-hidden rounded-xl border border-black/10 bg-[#191920]">
                <NewsVisual
                  type={
                    item.category === 'МОДЕЛИ'
                      ? 'models'
                      : item.category === 'ПРОДАЖИ'
                        ? 'sales'
                        : 'visual'
                  }
                />
              </div>
              <div className="mt-5 flex items-start gap-4">
                <span
                  aria-hidden="true"
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#1e2027] text-3xl text-[#ff8b35]"
                >
                  {item.icon}
                </span>
                <h2 className="text-2xl font-black leading-tight tracking-tight md:text-3xl">
                  {item.title}
                </h2>
              </div>
              <p className="mt-5 text-base leading-8 text-[#5d636d]">{item.summary}</p>
              <div className="mt-5 rounded-2xl bg-[#fff4e9] p-5 text-sm leading-7 text-[#573c2e]">
                <strong>Практическая польза. </strong>
                {item.application}
              </div>
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex font-black text-[#a14c13] underline underline-offset-4"
              >
                Официальный источник: {item.sourceName} ↗
              </a>
            </article>
          ))}
        </div>
        <p className="mt-7 text-sm leading-7 text-[#676b75]">
          Последние материалы датированы ноябрём 2026 года. Лента не обновляется автоматически: не
          выдаём старые записи за новости сегодняшнего дня.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-full border border-black/20 px-6 py-3 font-bold"
        >
          ← На главную
        </Link>
      </section>
    </SeoPage>
  );
}
