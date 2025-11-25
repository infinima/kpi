import { useUser } from "@/store";
import { showApiError } from "./errorHelper";

const BASE_URL = window.location.origin + "/api/";

export async function apiGetFile(path: string, filename: string) {
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
            throw { error: { code: "NO_TOKEN" } };
        }

        if (!res.ok) {
            // ❗ пытаемся считать ошибку как JSON
            let errJson = null;
            try {
                errJson = await res.json();
            } catch {
                throw { error: { code: "INTERNAL_ERROR" } };
            }
            throw errJson;
        }

        // 🟦 blob для файлов
        const blob = await res.blob();

        // создать временную ссылку
        const url = window.URL.createObjectURL(blob);

        // скачать файл
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();

        // освободить URL
        window.URL.revokeObjectURL(url);

    } catch (err) {
        showApiError(err);
        throw err;
    }
}