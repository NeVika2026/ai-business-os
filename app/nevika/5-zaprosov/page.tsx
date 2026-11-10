import type { Metadata } from 'next';
import { NevikaPrompts } from './prompts';

export const metadata: Metadata = {
  title: '5 запросов ChatGPT бесплатно | НеВика',
  description: 'Скопируйте пять практических запросов ChatGPT для бизнеса, продаж, Reels и планирования.',
  alternates: { canonical: '/nevika/5-zaprosov' },
};

export default function FiveNevikaPromptsPage() {
  return <NevikaPrompts />;
}
