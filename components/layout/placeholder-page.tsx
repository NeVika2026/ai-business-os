type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="mx-auto max-w-3xl space-y-2">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{title}</h1>
      <p className="text-sm text-[var(--text-secondary)]">{description}</p>
    </section>
  );
}
