import type { Metadata } from 'next';
import { SeoCta, SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: 'Автоматизация бизнеса с ИИ: Make, n8n, CRM и AI | Бизнес-завод',
  description: 'Автоматизация бизнеса с ИИ: заявки, CRM, Telegram, VK, Google Sheets, Make, n8n и AI-обработка. Готовые сценарии и практические связки.',
};

export default function Page() {
  return (
    <SeoPage
      eyebrow="Автоматизация"
      title="Автоматизация бизнеса с ИИ"
      description="Связываем нейросети с тем, чем бизнес уже пользуется: CRM, мессенджерами, соцсетями, таблицами и формами. Цель — убрать ручную рутину, а не добавить ещё один сервис."
    >
      <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['VK → CRM', 'Заявка попадает в CRM без ручного копирования.'],
            ['Telegram / MAX', 'Автопубликации, уведомления и распределение контента.'],
            ['Google Sheets + AI', 'Сводки, классификация, обработка и контроль данных.'],
            ['Make / n8n', 'Связки между сервисами и многошаговые автоматические сценарии.'],
          ].map(([title, text]) => (
            <article key={title} className="rounded-3xl border border-black/10 bg-white p-6">
              <h2 className="text-2xl font-black">{title}</h2>
              <p className="mt-3 leading-7 text-[#646a75]">{text}</p>
            </article>
          ))}
        </div>
      </section>
      <SeoCta />
    </SeoPage>
  );
}
