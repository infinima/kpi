import type { ApiNotifyOptions } from "./request";
import { request } from "./request";

export async function apiGetFile(path: string, filename: string, notify?: ApiNotifyOptions): Promise<void> {
    const blob = await request<Blob>({
        method: "GET",
        path,
        responseType: "blob",
        notify,
    });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
}
