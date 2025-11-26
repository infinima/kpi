export const imageCache = new Map<string, string>();

export function cacheSet(path: string, url: string) {
    if (imageCache.has(path)) {
        URL.revokeObjectURL(imageCache.get(path)!);
    }
    imageCache.set(path, url);
}

export function cacheGet(path: string) {
    return imageCache.get(path) || null;
}