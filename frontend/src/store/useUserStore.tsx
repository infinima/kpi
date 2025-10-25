import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
    id: string;
    name: string;
    email?: string;
}

interface UserState {
    user: User | null;
    token: string | null;
    loginTime: number | null;
    sessionExpired: boolean;

    setUser: (user: User, token: string) => void;
    logout: () => void;
    setSessionExpired: (flag: boolean) => void;
}

const EXPIRE_MS = 12 * 60 * 60 * 1000;

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            loginTime: null,
            sessionExpired: false,

            setUser: (user, token) =>
                set({ user, token, loginTime: Date.now(), sessionExpired: false }),

            logout: () => set({ user: null, token: null, loginTime: null }),
            setSessionExpired: (flag) => set({ sessionExpired: flag }),
        }),
        {
            name: "user-store",
            onRehydrateStorage: () => (state, error) => {
                if (!state) return;
                const now = Date.now();
                const expired =
                    state.loginTime && now - state.loginTime > EXPIRE_MS;
                if (expired) {
                    // console.log("⏰ Сессия пользователя устарела — очищаем user-store");
                    state.user = null;
                    state.token = null;
                    state.loginTime = null;
                    state.sessionExpired = true;
                }
            },
        }
    )
);