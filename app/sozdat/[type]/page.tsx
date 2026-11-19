import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MiniStudio, type StudioMode } from '@/components/public/MiniStudio';

type PageProps = { params: Promise<{ type: string }> };
const types = ['tekst', 'kartinka', 'video'] as const;

export function generateStaticParams() {
  return types.map((type) => ({ type }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type } = await params;
  const titles: Record<string, string> = {
    tekst: 'Написать текст — Бизнес-завод AI',
    kartinka: 'Сделать картинку — Бизнес-завод AI',
    video: 'Создать видеозаставку — Бизнес-завод AI',
  };
  return {
    title: titles[type] ?? 'Бизнес-завод AI',
    description:
      'Понятная творческая мастерская: одна задача, один результат, без сложных настроек и обязательной регистрации.',
  };
}

export default async function StudioPage({ params }: PageProps) {
  const { type } = await params;
  if (!types.some((value) => value === type)) notFound();
  return <MiniStudio mode={type as StudioMode} />;
}
