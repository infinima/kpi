import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { apiPost } from "@/api";
import { useUser, useUI, useNotifications } from "@/store";

export function LoginModal() {
    const { loginModalOpen, closeLoginModal } = useUI();
    const loginUser = useUser((s) => s.login);
    const notify = useNotifications((s) => s.addMessage);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!loginModalOpen) return null;

    async function handleLogin() {
        if (!email.trim()) {
            notify({ type: "warning", text: "Введите почту" });
            return;
        }

        if (!password.trim()) {
            notify({ type: "warning", text: "Введите пароль" });
            return;
        }

        try {
            setLoading(true);

            const data = await apiPost("auth/login", {
                email,
                password,
            });

            loginUser(data.token);

            await useUser.getState().fetchUser();
            closeLoginModal();
            notify({
                type: "success",
                text: "Вы успешно вошли",
            });
            setPassword("");
            setEmail("");
        } catch (err) {
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">

            <div className="
                w-full max-w-md p-6 rounded-xl
                bg-surface dark:bg-dark-surface
                border border-border dark:border-dark-border
                shadow-card space-y-6
            ">
                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <h2 className="text-h2 font-semibold">Вход</h2>
                    <button onClick={closeLoginModal}>
                        <X className="text-text-secondary dark:text-dark-text-secondary" />
                    </button>
                </div>

                {/* EMAIL */}
                <div className="space-y-2">
                    <label className="text-sm text-text-secondary dark:text-dark-text-secondary">
                        Почта
                    </label>

                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@mail.com"
                        className="
                            w-full px-3 py-2 rounded-lg
                            bg-surface dark:bg-dark-surface
                            border border-border dark:border-dark-border
                        "
                    />
                </div>

                {/* PASSWORD */}
                <div className="space-y-2">
                    <label className="text-sm text-text-secondary dark:text-dark-text-secondary">
                        Пароль
                    </label>

                    <div className="relative">
                        <input
                            type={showPass ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Введите пароль"
                            className="
                                w-full px-3 py-2 rounded-lg
                                bg-surface dark:bg-dark-surface
                                border border-border dark:border-dark-border
                                pr-10
                            "
                        />

                        <button
                            type="button"
                            onClick={() => setShowPass((s) => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70"
                        >
                            {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                {/* LOGIN BUTTON */}
                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="
                        w-full py-2 rounded-lg text-white font-medium
                        bg-primary hover:bg-primary-dark
                        disabled:opacity-50
                    "
                >
                    {loading ? "Входим..." : "Войти"}
                </button>
            </div>
        </div>
    );
}