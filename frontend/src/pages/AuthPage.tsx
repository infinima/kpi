import {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {motion} from "framer-motion";
import {Eye, EyeOff, LogIn, MailCheck, UserPlus} from "lucide-react";
import Background from "@/components/layout/Background";
import AnimatedText from "@/components/ui/AnimatedText";
import PrimaryButton from "@/components/ui/PrimaryButton";
import OutlineButton from "@/components/ui/OutlineButton";
import {apiPost} from "@/api";
import {useNotifications, useUser} from "@/store";

type AuthMode = "login" | "register";
type RegisterStep = "form" | "confirm";

const inputClassName = `
    w-full rounded-2xl border border-[var(--color-border)]
    bg-[rgba(255,255,255,0.92)] px-4 py-3
    text-[var(--color-text-main)] outline-none
    transition focus:border-[var(--color-primary-light)]
`;

function formatRussianPhone(value: string) {
    const digits = value.replace(/\D/g, "");
    const normalized = digits.startsWith("8")
        ? `7${digits.slice(1, 11)}`
        : digits.startsWith("7")
            ? digits.slice(0, 11)
            : digits.slice(0, 11);

    if (!normalized) {
        return "";
    }

    const part1 = normalized.slice(0, 1);
    const part2 = normalized.slice(1, 4);
    const part3 = normalized.slice(4, 7);
    const part4 = normalized.slice(7, 9);
    const part5 = normalized.slice(9, 11);

    let formatted = `+${part1}`;
    if (part2) formatted += ` (${part2}`;
    if (part2.length === 3) formatted += ")";
    if (part3) formatted += ` ${part3}`;
    if (part4) formatted += `-${part4}`;
    if (part5) formatted += `-${part5}`;

    return formatted;
}

function getRussianPhoneDigits(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 11) {
        return null;
    }

    if (digits.startsWith("7")) {
        return digits;
    }

    if (digits.startsWith("8")) {
        return `7${digits.slice(1)}`;
    }

    return null;
}

export default function AuthPage() {
    const navigate = useNavigate();
    const notify = useNotifications((state) => state.addMessage);
    const loginUser = useUser((state) => state.login);

    const [mode, setMode] = useState<AuthMode>("login");
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [registerLoading, setRegisterLoading] = useState(false);
    const [registerStep, setRegisterStep] = useState<RegisterStep>("form");
    const [confirmCode, setConfirmCode] = useState("");

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
        phone_number: "",
    });

    function navigateAfterAuth() {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }

        navigate("/");
    }

    async function handleLogin() {
        if (!loginForm.email.trim() || !loginForm.password.trim()) {
            notify({type: "warning", text: "Заполните почту и пароль"});
            return;
        }

        try {
            setLoginLoading(true);
            const data = await apiPost<{ token: string }>("auth/login", loginForm, { error: true });
            await loginUser(data.token);
            navigateAfterAuth();
        } finally {
            setLoginLoading(false);
        }
    }

    async function handleRegister() {
        const normalizedPhone = getRussianPhoneDigits(registerForm.phone_number);

        if (
            !registerForm.first_name.trim() ||
            !registerForm.last_name.trim() ||
            !registerForm.email.trim() ||
            !registerForm.password.trim() ||
            !registerForm.phone_number.trim()
        ) {
            notify({type: "warning", text: "Заполните обязательные поля"});
            return;
        }

        if (!normalizedPhone) {
            notify({type: "warning", text: "Введите телефон в формате +7 (800) 555-35-35"});
            return;
        }

        if (registerForm.password !== registerForm.password_confirmation) {
            notify({type: "warning", text: "Пароли не совпадают"});
            return;
        }

        try {
            setRegisterLoading(true);
            await apiPost("auth/register/start", {
                email: registerForm.email,
                password: registerForm.password,
                last_name: registerForm.last_name,
                first_name: registerForm.first_name,
                patronymic: null,
                phone_number: normalizedPhone,
            }, { error: true });
            notify({
                type: "success",
                text: "Код подтверждения отправлен на почту.",
            });
            setRegisterStep("confirm");
        } finally {
            setRegisterLoading(false);
        }
    }

    async function handleRegisterConfirm() {
        if (!confirmCode.trim()) {
            notify({type: "warning", text: "Введите код из письма"});
            return;
        }

        try {
            setRegisterLoading(true);
            const data = await apiPost<{ id: number; token: string }>("auth/register/confirm", {
                email: registerForm.email,
                code: confirmCode,
            }, { error: true });
            await loginUser(data.token);
            navigateAfterAuth();
        } finally {
            setRegisterLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen overflow-hidden">
            <Background active={true}/>

            <div className="relative mx-auto flex min-h-screen max-w-xl items-center px-6 py-16">
                    <motion.section
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: 0.1}}
                        className="w-full rounded-[32px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.88)] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-8"
                    >
                        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[var(--color-background)] p-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setMode("login");
                                    setRegisterStep("form");
                                }}
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

                        <div className="mt-8">
                            <AnimatedText
                                as="h1"
                                text={mode === "login" ? "Вход в аккаунт" : registerStep === "form" ? "Регистрация" : "Подтвердите код"}
                                className="text-3xl font-semibold tracking-tight text-[var(--color-text-main)] sm:text-4xl"
                            />
                            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                                {mode === "login"
                                    ? "Введите email и пароль."
                                    : registerStep === "form"
                                        ? "Заполните данные, затем подтвердите регистрацию кодом из письма."
                                        : `Мы отправили код на ${registerForm.email}.`}
                            </p>
                        </div>

                        {mode === "login" ? (
                            <div className="mt-8 space-y-5">
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
                                {registerStep === "form" ? (
                                    <>
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
                                            <span className="text-sm text-[var(--color-text-secondary)]">Телефон</span>
                                            <input
                                                value={registerForm.phone_number}
                                                onChange={(event) => setRegisterForm((prev) => ({
                                                    ...prev,
                                                    phone_number: formatRussianPhone(event.target.value),
                                                }))}
                                                placeholder="+7 (800) 555-35-35"
                                                className={inputClassName}
                                            />
                                        </label>

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
                                                        placeholder="Минимум 6 символов"
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
                                            loadingText="Отправляем код..."
                                            leftIcon={<MailCheck size={18}/>}
                                            onClick={handleRegister}
                                            className="w-full justify-center"
                                        >
                                            Получить код
                                        </PrimaryButton>
                                    </>
                                ) : (
                                    <>
                                        <label className="block space-y-2">
                                            <span className="text-sm text-[var(--color-text-secondary)]">Код из письма</span>
                                            <input
                                                value={confirmCode}
                                                onChange={(event) => setConfirmCode(event.target.value)}
                                                placeholder="1234"
                                                maxLength={4}
                                                className={`${inputClassName} text-center text-2xl font-semibold tracking-[0.35em]`}
                                            />
                                        </label>

                                        <PrimaryButton
                                            active
                                            loading={registerLoading}
                                            loadingText="Подтверждаем..."
                                            leftIcon={<UserPlus size={18}/>}
                                            onClick={handleRegisterConfirm}
                                            className="w-full justify-center"
                                        >
                                            Завершить регистрацию
                                        </PrimaryButton>

                                        <OutlineButton
                                            active
                                            onClick={() => {
                                                setRegisterStep("form");
                                                setConfirmCode("");
                                            }}
                                            className="w-full justify-center"
                                        >
                                            Изменить данные
                                        </OutlineButton>
                                    </>
                                )}
                            </div>
                        )}
                        <div className="mt-6 flex justify-center">
                            <Link to="/">
                                <OutlineButton active>
                                    Назад на главную
                                </OutlineButton>
                            </Link>
                        </div>
                    </motion.section>
            </div>
        </div>
    );
}
