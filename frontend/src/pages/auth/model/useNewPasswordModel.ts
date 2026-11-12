import { authApi } from "@/entities/auth/api/authApi";
import { useNotifications } from "@/shared/model/notifications";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
export function useNewPasswordModel() {
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
            await authApi.confirmPasswordReset({
                key,
                password,
            });
            notify({
                type: "success",
                text: "Пароль обновлен",
            });
            navigate("/");
        } finally {
            setLoading(false);
        }
    }
    return {
        navigate,
        notify,
        searchParams,
        password,
        setPassword,
        passwordConfirmation,
        setPasswordConfirmation,
        showPassword,
        setShowPassword,
        loading,
        setLoading,
        key,
        handleSubmit,
    };
}
