import { request } from "./request";
import type { ApiNotifyOptions } from "./request";

export async function apiGet<T = any>(path: string, notify?: ApiNotifyOptions): Promise<T> {
    return request<T>({
        method: "GET",
        path,
        notify,
    });
}
