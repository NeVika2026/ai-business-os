type OrbitMarkSize = 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<OrbitMarkSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-20 w-20',
};

type OrbitMarkProps = {
  size?: OrbitMarkSize;
  className?: string;
  breathe?: boolean;
};

export function OrbitMark({ size = 'md', className = '', breathe = true }: OrbitMarkProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={`text-[var(--accent)] ${SIZE_CLASS[size]} ${
        breathe ? 'orbit-breathe-slow' : ''
      } ${className}`.trim()}
      aria-hidden="true"
    >
      <circle
        cx="40"
        cy="40"
        r="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="118 58"
        strokeLinecap="round"
        transform="rotate(-35 40 40)"
      />
      <path
        d="M 54 26 A 20 20 0 0 1 60 46"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="40" cy="40" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
