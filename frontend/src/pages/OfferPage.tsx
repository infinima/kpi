import Background from "@/components/layout/Background";
import AnimatedText from "@/components/ui/AnimatedText";

export default function OfferPage() {
    return (
        <div className="relative min-h-screen overflow-hidden">
            <Background active />

            <main className="relative mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
                <div className="w-full rounded-[36px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.88)] p-8 shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-10">
                    <AnimatedText
                        as="h1"
                        text="Оферта"
                        className="text-4xl font-semibold tracking-tight text-[var(--color-text-main)] sm:text-5xl"
                    />

                    <p className="mt-6 text-base leading-7 text-[var(--color-text-secondary)]">
                        Здесь будет размещён текст оферты. Пока это заглушка для будущего юридического текста.
                    </p>
                </div>
            </main>
        </div>
    );
}
