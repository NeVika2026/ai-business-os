import type { Metadata } from 'next';
import Link from 'next/link';

import { FreeToolWorkshop } from '@/components/public/FreeToolWorkshop';
import { SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: 'Бесплатные инструменты ИИ и шаблоны для бизнеса | Бизнес-завод AI',
  description:
    'Создайте пост, сообщение клиенту или контент-план за минуту без регистрации и API-кредитов.',
};

const materials = [
  {
    title: 'AI-сотрудники',
    description: 'Сценарии цифровых помощников для рабочих задач.',
    href: '/ii-agenty',
  },
  {
    title: 'Автоматизация заявок',
    description: 'Как связать задачи, сообщения и CRM.',
    href: '/avtomatizaciya-biznesa',
  },
  {
    title: 'ИИ для продаж',
    description: 'Тексты, работа с возражениями и переговоры.',
    href: '/ii-dlya-prodazh',
  },
  {
    title: 'Курс «ЁПТЕТЬ ДА НУ!»',
    description: 'Программа будущего практического обучения.',
    href: '/kursy-nejrosetey',
  },
];

export default function Page() {
  return (
    <SeoPage
      eyebrow="Бесплатно"
      title="Сначала получите пользу. Потом решайте, платить или нет."
      description="Рабочие шаблоны и материалы Бизнес-завода. Начните без регистрации и без списания API-кредитов."
    >
      <FreeToolWorkshop />
      <section className="mx-auto max-w-5xl px-5 pb-16 lg:px-8">
        <h2 className="mb-6 text-3xl font-black tracking-tight">Изучить другие возможности</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {materials.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-3xl border border-black/10 bg-white p-6 transition hover:border-[#b84e00]"
            >
              <h3 className="text-2xl font-black">{item.title}</h3>
              <p className="mt-3 leading-7 text-[#636873]">{item.description}</p>
              <span className="mt-6 inline-block font-bold text-[#9a470d]">
                Посмотреть раздел ↗
              </span>
            </Link>
          ))}
        </div>
      </section>
    </SeoPage>
  );
}
