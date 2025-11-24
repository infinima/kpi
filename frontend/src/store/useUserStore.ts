import { create } from "zustand";
import {apiGet, apiPost} from "@/api";
import {useNotifications} from "@/store/useNotificationStore";

interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    rights: Record<string, boolean>;
}

interface UserState {
    user: User | null;
    token: string | null;
    guest: boolean;

    login: (token: string) => void;
    logout: () => void;
    fetchUser: () => Promise<void>;

    can: (right: string) => boolean;
}

export const useUser = create<UserState>((set, get) => ({

    user: null,
    token: null,
    guest: true,

    login: (token: string) => {
        localStorage.setItem("auth_token", token);
        set({ token, guest: false });
    },

    logout: async () => {
        const token = get().token;

        // если токена нет — просто выходим
        if (!token) {
            useNotifications.getState().addMessage({
                type: "success",
                text: "Вы вышли",
            });

            set({ user: null, token: null, guest: true });
            localStorage.removeItem("auth_token");
            return;
        }

        try {
            await apiPost("auth/logout");

            useNotifications.getState().addMessage({
                type: "success",
                text: "Вы вышли",
            });
        } catch {
            useNotifications.getState().addMessage({
                type: "warning",
                text: "Сессия уже была завершена",
            });
        }

        localStorage.removeItem("auth_token");

        set({
            user: null,
            token: null,
            guest: true,
        });
    },

    fetchUser: async () => {
        const token = get().token;
        if (!token) return;

        const data = await apiGet("auth/me?include=user");
        set({ user: data.user });
    },

    can: (right) => {
        const u = get().user;
        if (!u) return false;
        return u.rights?.[right] === true;
    },
}));