import AnimatedText from "@/shared/ui/AnimatedText";
import Background from "@/shared/ui/Background";
import OutlineButton from "@/shared/ui/OutlineButton";
import PrimaryButton from "@/shared/ui/PrimaryButton";
import { Link } from "react-router-dom";

type NotReadyPageProps = {
    pageName: string;
};

export default function NotReadyPage({ pageName }: NotReadyPageProps) {
    return (
        <div className="relative min-h-screen overflow-hidden">
            <Background active={true} />

            <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
                <h1 className="text-[clamp(40px,8vw,88px)] leading-none font-bold tracking-tight text-[var(--color-text-main)]">
                    {pageName}
                </h1>

                <p className="mt-4 text-[var(--color-primary)] text-lg font-semibold">
                    В разработке
                </p>

                <AnimatedText
                    text={`Страница "${pageName}" ещё не готова. Мы уже работаем над ней.`}
                    as="p"
                    className="mt-4 max-w-xl leading-[var(--leading-body)] text-[var(--color-text-secondary)]"
                    speed={20}
                />

                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Link to="/">
                        <PrimaryButton active={true}>
                            На главную
                        </PrimaryButton>
                    </Link>

                    <OutlineButton
                        active={true}
                        onClick={() => window.history.back()}
                    >
                        Назад
                    </OutlineButton>
                </div>
            </main>
        </div>
    );
}
