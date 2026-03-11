import type { ApiNotifyOptions } from "./request";
import { BASE_URL, parseJsonResponse } from "./request";
import { useUser } from "@/store";
import { showApiError } from "./errorHelper";

export async function getImage(path: string, notify?: ApiNotifyOptions): Promise<string | null> {
    try {
        const token = useUser.getState().token;
        const res = await fetch(BASE_URL + path, {
            method: "GET",
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                Accept: "image/webp",
            },
        });

        if (res.status === 400) {
            return null;
        }

        if (!res.ok) {
            const json = await parseJsonResponse(res);
            if (res.status === 401) {
                useUser.getState().logout();
                throw { error: { code: "NO_TOKEN", message: "Unauthorized" } };
            }
            throw json || { error: { code: "INTERNAL_ERROR" } };
        }

        const blob = await res.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        if (notify?.error) {
            if (typeof notify.error === "string") {
                showApiError(notify.error);
            } else {
                showApiError(error);
            }
        }
        return null;
    }
}
