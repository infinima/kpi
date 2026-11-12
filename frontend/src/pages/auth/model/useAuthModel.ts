import { authApi } from "@/entities/auth/api/authApi";
import { useUser } from "@/entities/session/model/session";
import { useNotifications } from "@/shared/model/notifications";
import { useState } from "react";
import { safeReturnTo } from "@/shared/lib/navigation";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthMode, RegisterStep, getRussianPhoneDigits, isValidEmail } from './authSupport';
export function useAuthModel({ adminOnly = false }: { adminOnly?: boolean } = {}) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

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
        patronymic: "",
        email: "",
        password: "",
        password_confirmation: "",
        phone_number: "",
    });

    const [acceptedPersonalData, setAcceptedPersonalData] = useState(false);

    function navigateAfterAuth() {
        const destination = safeReturnTo(searchParams.get("returnTo"));
        if (destination) { navigate(destination, { replace: true }); return; }
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }

        navigate("/");
    }

    async function handleLogin() {
        if (!loginForm.email.trim() || !loginForm.password.trim()) {
            notify({ type: "warning", text: "Заполните почту и пароль" });
            return;
        }

        if (!isValidEmail(loginForm.email)) {
            notify({ type: "warning", text: "Введите корректный email" });
            return;
        }

        try {
            setLoginLoading(true);
            const data = await authApi.login({
                ...loginForm,
                email: loginForm.email.trim(),
            });
            await loginUser(data.token);
            navigateAfterAuth();
        } finally {
            setLoginLoading(false);
        }
    }

    async function handleRegister() {
        if (adminOnly) return;
        const normalizedPhone = getRussianPhoneDigits(registerForm.phone_number);
        const normalizedPatronymic = registerForm.patronymic.trim();

        if (
            !registerForm.first_name.trim() ||
            !registerForm.last_name.trim() ||
            !registerForm.email.trim() ||
            !registerForm.password.trim() ||
            !registerForm.phone_number.trim()
        ) {
            notify({ type: "warning", text: "Заполните обязательные поля" });
            return;
        }

        if (!acceptedPersonalData) {
            notify({ type: "warning", text: "Подтвердите согласие на обработку персональных данных" });
            return;
        }

        if (!normalizedPhone) {
            notify({ type: "warning", text: "Введите телефон в формате +7 (800) 555-35-35" });
            return;
        }

        if (!isValidEmail(registerForm.email)) {
            notify({ type: "warning", text: "Введите корректный email" });
            return;
        }

        if (registerForm.password.length < 6) {
            notify({ type: "warning", text: "Пароль должен содержать минимум 6 символов" });
            return;
        }

        if (registerForm.password !== registerForm.password_confirmation) {
            notify({ type: "warning", text: "Пароли не совпадают" });
            return;
        }

        try {
            setRegisterLoading(true);
            await authApi.startRegistration({
                email: registerForm.email.trim(),
                password: registerForm.password,
                last_name: registerForm.last_name,
                first_name: registerForm.first_name,
                patronymic: normalizedPatronymic || null,
                phone_number: normalizedPhone,
            });
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
        if (adminOnly) return;
        if (!confirmCode.trim()) {
            notify({ type: "warning", text: "Введите код из письма" });
            return;
        }

        try {
            setRegisterLoading(true);
            const data = await authApi.confirmRegistration({
                email: registerForm.email.trim(),
                code: confirmCode,
            });
            await loginUser(data.token);
            navigateAfterAuth();
        } finally {
            setRegisterLoading(false);
        }
    }
    return {
        adminOnly,
        navigate,
        notify,
        loginUser,
        mode,
        setMode,
        showLoginPassword,
        setShowLoginPassword,
        showRegisterPassword,
        setShowRegisterPassword,
        loginLoading,
        setLoginLoading,
        registerLoading,
        setRegisterLoading,
        registerStep,
        setRegisterStep,
        confirmCode,
        setConfirmCode,
        loginForm,
        setLoginForm,
        registerForm,
        setRegisterForm,
        acceptedPersonalData,
        setAcceptedPersonalData,
        navigateAfterAuth,
        handleLogin,
        handleRegister,
        handleRegisterConfirm,
    };
}
