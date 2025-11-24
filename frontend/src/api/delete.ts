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

export async function apiDelete(path: string, restoreId?: number): Promise<void> {
    try {
        const token = useUser.getState().token;
        const notify = useNotifications.getState().addMessage;

        const res = await fetch(BASE_URL + path, {
            method: "DELETE",
            headers: {
                Authorization: token ? `Bearer ${token}` : "",
            },
        });

        if (res.status === 401) {
            useUser.getState().logout();
            throw { error: { code: "NO_TOKEN" } };
        }

        if (!res.ok) {
            const json = await parseResponse(res);
            throw json || { error: { code: "INTERNAL_ERROR" } };
        }

        // -------------------------------
        // SUCCESS → показать уведомление
        // -------------------------------
        notify({
            type: "success",
            text: "Пользователь удалён",
            actionText: "Восстановить",
            action: async () => {
                try {
                    const restoreRes = await fetch(
                        `${BASE_URL}users/${restoreId}/restore`,
                        {
                            method: "POST",
                            headers: {
                                Authorization: token ? `Bearer ${token}` : "",
                            },
                        }
                    );

                    if (!restoreRes.ok) {
                        const json = await parseResponse(restoreRes);
                        throw json || { error: { code: "INTERNAL_ERROR" } };
                    }

                    notify({
                        type: "success",
                        text: "Пользователь восстановлен",
                    });
                } catch (e) {
                    showApiError(e);
                }
            }
        });

    } catch (err) {
        showApiError(err);
        throw err;
    }
}