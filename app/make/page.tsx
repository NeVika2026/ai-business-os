import type { Metadata } from 'next';
import { SeoCta, SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: "Make для бизнеса: автоматизация процессов и AI-сценарии | Бизнес-завод",
  description: "Make для бизнеса: автоматизация заявок, CRM, Telegram, VK, Google Sheets и AI-сценариев.",
};

export default function Page() {
  return (
    <SeoPage
      eyebrow="Make"
      title="Make: собираем автоматизацию без ручной рутины"
      description="Make связывает сервисы в цепочки: заявка пришла, данные записались, AI обработал, CRM обновилась, уведомление отправилось. Именно такие сценарии и нужны бизнесу."
    >
      <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Заявки</h2><p className="mt-3 leading-7 text-[#646a75]">Передача лидов из форм и соцсетей в CRM.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Контент</h2><p className="mt-3 leading-7 text-[#646a75]">Автопубликации и распределение материалов по каналам.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">Google Sheets</h2><p className="mt-3 leading-7 text-[#646a75]">Сбор, обработка и передача данных между сервисами.</p></article>
          <article className="rounded-3xl border border-black/10 bg-white p-6"><h2 className="text-2xl font-black">AI</h2><p className="mt-3 leading-7 text-[#646a75]">Автоматическая классификация, генерация и обработка входящих.</p></article>
        </div>
      </section>
      <SeoCta />
    </SeoPage>
  );
}
