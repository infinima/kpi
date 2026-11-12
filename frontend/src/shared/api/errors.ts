export type ApiErrorDetails = Record<string, unknown>;

/** Keeps error.code compatibility while callers migrate to the normalized fields. */
export class ApiError extends Error {
    readonly code: string;
    readonly status: number | null;
    readonly details: ApiErrorDetails;
    readonly error: { code: string; message: string; details: ApiErrorDetails; };
    readonly cause: unknown;

    constructor(code: string, message: string, status: number | null = null, details: ApiErrorDetails = {}, cause?: unknown) {
        super(message);
        this.name = "ApiError";
        this.code = code;
        this.status = status;
        this.details = details;
        this.error = { code, message, details };
        this.cause = cause;
    }
}

export function normalizeApiError(value: unknown, status: number | null = null): ApiError {
    if (value instanceof ApiError) return value;
    const payload = value && typeof value === "object" && "error" in value ? value.error : null;
    if (payload && typeof payload === "object") {
        const code = "code" in payload && typeof payload.code === "string" ? payload.code : "INTERNAL_ERROR";
        const message = "message" in payload && typeof payload.message === "string" ? payload.message : code;
        const details = "details" in payload && payload.details && typeof payload.details === "object"
            ? payload.details as ApiErrorDetails : {};
        return new ApiError(code, message, status, details, value);
    }
    if (status !== null) {
        return new ApiError(status === 401 ? "NO_TOKEN" : "INTERNAL_ERROR", status === 401 ? "Unauthorized" : "Ошибка запроса", status, {}, value);
    }
    return new ApiError("NETWORK_ERROR", value instanceof Error ? value.message : "Ошибка соединения", null, {}, value);
}

export function isSessionError(error: ApiError): boolean {
    return error.status === 401 && ["AUTH_REQUIRED", "NO_TOKEN", "INVALID_TOKEN", "INVALID_SESSION", "SESSION_NOT_FOUND"].includes(error.code);
}
