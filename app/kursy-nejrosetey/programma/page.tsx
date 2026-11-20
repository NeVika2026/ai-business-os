import type { Metadata } from 'next';
import { YoptetCourseProgram } from '@/components/public/YoptetCourseProgram';
import { SeoPage } from '@/components/public/seo-site-shell';

export const metadata: Metadata = { title: 'Программа курса ЁПТЕТЬ ДА НУ!', description: 'Десять модулей и 77 уроков основной программы курса по нейросетям. Предпросмотр.' };

export default function CourseProgramPage() {
  return <SeoPage eyebrow="Курс ЁПТЕТЬ ДА НУ!" title="Программа и уроки" description="Настоящее оглавление курса из сохранённой рабочей программы."><YoptetCourseProgram /></SeoPage>;
}
