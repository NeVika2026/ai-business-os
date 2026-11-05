import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: 'Курсы по нейросетям и ИИ: практическое обучение с нуля | Бизнес-завод',
  description: 'Практический курс по нейросетям, ИИ-агентам и автоматизации. Учимся использовать AI в реальной работе и собирать собственные рабочие системы.',
};

export default function Page() {
  return (
    <SeoPage
      eyebrow="Обучение"
      title="Курс по нейросетям «ЁПТЕТЬ ДА НУ!»"
      description="Курс внутри Бизнес-завода: от первых рабочих запросов к нейросети до AI-агентов, автоматизаций, контент-систем и собственных цифровых сотрудников."
    >
      <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
        <div className="rounded-[2rem] border border-black/10 bg-white p-8 lg:p-12">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#7357ff]">Что внутри</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              'Как разговаривать с AI так, чтобы получать результат',
              'Контент, визуалы, тексты и презентации',
              'ИИ-агенты и цифровые сотрудники',
              'Make, автоматизации и связки между сервисами',
              'Практические задания и готовые сценарии',
              'Сборка собственной AI-системы для работы',
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-[#f6f0ea] p-4 font-semibold">{item}</div>
            ))}
          </div>
          <Link href="/login" className="mt-8 inline-flex rounded-full bg-[#1f2430] px-7 py-3.5 font-bold text-white">
            Войти в Бизнес-завод
          </Link>
        </div>
      </section>
    </SeoPage>
  );
}
