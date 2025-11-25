// /src/components/user/UserImage.tsx

import { useEffect, useState } from "react";
import { getImage } from "@/api";
import { imageCache } from "@/helpers/imageCache";   // ⭐ добавлено

interface UserImageProps {
    path: string;
    alt?: string;
    className?: string;
    fallbackLetter?: string;
}

export function UserImage({
                              path,
                              alt = "",
                              className = "",
                              fallbackLetter = "?",
                          }: UserImageProps) {
    const [src, setSrc] = useState<string | null>(() => imageCache.get(path) ?? null);

    useEffect(() => {
        let mounted = true;

        async function load() {
            // 1) пробуем достать из кеша
            const cached = imageCache.get(path);
            if (cached) {
                if (mounted) setSrc(cached);
                return;
            }

            // 2) грузим с сервера
            const url = await getImage(path);

            if (mounted && url) {
                imageCache.set(path, url); // 🔥 кладём в кеш
                setSrc(url);
            }
        }

        load();

        return () => {
            mounted = false;
        };
    }, [path]);

    if (src) {
        return <img src={src} alt={alt} className={className} />;
    }

    return (
        <div
            className={`flex items-center justify-center bg-hover dark:bg-dark-hover text-xl rounded-full ${className}`}
        >
            {fallbackLetter}
        </div>
    );
}