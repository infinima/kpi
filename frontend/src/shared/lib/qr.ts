export const uuidPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export function extractUuidFromScannerPayload(raw: string) {
    const normalized = String(raw ?? "").trim();

    if (!normalized) {
        return null;
    }

    if (uuidPattern.test(normalized)) {
        return normalized;
    }

    try {
        const url = new URL(normalized);
        if (url.pathname.endsWith("/scanner")) {
            const data = url.searchParams.get("data")?.trim() ?? "";
            return uuidPattern.test(data) ? data : null;
        }
    } catch {
        return null;
    }

    return null;
}

export function decodeBase64Value(value: string) {
    try {
        const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
        return decodeURIComponent(
            Array.from(atob(padded))
                .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
                .join(""),
        );
    } catch {
        return null;
    }
}
