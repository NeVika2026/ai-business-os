'use client';

type OsaSkillModeLineProps = {
  label: string;
};

export function OsaSkillModeLine({ label }: OsaSkillModeLineProps) {
  return (
    <p className="osa-skill-mode-line" aria-live="polite">
      {label}
    </p>
  );
}
