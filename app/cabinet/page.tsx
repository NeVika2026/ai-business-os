import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createClient } from '@/services/supabase/server';

export default async function CabinetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/cabinet');

  return (
    <main className="min-h-screen bg-[#fffaf5] px-5 py-10 text-[#1f2430] lg:px-8 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="text-sm font-black uppercase tracking-[0.16em] text-[#7357ff]">Мой Бизнес-завод</div>
        <h1 className="mt-3 text-4xl font-black tracking-tight lg:text-6xl">Личный кабинет</h1>
        <p className="mt-4 max-w-2xl leading-7 text-[#636873]">
          Бесплатные инструменты, купленные продукты, путь «Выйти в деньги», документы и персональные предложения будут собраны здесь.
        </p>

        <div className="mt-9 grid gap-4 md:grid-cols-2">
          <Link href="/cabinet/offers" className="rounded-3xl border border-black/10 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-[#7357ff]">24 часа</div>
            <h2 className="mt-2 text-2xl font-black">Моя стартовая цена</h2>
            <p className="mt-3 leading-7 text-[#636873]">Проверить, действует ли персональное welcome-предложение.</p>
          </Link>
          <Link href="/vyyti-v-dengi" className="rounded-3xl border border-black/10 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-[#7357ff]">Маршрут</div>
            <h2 className="mt-2 text-2xl font-black">Выйти в деньги</h2>
            <p className="mt-3 leading-7 text-[#636873]">От навыка и профиля до отклика и первого заказа.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
