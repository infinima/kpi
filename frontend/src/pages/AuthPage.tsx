import {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {motion} from "framer-motion";
import {ArrowRight, Eye, EyeOff, LogIn, Sparkles, UserPlus} from "lucide-react";
import Background from "@/components/layout/Background";
import AnimatedText from "@/components/ui/AnimatedText";
import PrimaryButton from "@/components/ui/PrimaryButton";
import OutlineButton from "@/components/ui/OutlineButton";
import {apiPost} from "@/api";
import {useNotifications, useUser} from "@/store";

type AuthMode = "login" | "register";

const inputClassName = `
    w-full rounded-2xl border border-[var(--color-border)]
    bg-[rgba(255,255,255,0.92)] px-4 py-3
    text-[var(--color-text-main)] outline-none
    transition focus:border-[var(--color-primary-light)]
`;

export default function AuthPage() {
    const navigate = useNavigate();
    const notify = useNotifications((state) => state.addMessage);
    const loginUser = useUser((state) => state.login);

    const [mode, setMode] = useState<AuthMode>("login");
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [registerLoading, setRegisterLoading] = useState(false);

    const [loginForm, setLoginForm] = useState({
        email: "",
        password: "",
    });

    const [registerForm, setRegisterForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    async function handleLogin() {
        if (!loginForm.email.trim() || !loginForm.password.trim()) {
            notify({type: "warning", text: "Заполните почту и пароль"});
            return;
        }

        try {
            setLoginLoading(true);
            const data = await apiPost<{ token: string }>("auth/login", loginForm);
            await loginUser(data.token);
            navigate("/example");
        } finally {
            setLoginLoading(false);
        }
    }

    async function handleRegister() {
        if (
            !registerForm.first_name.trim() ||
            !registerForm.last_name.trim() ||
            !registerForm.email.trim() ||
            !registerForm.password.trim()
        ) {
            notify({type: "warning", text: "Заполните обязательные поля"});
            return;
        }

        if (registerForm.password !== registerForm.password_confirmation) {
            notify({type: "warning", text: "Пароли не совпадают"});
            return;
        }

        try {
            setRegisterLoading(true);

            const response = await fetch(`${window.location.origin}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(registerForm),
            });

            if (response.status === 404) {
                notify({
                    type: "warning",
                    text: "Регистрация пока не поддерживается сервером. Фронтенд готов, backend endpoint ещё нужен.",
                });
                return;
            }

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.error?.message || "Не удалось выполнить регистрацию");
            }

            if (data?.token) {
                await loginUser(data.token);
                navigate("/example");
                return;
            }

            notify({
                type: "success",
                text: "Регистрация завершена. Теперь можно войти.",
            });
            setMode("login");
            setLoginForm((prev) => ({...prev, email: registerForm.email}));
        } catch (error) {
            notify({
                type: "error",
                text: error instanceof Error ? error.message : "Ошибка регистрации",
            });
        } finally {
            setRegisterLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen overflow-hidden">
            <Background active={true}/>

            <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16">
                <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                    <motion.section
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        className="flex flex-col justify-center"
                    >
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] px-4 py-2 text-sm text-[var(--color-text-secondary)] backdrop-blur-sm">
                            <Sparkles size={16}/>
                            Новый auth-flow
                        </div>

                        <AnimatedText
                            as="h1"
                            text="Вход и регистрация в системе турнира"
                            className="mt-6 text-4xl font-semibold tracking-tight text-[var(--color-text-main)] md:text-6xl"
                        />

                        <motion.p
                            initial={{opacity: 0, y: 18}}
                            animate={{opacity: 1, y: 0}}
                            transition={{delay: 0.2}}
                            className="mt-6 max-w-2xl text-lg text-[var(--color-text-secondary)]"
                        >
                            Отдельная красивая страница вместо модалки: крупная типографика,
                            чистая форма и понятный поток для входа и будущей регистрации.
                        </motion.p>

                        <div className="mt-10 grid gap-4 sm:grid-cols-2">
                            {[
                                "Рабочий вход через auth/login",
                                "Регистрация готова под auth/register",
                                "Сохранение токена в localStorage",
                                "Быстрый переход к demo-странице",
                            ].map((item, index) => (
                                <motion.div
                                    key={item}
                                    initial={{opacity: 0, y: 16}}
                                    animate={{opacity: 1, y: 0}}
                                    transition={{delay: 0.15 + index * 0.08}}
                                    className="rounded-2xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.72)] p-5 backdrop-blur-sm"
                                >
                                    <div className="text-sm font-medium text-[var(--color-text-main)]">
                                        {item}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                            <Link to="/">
                                <OutlineButton active>
                                    Назад на главную
                                </OutlineButton>
                            </Link>
                            <Link to="/example">
                                <PrimaryButton active rightIcon={<ArrowRight size={18}/>}>
                                    Открыть demo
                                </PrimaryButton>
                            </Link>
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: 0.1}}
                        className="rounded-[32px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-8"
                    >
                        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[var(--color-background)] p-1">
                            <button
                                type="button"
                                onClick={() => setMode("login")}
                                className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${mode === "login" ? "bg-[var(--color-surface)] text-[var(--color-text-main)] shadow-sm" : "text-[var(--color-text-secondary)]"}`}
                            >
                                Вход
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode("register")}
                                className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${mode === "register" ? "bg-[var(--color-surface)] text-[var(--color-text-main)] shadow-sm" : "text-[var(--color-text-secondary)]"}`}
                            >
                                Регистрация
                            </button>
                        </div>

                        {mode === "login" ? (
                            <div className="mt-8 space-y-5">
                                <div>
                                    <h2 className="text-2xl font-semibold text-[var(--color-text-main)]">
                                        Войти в аккаунт
                                    </h2>
                                    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                                        Используйте существующие учётные данные системы.
                                    </p>
                                </div>

                                <label className="block space-y-2">
                                    <span className="text-sm text-[var(--color-text-secondary)]">Email</span>
                                    <input
                                        type="email"
                                        value={loginForm.email}
                                        onChange={(event) => setLoginForm((prev) => ({...prev, email: event.target.value}))}
                                        placeholder="team@kapitsa.ru"
                                        className={inputClassName}
                                    />
                                </label>

                                <label className="block space-y-2">
                                    <span className="text-sm text-[var(--color-text-secondary)]">Пароль</span>
                                    <div className="relative">
                                        <input
                                            type={showLoginPassword ? "text" : "password"}
                                            value={loginForm.password}
                                            onChange={(event) => setLoginForm((prev) => ({...prev, password: event.target.value}))}
                                            placeholder="Введите пароль"
                                            className={`${inputClassName} pr-12`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowLoginPassword((prev) => !prev)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
                                        >
                                            {showLoginPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                        </button>
                                    </div>
                                </label>

                                <PrimaryButton
                                    active
                                    loading={loginLoading}
                                    loadingText="Входим..."
                                    leftIcon={<LogIn size={18}/>}
                                    onClick={handleLogin}
                                    className="w-full justify-center"
                                >
                                    Войти
                                </PrimaryButton>
                            </div>
                        ) : (
                            <div className="mt-8 space-y-5">
                                <div>
                                    <h2 className="text-2xl font-semibold text-[var(--color-text-main)]">
                                        Создать аккаунт
                                    </h2>
                                    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                                        Интерфейс уже готов. Если backend ещё не поддерживает регистрацию, страница покажет это явно.
                                    </p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <label className="block space-y-2">
                                        <span className="text-sm text-[var(--color-text-secondary)]">Имя</span>
                                        <input
                                            value={registerForm.first_name}
                                            onChange={(event) => setRegisterForm((prev) => ({...prev, first_name: event.target.value}))}
                                            placeholder="Анна"
                                            className={inputClassName}
                                        />
                                    </label>

                                    <label className="block space-y-2">
                                        <span className="text-sm text-[var(--color-text-secondary)]">Фамилия</span>
                                        <input
                                            value={registerForm.last_name}
                                            onChange={(event) => setRegisterForm((prev) => ({...prev, last_name: event.target.value}))}
                                            placeholder="Иванова"
                                            className={inputClassName}
                                        />
                                    </label>
                                </div>

                                <label className="block space-y-2">
                                    <span className="text-sm text-[var(--color-text-secondary)]">Email</span>
                                    <input
                                        type="email"
                                        value={registerForm.email}
                                        onChange={(event) => setRegisterForm((prev) => ({...prev, email: event.target.value}))}
                                        placeholder="new-user@kapitsa.ru"
                                        className={inputClassName}
                                    />
                                </label>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <label className="block space-y-2">
                                        <span className="text-sm text-[var(--color-text-secondary)]">Пароль</span>
                                        <div className="relative">
                                            <input
                                                type={showRegisterPassword ? "text" : "password"}
                                                value={registerForm.password}
                                                onChange={(event) => setRegisterForm((prev) => ({...prev, password: event.target.value}))}
                                                placeholder="Минимум 8 символов"
                                                className={`${inputClassName} pr-12`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowRegisterPassword((prev) => !prev)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
                                            >
                                                {showRegisterPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                            </button>
                                        </div>
                                    </label>

                                    <label className="block space-y-2">
                                        <span className="text-sm text-[var(--color-text-secondary)]">Повтор пароля</span>
                                        <input
                                            type={showRegisterPassword ? "text" : "password"}
                                            value={registerForm.password_confirmation}
                                            onChange={(event) => setRegisterForm((prev) => ({...prev, password_confirmation: event.target.value}))}
                                            placeholder="Повторите пароль"
                                            className={inputClassName}
                                        />
                                    </label>
                                </div>

                                <PrimaryButton
                                    active
                                    loading={registerLoading}
                                    loadingText="Создаём..."
                                    leftIcon={<UserPlus size={18}/>}
                                    onClick={handleRegister}
                                    className="w-full justify-center"
                                >
                                    Зарегистрироваться
                                </PrimaryButton>
                            </div>
                        )}
                    </motion.section>
                </div>
            </div>
        </div>
    );
}
