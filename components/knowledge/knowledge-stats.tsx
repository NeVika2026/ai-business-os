import type { KnowledgeStats } from '@/types/knowledge';

type KnowledgeStatsProps = {
  stats: KnowledgeStats;
};

const STAT_CARDS: { key: keyof KnowledgeStats; label: string }[] = [
  { key: 'totalSources', label: 'Всего источников' },
  { key: 'completedSources', label: 'Обработано' },
  { key: 'processingSources', label: 'В обработке' },
  { key: 'failedSources', label: 'Ошибки' },
  { key: 'totalDocuments', label: 'Всего документов' },
  { key: 'totalChunks', label: 'Всего чанков' },
];

export function KnowledgeStats({ stats }: KnowledgeStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {STAT_CARDS.map((card) => (
        <article
          key={card.key}
          className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4"
        >
          <p className="text-sm text-[var(--text-secondary)]">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
            {stats[card.key]}
          </p>
        </article>
      ))}
    </div>
  );
}
