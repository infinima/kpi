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

export async function apiPost<T = any>(path: string, body?: any): Promise<T> {

    try {
        const token = useUser.getState().token;

        const res = await fetch(BASE_URL + path, {
            method: "POST",
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


        return data;

    } catch (err) {
        showApiError(err);
        throw err;
    }
}