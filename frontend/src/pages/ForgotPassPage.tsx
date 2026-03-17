import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MailCheck } from "lucide-react";
import Background from "@/components/layout/Background";
import AnimatedText from "@/components/ui/AnimatedText";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { apiPost } from "@/api";
import { useNotifications } from "@/store";

const FORGOT_PASSWORD_PATH = "auth/password-reset/start";

const inputClassName = `
    w-full rounded-2xl border border-[var(--color-border)]
    bg-[rgba(255,255,255,0.92)] px-4 py-3
    text-[var(--color-text-main)] outline-none
    transition focus:border-[var(--color-primary-light)]
`;

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function ForgotPassPage() {
    const notify = useNotifications((state) => state.addMessage);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        const normalizedEmail = email.trim();

        if (!normalizedEmail) {
            notify({ type: "warning", text: "Введите email" });
            return;
        }

        if (!isValidEmail(normalizedEmail)) {
            notify({ type: "warning", text: "Введите корректный email" });
            return;
        }

        try {
            setLoading(true);
            await apiPost(FORGOT_PASSWORD_PATH, {
                email: normalizedEmail,
            }, { error: true });
            notify({
                type: "success",
                text: "Письмо для восстановления отправлено",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen overflow-hidden">
            <Background active={true} />

            <div className="relative mx-auto flex min-h-screen max-w-xl items-center px-6 py-16">
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="w-full rounded-[32px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.88)] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-8"
                >
                    <AnimatedText
                        as="h1"
                        text="Забыли пароль"
                        className="text-3xl font-semibold tracking-tight text-[var(--color-text-main)] sm:text-4xl"
                    />
                    <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                        Введите почту при регистрации и ждите письмо на нее.
                    </p>

                    <div className="mt-8 space-y-5">
                        <label className="block space-y-2">
                            <span className="text-sm text-[var(--color-text-secondary)]">Email</span>
                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="team@kapitsa.ru"
                                className={inputClassName}
                            />
                        </label>

                        <PrimaryButton
                            active
                            loading={loading}
                            loadingText="Отправляем..."
                            leftIcon={<MailCheck size={18} />}
                            onClick={handleSubmit}
                            className="w-full justify-center"
                        >
                            Отправить
                        </PrimaryButton>

                        <Link
                            to="/auth"
                            className="inline-flex w-full items-center justify-center rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 font-medium text-[var(--color-text-main)] transition hover:scale-[1.02] hover:border-[var(--color-primary-light)] hover:bg-[var(--color-hover)] active:scale-[0.98]"
                        >
                            Вернуться ко входу
                        </Link>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}
