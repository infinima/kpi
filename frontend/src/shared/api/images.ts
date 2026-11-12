import { showApiError } from "./errorHelper.js";
import { ApiError } from "./errors.js";
import type { ApiNotifyOptions } from "./request.js";
import { request } from "./request.js";

export async function getImageBlob(path: string, signal?: AbortSignal): Promise<Blob | null> {
    try {
        return await request<Blob>({ method: "GET", path, responseType: "blob", headers: { Accept: "image/webp" }, signal });
    } catch (error) {
        if (error instanceof ApiError && error.status === 400) return null;
        throw error;
    }
}

export async function getImage(path: string, notify?: ApiNotifyOptions): Promise<string | null> {
    try {
        const blob = await getImageBlob(path);
        return blob ? URL.createObjectURL(blob) : null;
    } catch (error) {
        if (error instanceof ApiError && error.status === 400) return null;
        if (notify?.error) showApiError(typeof notify.error === "string" ? notify.error : error);
        return null;
    }
}
