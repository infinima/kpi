type EventPlaceholderPageProps = {
    title: string;
    description?: string;
};

export function EventPlaceholderPage({
    title,
    description = "Раздел ещё не реализован.",
}: EventPlaceholderPageProps) {
    return (
        <section className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] px-6 py-8">
            <div className="text-3xl font-semibold tracking-tight text-[var(--color-text-main)]">
                {title}
            </div>
            <div className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
                {description}
            </div>
        </section>
    );
}
