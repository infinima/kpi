import { isSessionError, normalizeApiError, type ApiError } from "./errors.js";

export type HttpRequestOptions = {
    method: "GET" | "POST" | "PATCH" | "DELETE";
    path: string;
    body?: unknown;
    headers?: Record<string, string>;
    responseType?: "json" | "blob";
    signal?: AbortSignal;
};

export type HttpClientDependencies = {
    baseUrl: string;
    fetch?: typeof fetch;
    prepareSession?: () => Promise<void>;
    getToken?: () => string | null;
    onSessionExpired?: (token: string) => void;
    onMaintenance?: (error: ApiError) => void;
};

async function parseJsonResponse(response: Response): Promise<unknown> {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

export function createHttpClient(dependencies: HttpClientDependencies) {
    return async function httpRequest<T = unknown>({ method, path, body, headers, responseType = "json", signal }: HttpRequestOptions): Promise<T> {
        try {
            await dependencies.prepareSession?.();
            const token = dependencies.getToken?.() ?? null;
            const response = await (dependencies.fetch ?? globalThis.fetch)(dependencies.baseUrl + path, {
                method,
                headers: {
                    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    ...headers,
                },
                body: body !== undefined ? JSON.stringify(body) : undefined,
                signal,
            });

            if (!response.ok) {
                const error = normalizeApiError(await parseJsonResponse(response), response.status);
                if (error.status === 503 && error.code === "MAINTENANCE" && path.split("?")[0] !== "maintenance") dependencies.onMaintenance?.(error);
                if (token && isSessionError(error) && dependencies.getToken?.() === token) {
                    dependencies.onSessionExpired?.(token);
                }
                throw error;
            }

            return (responseType === "blob" ? await response.blob() : await parseJsonResponse(response)) as T;
        } catch (error) {
            // Cancellation belongs to the caller and must not turn into a network failure.
            if (error instanceof Error && error.name === "AbortError") throw error;
            throw normalizeApiError(error);
        }
    };
}

export type HttpClient = ReturnType<typeof createHttpClient>;
