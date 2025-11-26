import { useEffect, useState } from "react";
import { getImage } from "@/api";

interface UserImageProps {
    path: string;
    alt?: string;
    className?: string;
    fallbackLetter?: string;
}

export function BaseImage({
                              path,
                              alt = "",
                              className = "",
                              fallbackLetter = "?",
                          }: UserImageProps) {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        let revokedUrl: string | null = null;
        let isMounted = true;

        async function load() {
            const loadedUrl = await getImage(path);

            if (!loadedUrl || !isMounted) return;


            setUrl(loadedUrl);
        }

        load();

        return () => {
            isMounted = false;
            if (revokedUrl) {
                URL.revokeObjectURL(revokedUrl);
            }
        };
    }, [path]);

    if (!url) {
        return (
            <div
                className={`flex items-center justify-center bg-hover dark:bg-dark-hover text-xl rounded-full ${className}`}
            >
                {fallbackLetter}
            </div>
        );
    }

    return <img src={url} alt={alt} className={className} />;
}