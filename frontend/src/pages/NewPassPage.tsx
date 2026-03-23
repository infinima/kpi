import { useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import Background from "@/components/layout/Background";
import AnimatedText from "@/components/ui/AnimatedText";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { apiPost } from "@/api";
import { useNotifications } from "@/store";

const RESET_PASSWORD_PATH = "auth/password-reset/confirm";

const inputClassName = `
    w-full rounded-2xl border border-[var(--color-border)]
    bg-[rgba(255,255,255,0.92)] px-4 py-3
    text-[var(--color-text-main)] outline-none
    transition focus:border-[var(--color-primary-light)]
`;

export default function NewPassPage() {
    const navigate = useNavigate();
    const notify = useNotifications((state) => state.addMessage);
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const key = searchParams.get("key") ?? "";

    async function handleSubmit() {
        if (!password.trim() || !passwordConfirmation.trim()) {
            notify({ type: "warning", text: "Заполните оба поля пароля" });
            return;
        }

        if (password.length < 6) {
            notify({ type: "warning", text: "Пароль должен содержать минимум 6 символов" });
            return;
        }

        if (password !== passwordConfirmation) {
            notify({ type: "warning", text: "Пароли не совпадают" });
            return;
        }

        try {
            setLoading(true);
            await apiPost(RESET_PASSWORD_PATH, {
                key,
                password,
            }, { error: true });
            notify({
                type: "success",
                text: "Пароль обновлен",
            });
            navigate("/");
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
                        text="Новый пароль"
                        className="text-3xl font-semibold tracking-tight text-[var(--color-text-main)] sm:text-4xl"
                    />
                    <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                        Напишите сюда пароли.
                    </p>

                    <div className="mt-8 space-y-5">
                        <label className="block space-y-2">
                            <span className="text-sm text-[var(--color-text-secondary)]">Новый пароль</span>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Введите новый пароль"
                                    className={`${inputClassName} pr-12`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </label>

                        <label className="block space-y-2">
                            <span className="text-sm text-[var(--color-text-secondary)]">Подтверждение</span>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={passwordConfirmation}
                                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                                    placeholder="Повторите новый пароль"
                                    className={`${inputClassName} pr-12`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </label>

                        <PrimaryButton
                            active
                            loading={loading}
                            loadingText="Сбрасываем..."
                            leftIcon={<KeyRound size={18} />}
                            onClick={handleSubmit}
                            className="w-full justify-center"
                        >
                            Сбросить пароль
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
