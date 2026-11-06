import Link from 'next/link';
import { SeoPage } from '@/components/public/seo-site-shell';

const steps = ['Выбрать навык, который можно продать', 'Упаковать профиль и услугу', 'Собрать первые примеры в портфолио', 'Найти подходящие заказы', 'Подготовить отклик с AI-помощником', 'Дойти до первой оплаты'];

export default function Page() {
  return (
    <SeoPage eyebrow="Выйти в деньги" title="Не просто учиться. Дойти до первого заработка." description="Пошаговый маршрут от навыка до профиля, откликов, первого заказа и оплаты — без обещаний гарантированного дохода.">
      <section className="mx-auto max-w-5xl px-5 py-16 lg:px-8">
        <div className="grid gap-3">
          {steps.map((step, i) => (
            <div key={step} className="flex gap-4 rounded-2xl border border-black/10 bg-white p-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7357ff] font-black text-white">{i+1}</div>
              <div className="font-bold">{step}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-3xl bg-[#1f2430] p-7 text-white">
          <h2 className="text-2xl font-black">Первый маршрут будет бесплатным</h2>
          <p className="mt-3 leading-7 text-white/70">После входа пользователь получает базовый маршрут, а дополнительные инструменты, разборы и сопровождение можно подключать отдельно.</p>
          <Link href="/login" className="mt-5 inline-block rounded-full bg-white px-6 py-3 font-bold text-[#1f2430]">Начать маршрут</Link>
        </div>
      </section>
    </SeoPage>
  );
}
