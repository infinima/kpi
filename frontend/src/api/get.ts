import { useUser } from "@/store";
import { showApiError } from "./errorHelper";

const BASE_URL = window.location.origin + "/api/";

async function parseResponse(res: Response) {
    try {
        return await res.json();
    } catch {
        return null;
    }
}

export async function apiGet<T = any>(path: string): Promise<T> {
    try {
        const token = useUser.getState().token;

        const res = await fetch(BASE_URL + path, {
            method: "GET",
            headers: {
                Authorization: token ? `Bearer ${token}` : "",
            },
        });

        if (res.status === 401) {
            useUser.getState().logout();
            throw {
                error: { code: "NO_TOKEN", message: "Unauthorized" }
            };
        }

        if (!res.ok) {
            const json = await parseResponse(res);
            throw json || { error: { code: "INTERNAL_ERROR" } };
        }

        return parseResponse(res);
    } catch (err) {
        showApiError(err);
        throw err;
    }
}