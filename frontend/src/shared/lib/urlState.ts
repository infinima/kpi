export function readUrlState<T extends string>(params: URLSearchParams, key: string, fallback: T, allowed?: readonly T[]): T {
    const raw = params.get(key);
    return raw !== null && (!allowed || allowed.includes(raw as T)) ? raw as T : fallback;
}
export function writeUrlState<T extends string>(params: URLSearchParams, key: string, value: T, fallback: T): URLSearchParams {
    const next = new URLSearchParams(params);
    if (value === fallback) next.delete(key); else next.set(key, value);
    return next;
}
