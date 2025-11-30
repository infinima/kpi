import TelegramLoginButtonReact from "react-telegram-login";
import { apiPost } from "@/api";
import { useUser } from "@/store";

export function TelegramButton() {
    const loginUser = useUser(s => s.login);

    const onTelegramAuth = async (user: any) => {
        console.log("TG USER:", user);

        const res = await apiPost("auth/tg-login", user);
        await loginUser(res.token);
    };

    return (
        <TelegramLoginButtonReact
            botName="kpitournir_bot"
    dataOnauth={onTelegramAuth}
    buttonSize="large"
        />
    );
}
