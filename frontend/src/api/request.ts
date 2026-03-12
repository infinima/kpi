import { useNotifications, useUser } from "@/store";
import { showApiError } from "./errorHelper";

const BASE_URL = `${window.location.origin}/api/`;

export type ApiNotifyOptions = {
    success?: string;
    error?: string | true;
};

type ResponseType = "json" | "blob";

type RequestOptions = {
    method: "GET" | "POST" | "PATCH" | "DELETE";
    path: string;
    body?: unknown;
    headers?: Record<string, string>;
    responseType?: ResponseType;
    notify?: ApiNotifyOptions;
};

const SESSION_ERROR_CODES = new Set([
    "INVALID_TOKEN",
    "INVALID_SESSION",
    "SESSION_NOT_FOUND",
]);

async function parseJsonResponse(res: Response) {
    try {
        return await res.json();
    } catch {
        return null;
    }
}

function notifySuccess(message?: string) {
    if (!message) return;
    useNotifications.getState().addMessage({
        type: "success",
        text: message,
    });
}

function notifyError(error: unknown, errorOption?: string | true) {
    if (!errorOption) return;

    if (typeof errorOption === "string") {
        useNotifications.getState().addMessage({
            type: "error",
            text: errorOption,
        });
        return;
    }

    showApiError(error);
}

export async function request<T = unknown>({
    method,
    path,
    body,
    headers,
    responseType = "json",
    notify,
}: RequestOptions): Promise<T> {
    try {
        const token = useUser.getState().token;

        const res = await fetch(BASE_URL + path, {
            method,
            headers: {
                ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...headers,
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });

        if (res.status === 401) {
            const data = await parseJsonResponse(res);
            const code = data?.error?.code;

            if (token && code && SESSION_ERROR_CODES.has(code)) {
                useUser.getState().clearSession();
            }

            throw data || { error: { code: "NO_TOKEN", message: "Unauthorized" } };
        }

        if (!res.ok) {
            const data = await parseJsonResponse(res);
            throw data || { error: { code: "INTERNAL_ERROR" } };
        }

        const data = responseType === "blob"
            ? await res.blob()
            : await parseJsonResponse(res);

        notifySuccess(notify?.success);
        return data as T;
    } catch (error) {
        notifyError(error, notify?.error);
        throw error;
    }
}

export { BASE_URL, parseJsonResponse };
