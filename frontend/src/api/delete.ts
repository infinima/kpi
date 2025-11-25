import { useUser, useNotifications } from "@/store";
import { showApiError } from "./errorHelper";

const BASE_URL = window.location.origin + "/api/";

async function parseResponse(res: Response) {
    try {
        return await res.json();
    } catch {
        return null;
    }
}

/**
 * Удаление объекта + возможность восстановления.
 * Поддерживает EVENT_HAS_RELATED_OBJECTS → force delete.
 */
export async function apiDelete(path: string, restoreId?: number): Promise<void> {
    const token = useUser.getState().token;
    const notify = useNotifications.getState().addMessage;

    async function sendDelete(force: boolean = false) {
        const url = force ? `${BASE_URL}${path}?force=true` : `${BASE_URL}${path}`;

        const res = await fetch(url, {
            method: "DELETE",
            headers: { Authorization: token ? `Bearer ${token}` : "" },
        });

        if (res.status === 401) {
            useUser.getState().logout();
            throw { error: { code: "NO_TOKEN" } };
        }

        const json = await parseResponse(res);

        if (!res.ok) {
            throw json || { error: { code: "INTERNAL_ERROR" } };
        }

        return json;
    }

    try {
        // ПЕРВАЯ попытка удалить
        await sendDelete(false);

        // УСПЕХ
        notify({
            type: "success",
            text: "Объект удалён",
            actionText: restoreId ? "Восстановить" : undefined,
            action: restoreId
                ? async () => restoreDeletedObject(restoreId, notify, token,path)
                : undefined
        });

    } catch (err: any) {
        const code = err?.error?.code;

        // -----------------------------------------
        // ⛔ СЛУЧАЙ: Есть связанные объекты
        // -----------------------------------------
        if (code === "EVENT_HAS_RELATED_OBJECTS" || code === "LOCATION_HAS_RELATED_OBJECTS") {
            const details = err.error.details || {};

            let msg = "Нельзя удалить объект: есть связанные данные.";
            msg += "\n\nЧто привязано:";
            if (details.locations) msg += `\n• Локаций: ${details.locations}`;
            if (details.leagues)   msg += `\n• Лиг: ${details.leagues}`;
            if (details.teams)     msg += `\n• Команд: ${details.teams}`;

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
                                ? async () => restoreDeletedObject(restoreId, notify, token,path)
                                : undefined
                        });
                    } catch (e) {
                        showApiError(e);
                    }
                },
            });

            return;
        }

        // Остальные ошибки
        showApiError(err);
        throw err;
    }
}


// ------------------------------------------------------------
// Восстановление объекта
// ------------------------------------------------------------
async function restoreDeletedObject(
    id: number,
    notify: any,
    token: string | null,
path: string
) {
    try {
        const res = await fetch(`${BASE_URL}${path}/restore`, {
            method: "POST",
            headers: { Authorization: token ? `Bearer ${token}` : "" }
        });

        if (!res.ok) {
            const json = await res.json().catch(() => null);
            throw json || { error: { code: "INTERNAL_ERROR" } };
        }

        notify({
            type: "success",
            text: "Объект восстановлен"
        });
    } catch (err) {
        showApiError(err);
    }
}