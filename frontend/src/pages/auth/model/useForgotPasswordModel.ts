import { authApi } from "@/entities/auth/api/authApi";
import { useNotifications } from "@/shared/model/notifications";
import { useState } from "react";
import { isValidEmail } from './forgotPasswordSupport';
export function useForgotPasswordModel() {
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
            await authApi.startPasswordReset({
                email: normalizedEmail,
            });
            notify({
                type: "success",
                text: "Письмо для восстановления отправлено",
            });
        } finally {
            setLoading(false);
        }
    }
    return { notify, email, setEmail, loading, setLoading, handleSubmit };
}
