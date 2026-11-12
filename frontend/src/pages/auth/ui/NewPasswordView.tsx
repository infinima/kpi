import AnimatedText from "@/shared/ui/AnimatedText";
import Background from "@/shared/ui/Background";
import PrimaryButton from "@/shared/ui/PrimaryButton";
import { motion } from "framer-motion";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";
import { inputClassName } from '../model/newPasswordSupport';
import type { useNewPasswordModel } from '../model/useNewPasswordModel';
export function NewPasswordView(props: ReturnType<typeof useNewPasswordModel>) {
    const {
        password,
        setPassword,
        passwordConfirmation,
        setPasswordConfirmation,
        showPassword,
        setShowPassword,
        loading,
        handleSubmit,
    } = props;
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
