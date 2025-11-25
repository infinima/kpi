// /src/api/getImage.ts

import { useUser } from "@/store";
import { imageCache, cacheSet, cacheGet } from "@/helpers/imageCache";

export async function getImage(path: string): Promise<string | null> {
    const cached = cacheGet(path);
    if (cached) return cached;

    const token = useUser.getState().token;

    try {
        const res = await fetch(`/api/${path}`, {
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                Accept: "image/*",
            },
        });

        if (!res.ok) return null;

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        cacheSet(path, url);

        return url;
    } catch {
        return null;
    }
}