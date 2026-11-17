import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: 'Курс «ЁПТЕТЬ ДА НУ!» — нейросети на практике | Бизнес-завод AI',
  description:
    'Единый авторский курс «ЁПТЕТЬ ДА НУ!». Посмотрите первый оригинальный урок «Хватит смотреть на пустой пост. Сделаем свой».',
};

export default function CoursePage() {
  return (
    <SeoPage
      eyebrow="Один авторский курс"
      title="ЁПТЕТЬ ДА НУ!"
      description="Учимся применять нейросети в работе и бизнесе: не смотреть бесконечную теорию, а делать настоящие задачи. Здесь размещается один существующий курс; отдельные курсы-дубли мы не создаём."
    >
      <div className="mx-auto max-w-5xl px-5 py-12 lg:px-8">
        <section className="rounded-[2rem] bg-[#201a1a] p-7 text-white lg:p-12">
          <p className="text-xs font-bold uppercase tracking-widest text-[#ffb27e]">
            Первый бесплатный урок · Материал от 6 ноября 2026
          </p>
          <h2 className="mt-4 text-3xl font-black leading-tight lg:text-5xl">
            Хватит смотреть на пустой пост. Сделаем свой
          </h2>
          <p className="mt-5 max-w-2xl leading-7 text-white/80">
            Реальный материал нашего курса: видео, исходный запрос для семейного фотографа, проверка
            ответа нейросети и самостоятельное задание. После урока у ученика останутся свой пост и
            запрос.
          </p>
          <Link
            href="/kursy-nejrosetey/probnyj-urok"
            className="mt-8 inline-flex rounded-full bg-[#ff7418] px-7 py-3 font-black text-[#221610]"
          >
            Посмотреть оригинальный урок ↗
          </Link>
        </section>
        <p className="mt-8 rounded-2xl border border-[#ddcebf] bg-white p-5 text-sm leading-7 text-[#575861]">
          Остальные уроки «ЁПТЕТЬ ДА НУ!» готовятся и проверяются по исходным материалам. Полный
          курс пока не объявлен готовым и не выставлен на продажу.
        </p>
      </div>
    </SeoPage>
  );
}
