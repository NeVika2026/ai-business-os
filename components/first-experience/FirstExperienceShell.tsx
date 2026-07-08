import { OrbitMark } from '@/components/brand/OrbitMark';

type FirstExperienceShellProps = {
  children: React.ReactNode;
  presence?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  showMark?: boolean;
  markBreathe?: boolean;
  className?: string;
};

export function FirstExperienceShell({
  children,
  presence,
  eyebrow,
  title,
  subtitle,
  showMark = true,
  markBreathe = false,
  className = '',
}: FirstExperienceShellProps) {
  const hasHeader = Boolean(showMark || presence || eyebrow || title || subtitle);

  return (
    <main
      className={`first-experience-ambient flex min-h-full flex-1 flex-col items-center px-6 py-20 sm:py-28 ${className}`.trim()}
    >
      <div className="wow-fade-in mx-auto w-full max-w-[680px]">
        {hasHeader ? (
          <header className="mb-14 space-y-6 sm:mb-16">
            {showMark || presence || eyebrow ? (
              <div className="osa-presence-row flex items-start gap-4">
                {showMark ? (
                  <OrbitMark size="sm" breathe={markBreathe} className="osa-presence-mark text-[var(--accent)]" />
                ) : null}
                {presence || eyebrow ? (
                  <div className={`space-y-2 ${showMark ? 'pt-0.5' : ''}`}>
                    {presence ? (
                      <p className="osa-presence-greeting text-[15px] leading-relaxed text-[var(--text-secondary)]">
                        {presence}
                      </p>
                    ) : null}
                    {eyebrow ? <p className="text-[14px] text-[var(--text-tertiary)]">{eyebrow}</p> : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {title ? (
              <h1 className="max-w-[16ch] text-[clamp(2.1rem,5vw,2.9rem)] font-normal leading-[1.08] tracking-[-0.03em] text-[var(--text-primary)]">
                {title}
              </h1>
            ) : null}

            {subtitle ? (
              <p className="max-w-[40ch] text-[clamp(1.02rem,2vw,1.125rem)] leading-[1.75] text-[var(--text-secondary)]">
                {subtitle}
              </p>
            ) : null}
          </header>
        ) : null}

        {children}
      </div>
    </main>
  );
}
