// @ts-ignore
import TelegramLoginButtonReact from "react-telegram-login";
import { apiPost } from "@/api";
import { useUser } from "@/store";

export function TelegramButton({ onSuccess }: { onSuccess: () => void }) {
    const loginUser = useUser(s => s.login);

    const onTelegramAuth = async (user: any) => {
        const res = await apiPost("auth/tg-login", user);
        await loginUser(res.token);

        onSuccess();
    };

    return (
        <TelegramLoginButtonReact
            botName="kpiturnir_bot"
            dataOnauth={onTelegramAuth}
            buttonSize="large"
        />
    );
}
