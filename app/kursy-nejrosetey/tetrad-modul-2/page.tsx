import type { Metadata } from 'next';
import Link from 'next/link';
import { ModuleTwoWorkbook } from '@/components/public/ModuleTwoWorkbook';
import { SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: 'Рабочая тетрадь · Модуль 2 | ЁПТЕТЬ ДА НУ!',
  description: 'Интерактивная практика по четырём урокам: ситуации, живой голос, интервью и редактура.',
};

export default function WorkbookTwoPage() {
  return <SeoPage eyebrow="ЁПТЕТЬ ДА НУ! · МОДУЛЬ 2" title="Рабочая тетрадь" description="Ваш опыт в экспертном контенте. Четыре практических задания, проверка результатов и итоговый отзыв.">
    <ModuleTwoWorkbook />
    <div className="mx-auto max-w-6xl px-5 pb-12 lg:px-8"><Link href="/kursy-nejrosetey/programma" className="text-sm font-bold text-[#9a4f29] underline">← Программа курса</Link></div>
  </SeoPage>;
}
