import type { ProjectReplay } from '@/utils/workspace/project-replay';

type ProjectReplayPanelProps = {
  replay: ProjectReplay;
  onClose: () => void;
};

export function ProjectReplayPanel({ replay, onClose }: ProjectReplayPanelProps) {
  return (
    <div className="osa-project-replay min-h-[calc(100vh-8rem)] bg-white px-4 pb-20 pt-8 sm:px-8">
      <header className="mx-auto flex max-w-[640px] items-start justify-between gap-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Project Replay
          </p>
          <h1 className="mt-3 text-[clamp(1.75rem,3vw,2.25rem)] font-medium leading-[1.15] tracking-[-0.03em] text-[var(--text-primary)]">
            {replay.projectTitle}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
            История проекта как последовательность решений.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full px-4 py-2 text-[14px] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
        >
          Закрыть
        </button>
      </header>

      <div className="osa-project-replay-story mx-auto mt-16 max-w-[640px]">
        {replay.isEmpty ? (
          <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
            История проекта пока пуста. События появятся по мере работы OSA.
          </p>
        ) : (
          <ol className="space-y-0">
            {replay.scenes.map((scene, index) => (
              <li key={scene.id} className="osa-replay-scene">
                <div className="flex gap-5 py-8">
                  <div className="w-12 shrink-0 pt-0.5 text-right">
                    <p className="text-[13px] tabular-nums text-[var(--text-tertiary)]">{scene.timeLabel}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-0.5 w-5 shrink-0 text-center text-[15px] text-[var(--text-secondary)]"
                        aria-hidden="true"
                      >
                        {scene.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[16px] leading-[1.6] text-[var(--text-primary)]">{scene.description}</p>
                        <p className="mt-2 text-[12px] tracking-[0.04em] text-[var(--text-tertiary)]">
                          {scene.sourceLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {index < replay.scenes.length - 1 ? (
                  <div className="ml-[4.75rem] pb-2 text-[13px] text-[var(--text-tertiary)]" aria-hidden="true">
                    ↓
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
