export const imageCache = new Map<string, Blob>();

export function cacheSet(path: string, blob: Blob) {
    imageCache.set(path, blob);
}

export function cacheGet(path: string): Blob | null {
    return imageCache.get(path) || null;
}