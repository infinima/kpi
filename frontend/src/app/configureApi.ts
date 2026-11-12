import { ensureUserSessionInitialized, useUser } from "../entities/session/model/session";
import { createHttpClient } from "../shared/api/httpClient";
import { ApiError } from "../shared/api/errors";
import { supportsDevRequest } from "../shared/api/devContract";
import { configureApi } from "../shared/api/runtime";
import { useNotifications } from "../shared/model/notifications";

export function configureAppApi(onMutation?: (path: string) => Promise<void>, onMaintenance?: () => void): void {
    configureApi({
        onMutation,
        request: createHttpClient({
            fetch: (input, init) => {
                const path = String(input).replace("https://api.dev.kpiturnir.ru/", "").replace(/^\/api\//, "");
                if (!supportsDevRequest(init?.method ?? "GET", path)) return Promise.reject(new ApiError("FEATURE_UNAVAILABLE", "Этот раздел пока недоступен в новой API"));
                return fetch(input, init);
            },
            baseUrl: import.meta.env.DEV ? "/api/" : "https://api.dev.kpiturnir.ru/",
            onMaintenance,
            prepareSession: ensureUserSessionInitialized,
            getToken: () => useUser.getState().token,
            onSessionExpired: () => useUser.getState().clearSession(),
        }),
        notify: (notification) => useNotifications.getState().addMessage(notification),
    });
}
