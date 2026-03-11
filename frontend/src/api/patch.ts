import { request } from "./request";
import type { ApiNotifyOptions } from "./request";

export async function apiPatch<T = any>(path: string, body?: any, notify?: ApiNotifyOptions): Promise<T> {
    return request<T>({
        method: "PATCH",
        path,
        body,
        notify,
    });
}
