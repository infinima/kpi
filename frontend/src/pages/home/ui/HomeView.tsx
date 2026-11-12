import AnimatedText from "@/shared/ui/AnimatedText";
import Background from "@/shared/ui/Background";
import OutlineButton from "@/shared/ui/OutlineButton";
import PrimaryButton from "@/shared/ui/PrimaryButton";
import { motion } from "framer-motion";
import { CalendarDays, ArrowRight, FileText, LogIn, UserPlus } from "lucide-react";
import type { useHomeModel } from "../model/useHomeModel";
import { Link } from "react-router-dom";

function downloadFile(url: string, filename?: string) {
    const link = document.createElement("a");
    link.href = url;
    if (filename) {
        link.download = filename;
    }
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function HomeView({ guest, event, loading, error, retry, registrationUrl }: ReturnType<typeof useHomeModel>) {

    return (
        <div className="relative min-h-screen overflow-hidden">
            <Background active={true} />

            <div className="absolute left-4 right-4 top-5 z-20 flex flex-wrap items-center justify-end gap-2 sm:left-auto sm:right-6">
                {guest ? (
                    <Link to="/auth">
                        <PrimaryButton
                            active={true}
                            leftIcon={<LogIn size={18} />}
                        >
                            Войти / зарегистрироваться
                        </PrimaryButton>
                    </Link>
                ) : (
                    <Link to="/lk">
                        <OutlineButton
                            active={true}
                        >
                            Личный кабинет
                        </OutlineButton>
                    </Link>
                )}
            </div>

            <section className="relative mx-auto w-full max-w-none px-6 pt-28 pb-24 text-center">
                <AnimatedText
                    as="h1"
                    text='Турнир математических игр «кπца»'
                    className="text-4xl md:text-6xl font-semibold tracking-tight text-[var(--color-text-main)]"
                />

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="
            mt-6
            mx-auto
            max-w-2xl
            text-lg
            text-[var(--color-text-secondary)]
          "
                >
                    Ежегодный турнир Физтех-лицея им. П.Л. Капицы объединяет учеников 4–7 классов,
                    математические игры и сильную командную работу.
                </motion.p>

                <div className="mx-auto mt-10 max-w-3xl text-left lg:max-w-5xl 2xl:max-w-6xl">
                    {loading ? <div role="status" className="rounded-3xl border border-[var(--color-border)] bg-white/80 p-8">Загружаем ближайший турнир…</div> : error ? (
                        <div role="alert" className="rounded-3xl border border-[var(--color-border)] bg-white/80 p-8">Не удалось загрузить главное мероприятие. <button onClick={retry} className="underline">Повторить</button></div>
                    ) : event ? (
                        <article className="overflow-hidden rounded-[32px] border border-[var(--color-primary-light)] bg-white/90 shadow-[0_20px_60px_rgba(14,116,144,0.10)]">
                            <div className="p-6 sm:p-9">
                                <p className="text-sm font-medium text-[var(--color-primary)]">{event.status === "REGISTRATION_OPEN" ? "Сейчас открыта регистрация на" : "Главное мероприятие"}</p>
                                <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{event.name}</h2>
                                <p className="mt-4 flex items-center gap-2 text-[var(--color-text-secondary)]"><CalendarDays size={18} /><time dateTime={event.date}>{new Date(`${event.date}T12:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</time></p>
                                <div className="mt-7 flex flex-wrap items-center gap-3">
                                    {event.status === "REGISTRATION_OPEN" && <Link to={registrationUrl}><PrimaryButton active leftIcon={<UserPlus size={18} />}>Зарегистрироваться</PrimaryButton></Link>}
                                    <Link to={`/events/${event.id}/location`} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-[var(--color-primary)] hover:bg-slate-50">Площадки и лиги <ArrowRight size={16} /></Link>
                                </div>
                                {event.status !== "REGISTRATION_OPEN" && <p className="mt-4 text-sm text-[var(--color-text-secondary)]">{event.status === "ANNOUNCED" ? "Регистрация скоро откроется." : "Регистрация на это мероприятие закрыта."}</p>}
                            </div>
                        </article>
                    ) : <p className="rounded-3xl border border-[var(--color-border)] bg-white/80 p-8 text-center">Скоро здесь появится новое мероприятие.</p>}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap"
                >
                    <PrimaryButton
                        active={true}
                        leftIcon={<FileText size={18} />}
                        onClick={() => downloadFile("/rules.pdf", "Правила")}
                    >
                        Открыть правила
                    </PrimaryButton>
                    <PrimaryButton
                        active={true}
                        leftIcon={<FileText size={18} />}
                        onClick={() => downloadFile("/Информационное_сообщение.pdf", "Информационное_сообщение.pdf")}
                    >
                        Информационное сообщение
                    </PrimaryButton>
                    <Link to="/events">
                        <OutlineButton active leftIcon={<ArrowRight size={18} />}>
                            Архив
                        </OutlineButton>
                    </Link>
                </motion.div>
            </section>

        </div>
    );
}
