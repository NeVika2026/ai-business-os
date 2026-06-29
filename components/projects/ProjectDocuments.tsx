import Link from 'next/link';

import { formatProjectDate } from '@/utils/projects/project-mappers';
import type { ProjectDocument } from '@/utils/projects/project-types';

type ProjectDocumentsProps = {
  documents: ProjectDocument[];
  totalCount: number;
  projectId: string;
};

export function ProjectDocuments({ documents, totalCount, projectId }: ProjectDocumentsProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Documents</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{totalCount} documents</p>
        </div>
        <Link
          href={`/knowledge?project=${projectId}`}
          className="rounded-xl border border-[var(--border-subtle)] px-3 py-1.5 text-sm"
        >
          Upload placeholder
        </Link>
      </header>

      {documents.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No documents linked to this project.</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((document) => (
            <li key={document.id}>
              <Link
                href={document.href}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 hover:border-[var(--accent)]"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{document.title}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {document.type} · {document.status}
                  </p>
                </div>
                <time className="text-xs text-[var(--text-secondary)]">
                  {formatProjectDate(document.createdAt)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
