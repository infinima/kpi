import type { ApiNotifyOptions } from "./request.js";
import { request } from "./request.js";

export async function apiPost<T = unknown>(path: string, body?: unknown, notify?: ApiNotifyOptions): Promise<T> {
    return request<T>({
        method: "POST",
        path,
        body,
        notify,
    });
}
