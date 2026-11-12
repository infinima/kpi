import { create } from "zustand";
import { useNotifications } from "../../../shared/model/notifications.js";
import { authApi } from "../../auth/api/authApi.js";
import type { PermissionAction, PermissionEntity, PermissionTarget, PermissionsResponse } from "../../permission/model/permissions.js";
import { hasGlobalPermission, hasPermission } from "../../permission/model/permissions.js";

// Compatibility for existing imports; permission types belong to the entity model.
export type { EntityPermissions, PermissionAction, PermissionEntity, PermissionMap, PermissionTarget, PermissionsResponse } from "../../permission/model/permissions.js";

const AUTH_TOKEN_KEY = "kpi_dev_auth_token";

function readStoredToken(): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    try {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
        return null;
    }
}

function storeToken(token: string | null) {
    try {
        if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
        else localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch { /* The in-memory session still works when browser storage is unavailable. */ }
}

const initialToken = readStoredToken();
let authInitializationPromise: Promise<void> | null = null;
let activeUserLoad: { token: string; promise: Promise<void>; } | null = null;

interface User {
    tg_id: string;
    photo: string;
    patronymic: string;
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    rights: PermissionsResponse;
}

interface UserState {
    user: User | null;
    token: string | null;
    guest: boolean;

    login: (token: string) => Promise<void>;
    logout: () => void;
    clearSession: () => void;
    fetchUser: () => Promise<void>;

    can: (entity: PermissionEntity, action: PermissionAction, target?: PermissionTarget) => boolean;
    canGlobal: (entity: PermissionEntity, action: PermissionAction) => boolean;
}

export function ensureUserSessionInitialized(): Promise<void> {
    if (!authInitializationPromise) {
        authInitializationPromise = Promise.resolve().then(() => {
            const { token } = useUser.getState();

            if (token) {
                return;
            }

            const storedToken = readStoredToken();

            if (storedToken) {
                useUser.setState({ token: storedToken, guest: false });
            }
        });
    }

    return authInitializationPromise;
}

export const useUser = create<UserState>((set, get) => ({

    user: null,
    token: initialToken,
    guest: !initialToken,

    login: async (token: string) => {
        storeToken(token);
        set({ token, user: null, guest: false });
        await get().fetchUser();
        if (get().token !== token) return;

        useNotifications.getState().addMessage({
            type: "success",
            text: "Добро пожаловать",
        });
    },

    logout: async () => {
        const token = get().token;

        if (!token) {
            set({ user: null, token: null, guest: true });
            storeToken(null);
            return;
        }

        try {
            await authApi.logout();
            if (get().token !== token) return;
            useNotifications.getState().addMessage({
                type: "success",
                text: "До свидания",
            });
        } catch {
            if (get().token !== token) return;
            useNotifications.getState().addMessage({
                type: "warning",
                text: "Сессия уже была завершена",
            });
        }

        if (get().token === token) {
            storeToken(null);
            set({ user: null, token: null, guest: true });
        }
    },

    clearSession: () => {
        storeToken(null);
        set({ user: null, token: null, guest: true });
    },

    fetchUser: async () => {
        const token = get().token;
        if (!token) return;
        if (activeUserLoad?.token === token) return activeUserLoad.promise;
        const promise = (async () => {
            const data = await authApi.me();
            if (get().token !== token) return;
            const rights = await authApi.permissions();
            if (get().token !== token) return;
            set({ user: { ...data.user, rights } });
        })();
        activeUserLoad = { token, promise };
        try { await promise; }
        finally { if (activeUserLoad?.promise === promise) activeUserLoad = null; }
    },

    can: (entity, action, target) => hasPermission(get().user?.rights, entity, action, target),

    canGlobal: (entity, action) => hasGlobalPermission(get().user?.rights, entity, action),

}));
