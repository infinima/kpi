import { useUser } from "@/store";
import { showApiError } from "@/api/errorHelper";

const BASE_URL = window.location.origin + "/api/";

export async function getImage(path: string): Promise<string | null> {

    const token = useUser.getState().token;

    try {
        const res = await fetch(BASE_URL + path, {
            method: "GET",
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                Accept: "image/webp",
            },
        });

        if (res.status === 401) {
            useUser.getState().logout();
            throw { error: { code: "NO_TOKEN" } };
        }

        if (res.status === 400) {
          return null;
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


        return url;

    } catch (err) {

        showApiError(err);
        return null;
    }
}