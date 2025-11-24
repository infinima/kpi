import { useUser } from "@/store";

export async function getImage(path: string): Promise<string | null> {
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
        return URL.createObjectURL(blob);
    } catch {
        return null;
    }
}