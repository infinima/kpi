import { useEffect, useState } from "react";
import { getImage } from "@/api";

interface RemoteImageProps {
    path: string;
    alt?: string;
    className?: string;
    fallbackLetter: string; // буква
}

export function UserImage({
                                path,
                                alt = "",
                                className = "",
                                fallbackLetter,
                            }: RemoteImageProps) {
    const [url, setUrl] = useState<string | null>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let alive = true;
        let temp: string | null = null;

        async function load() {
            const u = await getImage(path);

            if (alive) {
                temp = u;
                setUrl(u);       // если null → фото нет
                setLoaded(true);
            }
        }

        load();

        return () => {
            alive = false;
            if (temp) URL.revokeObjectURL(temp);
        };
    }, [path]);

    if (!loaded) {
        return (
            <div
                className={`
                    ${className}
                    rounded-full bg-hover dark:bg-dark-hover 
                    flex items-center justify-center
                    text-lg font-semibold text-text-muted
                `}
            >
                {fallbackLetter}
            </div>
        );
    }

    if (!url) {
        return (
            <div
                className={`
                    ${className}
                    rounded-full bg-hover dark:bg-dark-hover 
                    flex items-center justify-center
                    text-lg font-semibold text-text-muted
                `}
            >
                {fallbackLetter}
            </div>
        );
    }

    return <img src={url} alt={alt} className={className} />;
}