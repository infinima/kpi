import { useUser, useNotifications } from "@/store";
import { ensureUserSessionInitialized } from "@/store/useUserStore";
import { showApiError } from "./errorHelper";
import { apiPost } from "@/api";

const BASE_URL = window.location.origin + "/api/";
const SESSION_ERROR_CODES = new Set([
    "INVALID_TOKEN",
    "INVALID_SESSION",
    "SESSION_NOT_FOUND",
]);

async function parseResponse(res: Response) {
    try {
        return await res.json();
    } catch {
        return null;
    }
}

const RELATED_ERRORS = new Set([
    "EVENT_HAS_RELATED_OBJECTS",
    "LOCATION_HAS_RELATED_OBJECTS",
    "LEAGUE_HAS_RELATED_OBJECTS",
]);

export async function apiDelete(path: string, restoreId?: number): Promise<void> {
    await ensureUserSessionInitialized();
    const token = useUser.getState().token;
    const notify = useNotifications.getState().addMessage;

    async function sendDelete(force: boolean = false) {
        const url = BASE_URL + path + (force ? "?force=true" : "");

        const res = await fetch(url, {
            method: "DELETE",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const json = await parseResponse(res);

        if (res.status === 401) {
            const code = json?.error?.code;
            if (token && code && SESSION_ERROR_CODES.has(code)) {
                useUser.getState().clearSession();
            }
            throw json || { error: { code: "NO_TOKEN" } };
        }

        if (!res.ok) {
            throw json || { error: { code: "INTERNAL_ERROR" } };
        }

        return json;
    }

    try {
        // ▶ Первая попытка удалить
        await sendDelete(false);

        notify({
            type: "success",
            text: "Объект удалён",
            actionText: restoreId ? "Восстановить" : undefined,
            action: restoreId ? async () => apiPost(`${path}/restore`) : undefined,
        });

    } catch (err: any) {
        const code = err?.error?.code;

        if (RELATED_ERRORS.has(code)) {

            const details = err.error.details || {};

            let msg = "Нельзя удалить объект: есть связанные данные.";
            msg += "\n\nПривязано:";
            if (details.locations) msg += ` • Площадки: ${details.locations}`;
            if (details.leagues)   msg += ` • Лиги: ${details.leagues}`;
            if (details.teams)     msg += ` • Команды: ${details.teams}`;

            notify({
                type: "warning",
                text: msg,
                actionText: "Удалить принудительно",
                action: async () => {
                    try {
                        await sendDelete(true);

                        notify({
                            type: "success",
                            text: "Удалено принудительно",
                            actionText: restoreId ? "Восстановить" : undefined,
                            action: restoreId
                                ? async () => apiPost(`${path}/restore`)
                                : undefined,
                        });

                    } catch (forceErr) {
                        showApiError(forceErr);
                    }
                },
            });

            return;
        }

        showApiError(err);
        throw err;
    }
}
