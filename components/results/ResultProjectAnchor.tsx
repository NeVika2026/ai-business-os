import Link from 'next/link';

type ResultProjectAnchorProps = {
  projectName: string;
  projectHref: string;
};

export function ResultProjectAnchor({ projectName, projectHref }: ResultProjectAnchorProps) {
  return (
    <Link
      href={projectHref}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-0)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      <span aria-hidden="true">📁</span>
      {projectName}
    </Link>
  );
}
