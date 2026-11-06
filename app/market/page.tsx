import Link from 'next/link';
import { SeoPage } from '@/components/public/seo-site-shell';

export default function Page() {
  return (
    <SeoPage
      eyebrow="Маркетплейс"
      title="Готовые решения вместо бесконечного поиска"
      description="Курсы, AI-инструменты, шаблоны, автоматизации и цифровые продукты от Бизнес-завода и приглашённых авторов."
    >
      <section className="mx-auto max-w-5xl px-5 py-16 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Курсы', 'Практические программы с понятным результатом.'],
            ['Готовые заводы', 'Автоматизации и связки, которые можно внедрить.'],
            ['AI-инструменты', 'Помощники под конкретные задачи бизнеса.'],
          ].map(([title, text]) => (
            <div key={title} className="rounded-3xl border border-black/10 bg-white p-6">
              <h2 className="text-2xl font-black">{title}</h2>
              <p className="mt-3 leading-7 text-[#636873]">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl bg-[#f0eaff] p-7">
          <h2 className="text-2xl font-black">Хотите разместить свой продукт?</h2>
          <p className="mt-3 leading-7 text-[#5f5873]">
            Принимаем заявки авторов. Комиссионная модель подключается после модерации и запуска платёжной инфраструктуры.
          </p>
          <Link href="/login" className="mt-5 inline-block rounded-full bg-[#1f2430] px-6 py-3 font-bold text-white">
            Подать заявку
          </Link>
        </div>
      </section>
    </SeoPage>
  );
}
