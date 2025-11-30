import { useUser } from "@/store";
import { apiPost } from "@/api";
import { useEffect, useRef } from "react";

export function TelegramLoginButton() {

    const loginUser = useUser(s => s.login);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        (window as any).TelegramLoginWidget = {
            dataOnauth: async (user: any) => {
                const res = await apiPost("auth/tg-login", user);
                await loginUser(res.token);
            }
        };

        const script = document.createElement("script");
        script.src = "https://telegram.org/js/telegram-widget.js?22";
        script.setAttribute("data-telegram-login", "kpitournir_bot");
        script.setAttribute("data-onauth", "TelegramLoginWidget.dataOnauth");
        script.setAttribute("data-size", "large");
        script.async = true;

        containerRef.current?.appendChild(script);
    }, []);

    return <div ref={containerRef} className="flex justify-center mt-4" />;
}
