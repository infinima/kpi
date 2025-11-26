import { useUser } from "@/store";
import { showApiError } from "@/api/errorHelper";
import { cacheSet, cacheGet } from "@/helpers/imageCache";

const BASE_URL = window.location.origin + "/api/";

export async function getImage(path: string): Promise<string | null> {
    const cached = cacheGet(path);
    if (cached) return cached;

    const token = useUser.getState().token;

    try {
        const res = await fetch(BASE_URL + path, {
            method: "GET",
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                Accept: "image/*",
            },
        });

        if (res.status === 401) {
            useUser.getState().logout();
            throw { error: { code: "NO_TOKEN" } };
        }

        if (!res.ok) {
            let json = null;
            try {
                json = await res.json();
            } catch {}
            throw json || { error: { code: "INTERNAL_ERROR" } };
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        cacheSet(path, url);


        return url;

    } catch (err) {

        showApiError(err);
        return null;
    }
}