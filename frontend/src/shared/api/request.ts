import { showApiError } from "./errorHelper.js";
import type { HttpRequestOptions } from "./httpClient.js";
import { getApiRuntime } from "./runtime.js";

export type ApiNotifyOptions = {
    success?: string;
    error?: string | true;
};

export async function request<T = unknown>({ notify, ...options }: HttpRequestOptions & { notify?: ApiNotifyOptions; }): Promise<T> {
    try {
        const data = await getApiRuntime().request<T>(options);
        if (options.method !== "GET" && !options.path.startsWith("auth/")) await getApiRuntime().onMutation?.(options.path);
        if (notify?.success) getApiRuntime().notify({ type: "success", text: notify.success });
        return data;
    } catch (error) {
        if (notify?.error) showApiError(typeof notify.error === "string" ? notify.error : error);
        throw error;
    }
}
