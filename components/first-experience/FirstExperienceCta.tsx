import Link from 'next/link';

type FirstExperiencePrimaryCtaProps = {
  href?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
};

export function FirstExperiencePrimaryCta({
  href,
  type = 'button',
  disabled,
  onClick,
  children,
}: FirstExperiencePrimaryCtaProps) {
  const className =
    'first-experience-primary inline-flex items-center justify-center rounded-full px-8 py-3.5 text-[15px] font-medium text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-0)] disabled:cursor-not-allowed disabled:opacity-50';

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={className}>
      {children}
    </button>
  );
}

type FirstExperienceSecondaryCtaProps = {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
};

export function FirstExperienceSecondaryCta({ href, onClick, children }: FirstExperienceSecondaryCtaProps) {
  const className =
    'first-experience-secondary inline-flex items-center justify-center rounded-full px-6 py-3 text-[15px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-0)]';

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}
