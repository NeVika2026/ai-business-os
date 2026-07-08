import { HomeProcessSteps } from '@/components/home/HomeProcessSteps';

type FirstExperienceResultPanelProps = {
  label?: string;
  content: string;
  showCompletedSteps?: boolean;
};

export function FirstExperienceResultPanel({
  label = 'Первый результат',
  content,
  showCompletedSteps = true,
}: FirstExperienceResultPanelProps) {
  return (
    <section className="space-y-8" aria-label={label}>
      {showCompletedSteps ? <HomeProcessSteps visibleStepCount={4} allComplete /> : null}

      <div className="first-experience-result-card space-y-5">
        <div className="flex items-center gap-3">
          <span className="first-experience-ready-badge">Готово</span>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            {label}
          </p>
        </div>

        <div className="whitespace-pre-wrap text-[clamp(1rem,2vw,1.0625rem)] leading-[1.7] text-[var(--text-primary)]">
          {content}
        </div>
      </div>
    </section>
  );
}
