import { request } from "./request";
import type { ApiNotifyOptions } from "./request";

export async function apiPost<T = any>(path: string, body?: any, notify?: ApiNotifyOptions): Promise<T> {
    return request<T>({
        method: "POST",
        path,
        body,
        notify,
    });
}
