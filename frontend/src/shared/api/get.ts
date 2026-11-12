import type { ApiNotifyOptions } from "./request.js";
import { request } from "./request.js";

export async function apiGet<T = unknown>(path: string, notify?: ApiNotifyOptions): Promise<T> {
    return request<T>({
        method: "GET",
        path,
        notify,
    });
}
