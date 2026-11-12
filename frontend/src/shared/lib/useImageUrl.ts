import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getImageBlob } from "../api/images";

export function useImageUrl(path: string) {
    const [state, setState] = useState<{ path: string; url: string | null; }>({ path, url: null });
    const image = useQuery({ queryKey: ["image", path], queryFn: ({ signal }) => getImageBlob(path, signal) });
    useEffect(() => {
        const url = image.data ? URL.createObjectURL(image.data) : null;
        setState({ path, url });
        return () => { if (url) URL.revokeObjectURL(url); };
    }, [path, image.data]);
    return state.path === path ? state.url : null;
}
