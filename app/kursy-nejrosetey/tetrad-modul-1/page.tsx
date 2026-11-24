import type { Metadata } from 'next';
import Link from 'next/link';
import { ModuleOneWorkbook } from '@/components/public/ModuleOneWorkbook';
import { SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = {
  title: 'Рабочая тетрадь · Модуль 1 | Нейробунт',
  description: 'Интерактивные задания пяти уроков первого модуля и обязательный отзыв по итогам блока.',
};

export default function WorkbookOnePage() {
  return <SeoPage eyebrow="Нейробунт · МОДУЛЬ 1" title="Рабочая тетрадь" description="Пять практических заданий по реальным урокам: заполняйте в браузере, проверяйте результат и сохраняйте свои ответы.">
    <ModuleOneWorkbook />
    <div className="mx-auto max-w-6xl px-5 pb-12 lg:px-8"><Link href="/kursy-nejrosetey/programma" className="text-sm font-bold text-[#9a4f29] underline">← Программа курса</Link></div>
  </SeoPage>;
}
