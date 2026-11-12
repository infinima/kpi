import { showApiError } from "./errorHelper.js";
import { apiPost } from "./post.js";
import { request } from "./request.js";
import { getApiRuntime } from "./runtime.js";
export async function apiDelete(path: string, restoreId?: number): Promise<void> {
    try {
        await request({ method: "DELETE", path });
        getApiRuntime().notify({ type: "success", text: "Объект удалён", actionText: restoreId ? "Восстановить" : undefined,
            action: restoreId ? async () => apiPost(`${path}/restore`) : undefined });
    } catch (error) { showApiError(error); throw error; }
}
