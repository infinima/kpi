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

export async function apiPatch<T = any>(path: string, body?: any): Promise<T> {
    const notify = useNotifications.getState().addMessage;

    try {
        const token = useUser.getState().token;

        const res = await fetch(BASE_URL + path, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (res.status === 401) {
            useUser.getState().logout();
            throw { error: { code: "NO_TOKEN" } };
        }

        const data = await parseResponse(res);

        if (!res.ok) {
            throw data || { error: { code: "INTERNAL_ERROR" } };
        }

        notify({
            type: "success",
            text: "Изменения сохранены",
        });

        return data;

    } catch (err) {
        showApiError(err);
        throw err;
    }
}