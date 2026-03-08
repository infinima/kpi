import { Link } from "react-router-dom"
import Background from "@/components/layout/Background"
import PrimaryButton from "@/components/ui/PrimaryButton"
import OutlineButton from "@/components/ui/OutlineButton"
import AnimatedText from "@/components/ui/AnimatedText";

export default function NotFoundPage() {
    return (
        <div className="relative min-h-screen overflow-hidden">
            <Background active={true} />

            <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
                <h1 className="text-[clamp(64px,12vw,160px)] leading-none font-bold tracking-tight text-[var(--color-text-main)]">
                    404
                </h1>

                <AnimatedText
                    text={"Похоже, такой страницы не существует, она была перемещена или ссылка неверна."}
                    as={"p"}
                    className={"mt-4 max-w-xl leading-[var(--leading-body)] text-[var(--color-text-secondary)]"}
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
    )
}