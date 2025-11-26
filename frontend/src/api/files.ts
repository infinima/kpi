import { useUser, useNotifications } from "@/store";
import { showApiError } from "./errorHelper";

const BASE_URL = window.location.origin + "/api/";

export async function apiGetFile(path: string, filename: string): Promise<void> {
    const token = useUser.getState().token;
    const notify = useNotifications.getState().addMessage;

    try {
        const res = await fetch(BASE_URL + path, {
            method: "GET",
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        if (res.status === 401) {
            useUser.getState().logout();
            throw { error: { code: "NO_TOKEN" } };
        }

        if (!res.ok) {
            let json = null;
            try {
                json = await res.json();
            } catch {
                throw { error: { code: "INTERNAL_ERROR" } };
            }
            throw json || { error: { code: "INTERNAL_ERROR" } };
        }

        const blob = await res.blob();

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();

        window.URL.revokeObjectURL(url);

        notify({
            type: "success",
            text: "Файл успешно скачан",
        });

    } catch (err) {
        showApiError(err);
        throw err;
    }
}