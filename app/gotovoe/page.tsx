import Link from 'next/link';
import { SeoPage } from '@/components/public/seo-site-shell';

const tools = [
  ['AI-сотрудник', 'Соберите роль и инструкцию для цифрового помощника.'],
  ['Контент-план на месяц', 'Получите основу контента под свою нишу.'],
  ['Заявка → CRM → уведомление', 'Посмотрите готовую схему автоматизации.'],
  ['Презентация с ИИ', 'Соберите структуру и тексты презентации.'],
  ['30 промптов для продаж', 'Готовые запросы для офферов, возражений и повторных продаж.'],
];

export default function Page() {
  return (
    <SeoPage eyebrow="Бесплатно" title="Сначала получите пользу. Потом решайте, платить или нет." description="Здесь собраны бесплатные инструменты, шаблоны и рабочие материалы Бизнес-завода.">
      <section className="mx-auto max-w-5xl px-5 py-16 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          {tools.map(([title, text]) => (
            <div key={title} className="rounded-3xl border border-black/10 bg-white p-6">
              <div className="text-xs font-black uppercase tracking-[0.14em] text-[#7357ff]">Бесплатно</div>
              <h2 className="mt-3 text-2xl font-black">{title}</h2>
              <p className="mt-3 leading-7 text-[#636873]">{text}</p>
              <Link href="/login" className="mt-6 inline-block font-bold text-[#7357ff]">Открыть →</Link>
            </div>
          ))}
        </div>
      </section>
    </SeoPage>
  );
}
