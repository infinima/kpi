import { useEffect } from "react";
import { useUserStore } from "@/store";

function SessionWatcher() {
    const { sessionExpired, setSessionExpired, logout } = useUserStore();

    useEffect(() => {
        if (sessionExpired) {
            alert("Ваша сессия истекла. Пожалуйста, войдите снова.");
            logout();
            setSessionExpired(false);
        }
    }, [sessionExpired]);

    return null;
}

export default SessionWatcher;