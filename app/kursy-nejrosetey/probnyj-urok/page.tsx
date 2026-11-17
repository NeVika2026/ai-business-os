import type { Metadata } from 'next';
import Link from 'next/link';

import { PromptLessonLab } from '@/components/public/PromptLessonLab';
import { SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: 'Бесплатный урок: как составить промпт для нейросети | Бизнес-завод AI',
  description:
    'Практическое упражнение для начинающих: создайте свой запрос к нейросети, скопируйте и проверьте результат.',
};

export default function TrialLessonPage() {
  return (
    <SeoPage
      eyebrow="Бесплатный пробный урок"
      title="Урок 1. Как получить от нейросети понятный результат"
      description="Практикум Бизнес-завода AI. Без регистрации, оплаты и расхода API-кредитов."
    >
      <div className="mx-auto max-w-5xl px-5 pb-16 pt-12 lg:px-8">
        <div className="rounded-[2rem] bg-[#1f2430] p-6 text-white md:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#fbb78b]">
            5 минут · Начальный уровень
          </p>
          <h2 className="mt-4 text-2xl font-black md:text-3xl">
            Почему «напиши мне пост» часто даёт слабый ответ?
          </h2>
          <p className="mt-4 max-w-3xl leading-7 text-white/80">
            ИИ не знает ваш продукт, клиента, цель и желаемый формат, пока вы об этом не сообщите.
            Чем меньше контекста, тем больше нейросети приходится угадывать. Рабочий запрос
            описывает задачу так, чтобы результат можно было проверить.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/15 bg-white/5 p-5">
              <p className="text-xs font-bold uppercase text-[#d9a0a0]">Слишком общий запрос</p>
              <p className="mt-2 font-bold">«Напиши пост про недвижимость»</p>
              <p className="mt-3 text-sm leading-6 text-white/65">
                Нет аудитории, цели и ограничения по формату.
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/5 p-5">
              <p className="text-xs font-bold uppercase text-[#fbb78b]">
                Рабочая постановка задачи
              </p>
              <p className="mt-2 font-bold">
                «Составь пост для покупателей первой квартиры. Объясни три проверки до сделки.
                Коротко, без выдуманных фактов»
              </p>
              <p className="mt-3 text-sm leading-6 text-white/65">
                Понятно, для кого и что именно нужно получить.
              </p>
            </div>
          </div>
        </div>
        <PromptLessonLab />
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white p-6">
          <div>
            <h2 className="text-xl font-black">Что дальше?</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#636873]">
              Пробный урок открыт. Полный курс «ЁПТЕТЬ ДА НУ!» ещё готовится.
            </p>
          </div>
          <Link
            href="/kursy-nejrosetey"
            className="rounded-full bg-[#1f2430] px-6 py-3 font-bold text-white"
          >
            Вернуться к программе ↗
          </Link>
        </div>
      </div>
    </SeoPage>
  );
}
